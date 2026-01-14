// backend/src/api/controllers/JobController.js - UPDATED
const { v4: uuidv4 } = require('uuid');
const Job = require('../../models/Job');
const Document = require('../../models/Document');
const Lead = require('../../models/Lead');
const Result = require('../../models/Result');
const Supplier = require('../../models/Supplier');
const StorageService = require('../../services/storage/StorageService');
const OCRService = require('../../services/ocr/OCRService');
const AIOrchestrator = require('../../services/ai/AIOrchestrator');
const User = require('../../models/User');
const logger = require('../../utils/logger');

class JobController {
  /**
   * Create a new job and upload document
   */
  async createJob(req, res, next) {
    try {
      const { email, tier = 'free', metadata = {} } = req.body;
      const file = req.file;

      console.log('Upload request received:', { email, file: file?.originalname, user: req.user?._id });

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: 'Only PDF and image files (JPG, PNG, WEBP) are accepted'
        });
      }

      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'File exceeds 10MB limit'
        });
      }

      // Find or create lead
      let lead = await Lead.findOne({ email: email.toLowerCase() });
      if (!lead) {
        lead = await Lead.create({
          email: email.toLowerCase(),
          source: metadata.source || 'free_upload'
        });
        logger.info(`New lead created: ${email}`);
      }

      // Create job
      let jobTier = 'Free';
      let userId = req.user?._id;

      if (userId) {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(401).json({ success: false, error: 'User not found' });
        }

        // Check Quota / Credits
        if (user.subscription.credits > 0) {
          // Use Credit
          user.subscription.credits -= 1;
          jobTier = user.subscription.plan || 'Standard';
          await user.save();
        } else {
          // Check Free Monthly Limit
          const now = new Date();
          const lastFreeReport = user.subscription.freeReportDate;

          let canUseFree = true;
          if (lastFreeReport) {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            if (lastFreeReport > oneMonthAgo) {
              canUseFree = false;
            }
          }

          if (!canUseFree) {
            return res.status(403).json({
              success: false,
              error: 'Monthly free limit reached. Please buy credits.',
              nextAvailableDate: lastFreeReport ? new Date(new Date(lastFreeReport).setMonth(new Date(lastFreeReport).getMonth() + 1)) : null
            });
          }

          // Mark free usage
          user.subscription.freeReportDate = now;
          await user.save();
          jobTier = 'Free';
        }
      } else {
        // Guest User - Allow Free Tier for now
        // In a real app, we might check IP rate limits here
        jobTier = 'Free';
        logger.info(`Guest upload using email: ${email}`);
      }

      const jobPublicId = uuidv4();
      const job = await Job.create({
        jobId: jobPublicId,
        leadId: lead._id,
        userId: req.user?._id,
        tier: jobTier, // Use calculated tier
        status: 'pending',
        processingSteps: [{ step: 'upload', status: 'in_progress' }],
        metadata: {
          ...metadata,
          filename: file.originalname,
          fileSize: file.size,
          uploadedAt: new Date()
        }
      });

      logger.info(`Job created: ${jobPublicId} for ${email}`);

      try {
        // Upload file
        const uploadResult = await StorageService.uploadFile(file.buffer, {
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          jobId: jobPublicId,
          userId: req.user?._id?.toString()
        });

        logger.info(`File uploaded to storage: ${uploadResult.storageKey}`);

        // Create document
        const document = await Document.create({
          jobId: job._id,
          userId: req.user?._id,
          originalFilename: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          storageKey: uploadResult.storageKey,
          checksumMD5: uploadResult.checksumMD5,
          checksumSHA256: uploadResult.checksumSHA256,
          extractionStatus: 'pending'
        });

        // Update job
        job.documents.push(document._id);
        await job.updateProcessingStep('upload', 'completed');
        await job.save();

        logger.info(`Document created: ${document._id}`);

        // Queue for production processing
        setTimeout(async () => {
          try {
            // 1. Extraction Phase
            await job.updateProcessingStep('extraction', 'in_progress');
            await job.save();

            let extractedText = '';
            let ocrMetadata = {};

            if (file.mimetype === 'text/plain') {
              extractedText = file.buffer.toString('utf8');
              ocrMetadata = { method: 'text_direct' };
            } else {
              try {
                const ocrResult = await OCRService.extractTextFromPDF(file.buffer);
                extractedText = ocrResult.text;
                ocrMetadata = {
                  method: ocrResult.method,
                  ocrConfidence: ocrResult.ocrConfidence,
                  processingTime: ocrResult.processingTime
                };
              } catch (ocrErr) {
                logger.error('OCR failed, falling back to basic extraction', ocrErr);
                extractedText = file.buffer.toString('binary').replace(/[^\x20-\x7E\n]/g, ''); // Crude fallback
                ocrMetadata = { method: 'fallback_binary' };
              }
            }

            if (!extractedText || extractedText.length < 10) {
              throw new Error('No readable text found in document');
            }

            await job.updateProcessingStep('extraction', 'completed');
            await job.save();

            // 2. Analysis Phase
            await job.updateProcessingStep('analysis', 'in_progress');
            await job.save();

            // Call real AI
            const aiOutcome = await AIOrchestrator.analyzeQuote(
              extractedText,
              job.tier.toLowerCase(),
              { ...job.metadata, ...ocrMetadata }
            );

            // 3. Map result based on tier
            let resultData = {
              jobId: job._id,
              userId: job.userId,
              tier: job.tier,
              extractedText: extractedText.substring(0, 10000), // Cap it
              analysisAccuracy: aiOutcome.confidenceLevel === 'high' ? 95 : 80,
              confidence: 90
            };

            if (job.tier.toLowerCase() === 'free') {
              resultData = {
                ...resultData,
                summary: aiOutcome.freeSummary?.overview || 'Quote overview generated.',
                verdict: 'good',
                verdictScore: 70,
                supplierInfo: aiOutcome.contractorProfile,
                detailedReview: aiOutcome.freeSummary?.mainPoints?.join('\n') || ''
              };
            } else {
              // Standard/Premium
              const analysis = aiOutcome.analysis;
              resultData = {
                ...resultData,
                summary: analysis.pricingAnalysis?.comparableWork?.substring(0, 200) || 'Detailed quote analysis completed.',
                verdict: analysis.pricingAnalysis?.assessment === 'appears_high' ? 'overpriced' : 'good',
                verdictScore: analysis.confidenceLevel === 'very_high' ? 90 : 80,
                overallCost: analysis.pricingAnalysis?.totalAmount,
                fairPriceRange: {
                  min: analysis.pricingAnalysis?.priceRange?.low,
                  max: analysis.pricingAnalysis?.priceRange?.high
                },
                costBreakdown: analysis.costBreakdown?.map(item => ({
                  description: item.item,
                  totalPrice: item.amount,
                  category: item.category,
                  flagged: item.notes?.toLowerCase().includes('red flag')
                })),
                redFlags: analysis.redFlags?.map(flag => ({
                  title: flag.category.replace('_', ' ').toUpperCase(),
                  description: flag.description,
                  severity: flag.severity === 'critical' ? 'high' : flag.severity,
                  category: flag.category
                })),
                questionsToAsk: analysis.questionsToAsk?.map(q => ({
                  question: q,
                  importance: 'should-ask'
                })),
                detailedReview: analysis.pricingAnalysis?.disclaimer || '',
                supplierInfo: analysis.contractorProfile
              };
            }

            const finalResult = await Result.create(resultData);

            // 4. Linkage & Completion
            job.result = finalResult._id;
            await job.updateProcessingStep('analysis', 'completed');
            job.status = 'completed';
            await job.save();

            logger.info(`Job ${jobPublicId} processing completed. Result: ${finalResult._id}`);

            // Send completion email
            try {
              const EmailService = require('../../services/email/EmailService');
              const user = await User.findById(job.userId);
              if (user && user.email) {
                await EmailService.sendJobCompletionEmail(user, job);
              }
            } catch (emailErr) {
              logger.error('Failed to send completion email', emailErr);
            }
          } catch (error) {
            logger.error(`Job processing failed: ${jobPublicId}`, error);
            job.status = 'failed';
            await job.save();
          }
        }, 500);

        return res.status(201).json({
          success: true,
          data: {
            jobId: jobPublicId,
            status: job.status,
            tier: job.tier,
            createdAt: job.createdAt,
            message: 'File uploaded successfully, processing started'
          }
        });

      } catch (uploadError) {
        logger.error('File upload failed:', uploadError);
        job.status = 'failed';
        await job.save();

        return res.status(500).json({
          success: false,
          error: 'Failed to upload file to storage'
        });
      }
    } catch (error) {
      logger.error('Job creation failed:', error);
      next(error);
    }
  }

  /**
   * Get all jobs for logged-in user
   */
  async getUserJobs(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const jobs = await Job.find({
        userId: req.user._id,
        deletedAt: null
      })
        .sort({ createdAt: -1 })
        .populate('documents', 'originalFilename fileSize')
        .lean();

      // Format response
      const formattedJobs = jobs.map(job => ({
        id: job._id,
        jobId: job.jobId,
        status: job.status,
        tier: job.tier,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        documents: job.documents,
        processingSteps: job.processingSteps,
        metadata: job.metadata
      }));

      res.json({
        success: true,
        data: formattedJobs
      });
    } catch (error) {
      logger.error('Failed to fetch user jobs:', error);
      next(error);
    }
  }

  /**
   * Get single job
   */
  async getJob(req, res, next) {
    try {
      const job = await Job.findOne({ jobId: req.params.jobId })
        .populate('documents')
        .lean();

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      if (req.user && job.userId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: job
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete job
   */
  async deleteJob(req, res, next) {
    try {
      const job = await Job.findOne({ jobId: req.params.jobId });
      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      job.deletedAt = new Date();
      await job.save();

      res.json({
        success: true,
        message: 'Job deleted'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(req, res, next) {
    try {
      const job = await Job.findOne({ jobId: req.params.jobId })
        .select('jobId status processingSteps createdAt updatedAt')
        .lean();

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      res.json({
        success: true,
        data: {
          jobId: job.jobId,
          status: job.status,
          processingSteps: job.processingSteps,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get job result (analysis)
   */
  async getJobResult(req, res, next) {
    try {
      const job = await Job.findOne({ jobId: req.params.jobId })
        .populate('result');

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      if (req.user && job.userId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      if (!job.result) {
        // Fallback: Check if there's a result ID that failed to populate OR a result that exists but isn't linked
        const Result = require('../../models/Result');
        const fallbackResult = await Result.findOne({ jobId: job._id });

        if (fallbackResult) {
          // Auto-repair linkage
          job.result = fallbackResult._id;
          if (job.status !== 'completed') job.status = 'completed';
          await job.save();

          return res.json({
            success: true,
            data: fallbackResult
          });
        }

        return res.status(404).json({
          success: false,
          error: 'Result not available yet'
        });
      }

      res.json({
        success: true,
        data: job.result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download document
   */
  async downloadDocument(req, res, next) {
    try {
      const document = await Document.findById(req.params.documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Check access
      const job = await Job.findById(document.jobId);
      if (req.user && job.userId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const signedUrl = await StorageService.getSignedUrl(document.storageKey);
      res.json({
        success: true,
        data: { url: signedUrl }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit job rating
   */
  async submitRating(req, res, next) {
    try {
      const { rating } = req.body;
      const job = await Job.findOne({ jobId: req.params.jobId });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      // If job has a userId, check it
      if (job.userId && req.user && job.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      job.rating = rating;
      await job.save();

      res.json({
        success: true,
        message: 'Rating submitted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new JobController();