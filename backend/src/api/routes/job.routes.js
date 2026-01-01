// ============================================
// src/api/routes/job.routes.js
// ============================================

const express = require('express');
const router = express.Router();
const multer = require('multer');

const JobController = require('../controllers/JobController');
const authMiddleware = require('../middleware/auth.middleware');
const validationMiddleware = require('../middleware/validation.middleware');
const rateLimitMiddleware = require('../middleware/rateLimit.middleware');

// Safety wrapper
const safe = (fn, name) => {
  if (typeof fn !== 'function') {
    throw new Error(`Missing or invalid handler: ${name}`);
  }
  return fn;
};

// Multer (PDF only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  }
});

// Create job
router.post(
  '/',
  safe(rateLimitMiddleware.jobCreationLimiter, 'jobCreationLimiter'),
  upload.single('document'),
  safe(validationMiddleware.validateJobCreation, 'validateJobCreation'),
  safe(authMiddleware.optionalAuth, 'optionalAuth'),
  safe(JobController.createJob, 'createJob')
);

// Get all jobs (auth)
router.get(
  '/',
  safe(authMiddleware.authenticate, 'authenticate'),
  safe(JobController.getUserJobs, 'getUserJobs')
);

// Get single job
router.get(
  '/:jobId',
  safe(authMiddleware.optionalAuth, 'optionalAuth'),
  safe(JobController.getJob, 'getJob')
);

// Delete job
router.delete(
  '/:jobId',
  safe(authMiddleware.authenticate, 'authenticate'),
  safe(JobController.deleteJob, 'deleteJob')
);

// Download document
router.get(
  '/:jobId/documents/:documentId/download',
  safe(authMiddleware.optionalAuth, 'optionalAuth'),
  safe(JobController.downloadDocument, 'downloadDocument')
);

module.exports = router;
