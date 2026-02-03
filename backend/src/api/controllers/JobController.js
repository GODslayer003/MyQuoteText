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
const ReportService = require('../../services/report/ReportService');

class JobController {
  /**
   * Resolve job by UUID or ObjectId
   */
  async resolveJob(id) {
    if (!id) return null;
    let query = { deletedAt: null };

    // Check if it's a valid MongoDB ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query.$or = [{ _id: id }, { jobId: id }];
    } else {
      query.jobId = id;
    }

    return await Job.findOne(query).populate('result').populate('documents').populate('userId').populate('leadId');
  }

  /**
   * Create a new job and upload document
   */
  async createJob(req, res, next) {
    try {
      const { email, tier = 'Free', metadata = {}, exhaust = false } = req.body;
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

      // Check if email already exists in User model (for guest uploads)
      if (!req.user) {
        const existingUser = await User.findOne({
          email: email.toLowerCase(),
          accountStatus: { $ne: 'deleted' }
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            error: 'Email already registered',
            message: 'This email is already associated with an account. Please sign in to continue.',
            code: 'EMAIL_EXISTS'
          });
        }
      }

      const allowedMimes = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: 'Only PDF, Text, and image files (JPG, PNG, WEBP) are accepted'
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
          source: metadata.source || 'free_upload',
          isGuest: !req.user, // Mark as guest if no authenticated user
          guestUploadedAt: !req.user ? new Date() : undefined,
          metadata: {
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            referrer: req.get('referer')
          }
        });
        logger.info(`New lead created: ${email} (guest: ${!req.user})`);
      } else if (!req.user && !lead.isGuest) {
        // Update existing lead to mark as guest
        lead.isGuest = true;
        lead.guestUploadedAt = new Date();
        await lead.save();
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
          // Use Paid Credit
          user.subscription.credits -= 1;
          user.subscription.reportsUsed = (user.subscription.reportsUsed || 0) + 1;

          // Determine Tier (Premium or Standard)
          jobTier = user.subscription.plan === 'Premium' ? 'Premium' : 'Standard';

          // If no credits left, transition back to Free plan IMMEDIATELY
          if (user.subscription.credits === 0) {
            user.subscription.plan = 'Free';
            user.subscription.reportsTotal = 1; // Revert to monthly free limit capacity
            // Reset reportsUsed for the Free monthly cycle if needed
            // But usually we keep it so they can't use a free one right after if they already used it this month?
            // User requested: "if used then back to free version"
          }

          await user.save();
          logger.info(`Used 1 paid credit for user ${user._id} (${jobTier}). Remaining: ${user.subscription.credits}.`);

          // One-Shot Premium Enforcement (exhaust flag)
          if (exhaust && user.subscription.plan === 'Premium') {
            logger.info(`Exhaust flag set. Draining remaining ${user.subscription.credits} credits for user ${user._id} and reverting to Free.`);
            user.subscription.credits = 0;
            user.subscription.plan = 'Free';
            user.subscription.reportsTotal = 1;
            await user.save();
          }
        } else {
          // Check Free Monthly Limit (1 per month)
          const now = new Date();
          const lastFreeReport = user.subscription.freeReportDate ? new Date(user.subscription.freeReportDate) : null;

          let canUseFree = true;
          if (lastFreeReport) {
            // Check if same month and year
            if (lastFreeReport.getMonth() === now.getMonth() && lastFreeReport.getFullYear() === now.getFullYear()) {
              canUseFree = false;
            }
          }

          if (!canUseFree) {
            return res.status(403).json({
              success: false,
              error: 'Monthly usage limit reached',
              nextAvailableDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
              message: 'Free tier is limited to 1 report per month. Please upgrade for more analysis.'
            });
          }

          // Mark free usage
          user.subscription.freeReportDate = now;
          user.subscription.reportsUsed = 1; // Used their 1 free report
          user.subscription.reportsTotal = 1;
          user.subscription.plan = 'Free'; // Ensure they are on Free plan
          await user.save();

          jobTier = 'Free';
          logger.info(`Used monthly free report for user ${user._id}`);
        }
      } else {
        // Guest User - Allow Free Tier for now
        jobTier = 'Free';
        logger.info(`Guest upload using email: ${email}`);
      }

      // Calculate expiration date based on tier
      const now = new Date();
      const retentionDays = jobTier === 'Free' ? 7 : 90;
      const expiresAt = new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000);

      const jobPublicId = uuidv4();
      const job = await Job.create({
        jobId: jobPublicId,
        leadId: lead._id,
        userId: req.user?._id,
        tier: jobTier, // Use calculated tier
        status: 'pending',
        expiresAt, // Set expiration date
        processingSteps: [
          { step: 'upload', status: 'in_progress' },
          { step: 'extraction', status: 'pending' },
          { step: 'analysis', status: 'pending' }
        ],
        metadata: {
          ...metadata,
          filename: file.originalname,
          fileSize: file.size,
          uploadedAt: now
        }
      });

      logger.info(`Job created: ${jobPublicId} for ${email}`);

      // Link job to lead for guest users
      if (!req.user && lead) {
        if (!lead.linkedJobs) lead.linkedJobs = [];
        lead.linkedJobs.push(job._id);
        await lead.save();
        logger.info(`Job ${jobPublicId} linked to guest lead ${email}`);
      }

      try {
        // Upload file
        const uploadResult = await StorageService.uploadFile(file.buffer, {
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          jobId: jobPublicId,
          userId: req.user?._id?.toString()
        });

        logger.info(`File uploaded to storage: ${uploadResult.storageKey} `);

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

        logger.info(`Document created: ${document._id} `);

        // Queue for production processing
        const { documentProcessingQueue } = require('../../config/queue');

        if (documentProcessingQueue) {
          await documentProcessingQueue.add('process-document', {
            jobId: job._id,
            documentId: document._id,
            tier: job.tier
          }, {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000
            },
            removeOnComplete: true
          });
          logger.info(`Job ${jobPublicId} queued for processing`);
        } else {
          logger.warn(`Redis queue not available.Falling back to inline processing for Job ${jobPublicId}`);

          // CRITICAL: The DocumentProcessor relies on 'aiAnalysisQueue'.
          // If Redis is down, that queue is also null.
          // We need a robust fallback that runs the WHOLE chain.

          this.runInlineFallback(job, document, file);
        }

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
      const job = await this.resolveJob(req.params.jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      const jobUserId = job.userId?._id || job.userId;
      if (req.user && jobUserId?.toString() !== req.user._id.toString()) {
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
      const job = await this.resolveJob(req.params.jobId);

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
      const job = await this.resolveJob(req.params.jobId);

      logger.info(`getJobResult request for ${req.params.jobId}`, {
        jobFound: !!job,
        hasResult: !!job?.result,
        jobId: job?._id,
        status: job?.status
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      const jobUserId = job.userId?._id || job.userId;
      if (req.user && jobUserId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      if (!job.result) {
        // Fallback: Check if there's a result ID that failed to populate OR a result that exists but isn't linked
        const Result = require('../../models/Result');
        const fallbackResult = await Result.findOne({ jobId: job._id });

        logger.info(`Fallback result search for job ${job._id}`, { found: !!fallbackResult });

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
      const jobUserId = job.userId?._id || job.userId;
      if (req.user && jobUserId?.toString() !== req.user._id.toString()) {
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
      const job = await this.resolveJob(req.params.jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      // If job has a userId, check it
      const jobUserId = job.userId?._id || job.userId;
      if (jobUserId && req.user && jobUserId.toString() !== req.user._id.toString()) {
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
  /**
   * Fallback method when Redis is unavailable
   * Re-implements the processing chain: OCR -> AI -> Result -> Email
   */
  async runInlineFallback(job, document, file) {
    setTimeout(async () => {
      try {
        logger.info(`Starting INLINE processing for job ${job._id}`);

        // 1. Extraction Phase
        await job.updateProcessingStep('extraction', 'in_progress');

        const ocrService = require('../../services/ocr/OCRService');
        const AIOrchestrator = require('../../services/ai/AIOrchestrator');

        // 1. Text Extraction
        let extractionResult = { text: '' };
        try {
          if (file.mimetype === 'text/plain') {
            extractionResult = {
              text: file.buffer.toString('utf8'),
              ocrRequired: false,
              method: 'text_input'
            };
          } else {
            extractionResult = await ocrService.extractText(file.buffer, file.mimetype);
          }
          logger.info('Text extracted (inline)', {
            length: extractionResult?.text?.length,
            method: extractionResult?.method
          });
        } catch (e) {
          logger.error(`Extraction failed for job ${job._id}`, e);
          // Continue to allow fallback check
        }

        // Handle Fallback to Vision (e.g. Scanned Scanned PDF)
        let imageUrl = null;
        let textToAnalyze = extractionResult?.text || "";
        let ocrMetadata = {
          method: extractionResult?.method,
          ocrConfidence: extractionResult?.ocrConfidence
        };

        if (extractionResult?.fallbackToVision) {
          logger.info('OCR failed or scanned PDF detected. Falling back to Vision API.');
          // Generate preview URL from storage key (Cloudinary)
          // Document object from earlier scope?? 
          // Wait, 'document' is passed in runInlineFallback arguments
          if (document && document.storageKey) {
            const storageService = require('../../services/storage/StorageService');
            imageUrl = storageService.getPreviewUrl(document.storageKey);
            logger.info('Generated Vision Preview URL', { imageUrl });
            textToAnalyze = "Please analyze this attached image of the quote document.";
          }
        }

        // Check text limit (only if not using Vision? No, apply limit to text part anyway)
        const limits = { Free: 7000, Standard: 20000, Premium: 40000 };
        const limit = limits[job.tier] || 7000;

        const cappedText = textToAnalyze.length > limit
          ? textToAnalyze.slice(0, limit)
          : textToAnalyze;

        if (textToAnalyze.length > limit) {
          logger.warn('AI input truncated', { tier: job.tier, originalLength: textToAnalyze.length, allowed: limit });
        }

        if (!cappedText && !imageUrl) {
          throw new Error(`Insufficient text extracted or no image for analysis.`);
        }

        await job.updateProcessingStep('extraction', 'completed');

        // 2. AI Phase
        await job.updateProcessingStep('analysis', 'in_progress');
        logger.info(`Starting AI analysis for job ${job._id}(${cappedText.length} chars)`);

        // Pass imageUrl if available
        const aiOutcome = await AIOrchestrator.analyzeQuote(
          cappedText,
          job.tier.toLowerCase(),
          { ...job.metadata, ...ocrMetadata },
          imageUrl // Pass imageUrl to AIOrchestrator
        );

        // 3. Result
        const aiProcessor = require('../../workers/processors/aiProcessor');
        // CRITICAL: job.data is NOT populated here because it's not a Bull job!
        // The aiProcessor.createResult expects job.data.extractedText.
        // Shim job to have .data for the processor
        const jobShim = {
          _id: job._id,
          userId: job.userId,
          data: {
            extractedText: cappedText,
            extractionMethod: ocrMetadata.method,
            ocrConfidence: ocrMetadata.ocrConfidence,
            ...job.metadata
          }
        };

        const result = await aiProcessor.createResult(jobShim, aiOutcome, job.tier);

        // 3.1 Update Supplier Scoreboard
        if (aiOutcome.supplierScoreboardData) {
          const SupplierScoringService = require('../../services/supplier/SupplierScoringService');
          await SupplierScoringService.processSupplierQuote(
            job._id,
            {
              ...aiOutcome.supplierScoreboardData,
              rawText: cappedText
            }
          ).catch(err => logger.error('Inline Supplier scoring failed:', err));
        }

        job.result = result._id;
        job.status = 'completed';
        await job.updateProcessingStep('analysis', 'completed');
        await job.save();

        logger.info(`Inline job ${job._id} completed successfully`);

        // 4. Email
        try {
          const EmailService = require('../../services/email/EmailService');
          const user = await User.findById(job.userId);
          if (user?.email) {
            await EmailService.sendJobCompletionEmail(user, job);
          }
        } catch (e) { logger.warn('Email failed', e); }

      } catch (error) {
        logger.error(`Inline job failed: ${job._id} `, error);
        job.status = 'failed';
        await job.updateProcessingStep('analysis', 'failed', error.message);
        await job.save();
      }
    }, 100);
  }

  /**
   * Generate professional PDF report for Standard/Premium users
   */
  async generateReport(req, res, next) {
    try {
      const { jobId } = req.params;
      const job = await this.resolveJob(jobId);

      if (!job) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      // 1. Ownership check (Allow if lead job OR if user matches)
      const jobUserId = job.userId?._id || job.userId;
      if (req.user && jobUserId && jobUserId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to access this report.'
        });
      }

      // 2. Tier Check (Allow if job is Standard/Premium OR if user has Standard/Premium subscription)
      const isJobPremium = ['standard', 'premium'].includes(job.tier.toLowerCase());
      const isUserPremium = req.user && ['Standard', 'Premium'].includes(req.user.subscription?.plan);

      if (!isJobPremium && !isUserPremium) {
        return res.status(403).json({
          success: false,
          error: 'PDF reports are a premium feature',
          message: 'Please upgrade to Standard or Premium to download professional reports.'
        });
      }

      if (!job.result) {
        return res.status(404).json({
          success: false,
          error: 'Analysis result not found',
          message: 'The analysis result for this job is not yet available. Please wait for processing to complete.'
        });
      }

      const effectiveTier = isUserPremium ? req.user.subscription.plan.toLowerCase() : job.tier.toLowerCase();
      const pdfBuffer = await ReportService.generateProfessionalReport(job, job.result, effectiveTier);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename = Analysis_Report_${jobId}.pdf`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);

    } catch (error) {
      logger.error('Failed to generate report:', error);
      res.status(500).json({ success: false, error: 'Failed to generate PDF report' });
    }
  }

  /**
   * Generate professional text-only report (Word Docs style)
   */
  async generateTextReport(req, res, next) {
    try {
      const { jobId } = req.params;
      const job = await this.resolveJob(jobId);

      if (!job || !job.result) {
        return res.status(404).json({ success: false, error: 'Job or result not found' });
      }

      // Tier check (Premium Only for this format)
      if (job.tier.toLowerCase() !== 'premium') {
        return res.status(403).json({
          success: false,
          error: 'Technical reports are a Premium feature'
        });
      }

      const pdfBuffer = await ReportService.generateProfessionalTextReport(job, job.result, 'premium');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Technical_Report_${jobId}.pdf`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      logger.error('Failed to generate text report:', error);
      res.status(500).json({ success: false, error: 'Failed to generate technical report' });
    }
  }

  /**
   * Compare multiple quotes (Premium)
   */
  async compareQuotes(req, res, next) {
    try {
      const { jobIds } = req.body;
      if (!jobIds || !Array.isArray(jobIds) || jobIds.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'At least two job IDs are required for comparison'
        });
      }

      // 1. Fetch all jobs and their results
      const jobs = await Job.find({ jobId: { $in: jobIds } }).populate('result');

      if (jobs.length < jobIds.length) {
        return res.status(404).json({
          success: false,
          error: 'One or more jobs not found'
        });
      }

      // 2. Security: Check ownership for all jobs
      if (req.user) {
        const unauthorized = jobs.some(job => {
          const jobUserId = job.userId?._id || job.userId;
          return jobUserId && jobUserId.toString() !== req.user._id.toString();
        });
        if (unauthorized) {
          return res.status(403).json({ success: false, error: 'Access denied: One or more jobs do not belong to you' });
        }
      }

      // 3. Extract text from results for comparison
      // We assume results are already processed. If not, we can't compare.
      const processedResults = jobs.filter(j => j.result).map(j => ({
        jobId: j.jobId,
        name: j.metadata?.title || 'Quote',
        cost: j.result.overallCost || 0,
        rawText: j.result.detailedReview // Use detailedReview as a proxy for the full extracted text if full text isn't saved in Result
      }));

      if (processedResults.length < 2) {
        return res.status(400).json({ success: false, error: 'Detailed results missing for one or more jobs' });
      }

      // 4. Call AI to compare
      const AIOrchestrator = require('../../services/ai/AIOrchestrator');
      const comparisonData = await AIOrchestrator.compareQuotes(processedResults, {
        workCategory: jobs[0].metadata?.workCategory
      });

      // 5. Premium Credit Enforcement: Drain remaining credits and revert to Free
      if (req.user) {
        const user = await User.findById(req.user._id);
        if (user && user.subscription.plan === 'Premium') {
          logger.info(`Comparison performed. Draining remaining ${user.subscription.credits} credits for user ${user._id} and reverting to Free.`);
          user.subscription.credits = 0;
          user.subscription.plan = 'Free';
          user.subscription.reportsTotal = 1;
          await user.save();
        }
      }

      res.json({
        success: true,
        data: {
          jobIds,
          ...comparisonData
        }
      });
    } catch (error) {
      logger.error('Comparison error:', error);
      res.status(500).json({ success: false, error: 'Failed to compare quotes' });
    }
  }
}

module.exports = new JobController();