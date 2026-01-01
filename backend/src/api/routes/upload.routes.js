// ============================================
// src/api/routes/upload.routes.js
// ============================================
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const s3Service = require('../../services/storage/StorageService');
const authMiddleware = require('../middleware/auth.middleware');
const logger = require('../../utils/logger');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

/**
 * Direct file upload endpoint (alternative to job creation)
 * POST /api/v1/upload
 */
router.post(
  '/',
  authMiddleware.optionalAuth,
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const fileId = uuidv4();

      // Upload to S3
      const result = await s3Service.uploadFile(req.file.buffer, {
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype,
        jobId: fileId,
        userId: req.user?._id?.toString()
      });

      logger.info(`File uploaded: ${fileId}`);

      res.json({
        success: true,
        data: {
          fileId: fileId,
          filename: req.file.originalname,
          size: req.file.size,
          storageKey: result.storageKey
        }
      });
    } catch (error) {
      logger.error('File upload failed:', error);
      next(error);
    }
  }
);

module.exports = router;