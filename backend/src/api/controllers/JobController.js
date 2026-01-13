// backend/src/api/controllers/JobController.js - UPDATED
const { v4: uuidv4 } = require('uuid');
const Job = require('../../models/Job');
const Document = require('../../models/Document');
const Lead = require('../../models/Lead');
const Result = require('../../models/Result');
const StorageService = require('../../services/storage/StorageService');
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

      if (file.mimetype !== 'application/pdf') {
        return res.status(400).json({
          success: false,
          error: 'Only PDF files are accepted'
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
      const User = require('../../models/User');
      const user = await User.findById(req.user._id);

      // Check Quota / Credits
      let jobTier = 'Free';

      if (user.subscription.credits > 0) {
        // Use Credit
        user.subscription.credits -= 1;
        jobTier = user.subscription.plan || 'Standard'; // Default to Standard if they have credits but somehow plan is unset
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
            error: 'Monthly free limit reached. Please buy credits.'
          });
        }

        // Mark free usage
        user.subscription.freeReportDate = now;
        await user.save();
        jobTier = 'Free';
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

        // Queue for processing (Simulated for Production Readiness without OpenAI Key)
        setTimeout(async () => {
          try {
            await job.updateProcessingStep('extraction', 'in_progress');

            // Simulate processing delay
            setTimeout(async () => {
              try {
                await job.updateProcessingStep('extraction', 'completed');
                await job.updateProcessingStep('analysis', 'in_progress');

                // Generate Mock Result matching Result.js schema
                const Result = require('../../models/Result'); // Ensure import

                const mockResult = await Result.create({
                  jobId: job._id,
                  userId: req.user?._id,
                  summary: "The quote provides a comprehensive breakdown for a kitchen renovation. While the material costs align with market averages, the labor charges for plumbing and electrical work appear slightly elevated compared to standard regional rates.",
                  verdict: "good",
                  verdictScore: 85,
                  overallCost: 12500,
                  labourCost: 4500,
                  materialsCost: 8000,
                  fairPriceRange: {
                    min: 11000,
                    max: 13500
                  },
                  costBreakdown: [
                    { description: "Cabinetry Materials", quantity: 1, unitPrice: 5000, totalPrice: 5000, category: "Materials", flagged: false },
                    { description: "Countertops (Quartz)", quantity: 1, unitPrice: 2500, totalPrice: 2500, category: "Materials", flagged: false },
                    { description: "Plumbing Labor", quantity: 10, unitPrice: 150, totalPrice: 1500, category: "Labor", flagged: true, reason: "Hourly rate is 20% above market average" },
                    { description: "Electrical Labor", quantity: 8, unitPrice: 125, totalPrice: 1000, category: "Labor", flagged: false },
                    { description: "Flooring Installation", quantity: 1, unitPrice: 2000, totalPrice: 2000, category: "Labor", flagged: false }
                  ],
                  redFlags: [
                    { title: "High Labor Rate", description: "Plumbing hourly rate ($150/hr) exceeds regional average of $120/hr.", severity: "medium", category: "Labor" },
                    { title: "Vague Material Specs", description: "Cabinetry brand and grade not specified.", severity: "low", category: "Materials" }
                  ],
                  questionsToAsk: [
                    { question: "Can you specify the brand and grade of the cabinets?", category: "Materials", importance: "must-ask" },
                    { question: "Does the plumbing labor include removal of old pipes?", category: "Labor", importance: "should-ask" }
                  ],
                  detailedReview: "The quote is generally fair. The material costs for quartz countertops are competitive. However, clarification is needed on the cabinet specifics to ensure value. Negotiating the plumbing labor rate could save approximately $300.",
                  recommendations: [
                    { title: "Negotiate Plumbing Rate", description: "Ask for a reduction in the hourly plumbing rate to match the market average of $120/hr.", potentialSavings: 300, difficulty: "moderate" },
                    { title: "Clarify Cabinet Specs", description: "Get written confirmation of cabinet materials to avoid lower quality substitutions.", potentialSavings: 0, difficulty: "easy" }
                  ],
                  benchmarking: [
                    { item: "Cabinetry", quotePrice: 5000, marketMin: 4500, marketAvg: 5200, marketMax: 6500, percentile: 40 },
                    { item: "Plumbing Labor", quotePrice: 1500, marketMin: 1000, marketAvg: 1200, marketMax: 1600, percentile: 85 }
                  ],
                  marketContext: {
                    city: "General",
                    tradeType: "Renovation",
                    projectType: "Kitchen",
                    averageQuoteValue: 12000,
                    pricePercentile: 55
                  },
                  extractedText: "Kitchen Renovation Quote... Cabinetry: $5,000... Countertops: $2,500...",
                  analysisAccuracy: 95,
                  confidence: 98,
                  tier: job.tier
                });

                // Link result to job
                job.result = mockResult._id;
                await job.updateProcessingStep('analysis', 'completed');
                job.status = 'completed';
                await job.save();

                logger.info(`Job ${jobPublicId} processing completed (MOCKED). Result: ${mockResult._id}`);

                // Send completion email
                const EmailService = require('../../services/email/EmailService');
                const User = require('../../models/User'); // Ensure user is loaded if needed or pass ID
                const user = await User.findById(job.userId);
                if (user) {
                  await EmailService.sendJobCompletionEmail(user, job);
                }
              } catch (error) {
                logger.error(`Job processing failed: ${jobPublicId}`, error);
                job.status = 'failed';
                await job.save();
              }
            }, 3000); // 3 second processing delay
          } catch (error) {
            logger.error(`Job processing setup failed: ${jobPublicId}`, error);
          }
        }, 1000);

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
        // Fallback: Check if there's a result ID that failed to populate
        const rawJob = await Job.findOne({ jobId: req.params.jobId }).lean();
        if (rawJob.result) {
          const Result = require('../../models/Result');
          const result = await Result.findById(rawJob.result);
          if (result) {
            return res.json({
              success: true,
              data: result
            });
          }
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
}

module.exports = new JobController();