// ============================================
// src/api/controllers/JobController.js
// ============================================

const { v4: uuidv4 } = require('uuid');

const Job = require('../../models/Job');
const Document = require('../../models/Document');
const Lead  = require('../../models/Lead');
const Result = require('../../models/Result');
const AuditLog = require('../../models/AuditLog');

const StorageService = require('../../services/storage/StorageService');
const { documentProcessingQueue } = require('../../config/queue');

const logger = require('../../utils/logger');

class JobController {
  /**
   * Create a new job and upload document
   * POST /api/v1/jobs
   */
  async createJob(req, res, next) {
    try {
      const { email, tier = 'free', metadata = {} } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
      }

      if (file.mimetype !== 'application/pdf') {
        return res.status(400).json({ success: false, error: 'Only PDF files are accepted' });
      }

      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ success: false, error: 'File exceeds 10MB limit' });
      }

      // Find or create lead
      let lead = await Lead.findOne({ email: email.toLowerCase() });
      if (!lead) {
        lead = await Lead.create({
          email: email.toLowerCase(),
          source: metadata.source || 'free_upload'
        });
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
        metadata
      });

      // Upload file
      const uploadResult = await StorageService.uploadFile(file.buffer, {
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        jobId: jobPublicId,
        userId: req.user?._id?.toString()
      });

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

      job.documents.push(document._id);
      await job.updateProcessingStep('upload', 'completed');
      await job.save();

      if (documentProcessingQueue) {
  await documentProcessingQueue.add('process-document', {
    jobId: job._id.toString(),
    documentId: document._id.toString(),
    tier
  });
} else {
  logger.warn('Document processing queue is disabled. Skipping enqueue.', {
    jobId: job._id.toString(),
    documentId: document._id.toString()
  });
}


      await AuditLog.log({
        userId: req.user?._id,
        action: 'job.create',
        resourceType: 'job',
        resourceId: job._id.toString()
      });

      return res.status(201).json({
        success: true,
        data: {
          jobId: jobPublicId,
          status: job.status,
          tier: job.tier,
          createdAt: job.createdAt
        }
      });
    } catch (error) {
      logger.error('Job creation failed:', error);
      next(error);
    }
  }

  /**
   * ✅ FIXED: Get all jobs for logged-in user
   * GET /api/v1/jobs
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
        .populate('result');

      res.json({
        success: true,
        data: jobs
      });
    } catch (error) {
      logger.error('Failed to fetch user jobs:', error);
      next(error);
    }
  }

  /**
   * Get single job
   * GET /api/v1/jobs/:jobId
   */
  async getJob(req, res, next) {
    try {
      const job = await Job.findOne({ jobId: req.params.jobId })
        .populate('documents')
        .populate('result');

      if (!job) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      if (req.user && job.userId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      res.json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete job
   */
  async deleteJob(req, res, next) {
    try {
      const job = await Job.findOne({ jobId: req.params.jobId }).populate('documents');
      if (!job) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }

      job.deletedAt = new Date();
      await job.save();

      await StorageService.deleteFiles(job.documents.map(d => d.storageKey));

      res.json({ success: true, message: 'Job deleted' });
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
        return res.status(404).json({ success: false, error: 'Document not found' });
      }

      const signedUrl = await StorageService.getSignedUrl(document.storageKey, 300);
      res.json({ success: true, data: { url: signedUrl } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new JobController();
