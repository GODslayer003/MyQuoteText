// backend/src/api/controllers/JobController.js - UPDATED
const { v4: uuidv4 } = require('uuid');
const Job = require('../../models/Job');
const Document = require('../../models/Document');
const Lead = require('../../models/Lead');
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
      const jobPublicId = uuidv4();
      const job = await Job.create({
        jobId: jobPublicId,
        leadId: lead._id,
        userId: req.user?._id,
        tier,
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

        // Queue for processing (simplified - in production, use Bull queue)
        // For now, mark as processing
        setTimeout(async () => {
          try {
            await job.updateProcessingStep('extraction', 'in_progress');
            
            // Simulate processing
            setTimeout(async () => {
              try {
                await job.updateProcessingStep('extraction', 'completed');
                await job.updateProcessingStep('analysis', 'completed');
                job.status = 'completed';
                await job.save();
                logger.info(`Job ${jobPublicId} processing completed`);
              } catch (error) {
                logger.error(`Job processing failed: ${jobPublicId}`, error);
              }
            }, 5000);
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