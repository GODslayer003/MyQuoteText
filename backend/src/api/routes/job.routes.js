// backend/src/api/routes/job.routes.js - SIMPLIFIED
const express = require('express');
const router = express.Router();
const multer = require('multer');
const JobController = require('../controllers/JobController');
const authMiddleware = require('../middleware/auth.middleware');

// Multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files (JPG, PNG, WEBP) are allowed'));
    }
  }
});

// Create job (upload PDF)
router.post(
  '/',
  authMiddleware.optionalAuth,
  upload.single('document'),
  JobController.createJob
);

// Get user's jobs
router.get(
  '/',
  authMiddleware.authenticate,
  JobController.getUserJobs
);

// Get single job
router.get(
  '/:jobId',
  authMiddleware.optionalAuth,
  JobController.getJob
);

// Get job status
router.get(
  '/:jobId/status',
  authMiddleware.optionalAuth,
  JobController.getJobStatus
);

// Get job result (analysis)
router.get(
  '/:jobId/result',
  authMiddleware.optionalAuth,
  JobController.getJobResult
);

// Delete job
router.delete(
  '/:jobId',
  authMiddleware.authenticate,
  JobController.deleteJob
);

// Download document
router.get(
  '/:jobId/documents/:documentId/download',
  authMiddleware.optionalAuth,
  JobController.downloadDocument
);

// Submit rating
router.patch(
  '/:jobId/rating',
  authMiddleware.optionalAuth,
  JobController.submitRating
);

module.exports = router;