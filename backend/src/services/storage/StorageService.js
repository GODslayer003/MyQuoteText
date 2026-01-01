// ============================================
// src/services/storage/StorageService.js
// ============================================

const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const stream = require("stream");

const cloudinary = require("cloudinary").v2;
const logger = require("../../utils/logger");

const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || "local";

// --------------------------------------------------
// Cloudinary Configuration (CLOUDINARY_URL only)
// --------------------------------------------------
if (STORAGE_PROVIDER === "cloudinary") {
  if (!process.env.CLOUDINARY_URL) {
    throw new Error("CLOUDINARY_URL is not defined");
  }

  cloudinary.config({
    secure: true
  });

  logger.info("Cloudinary initialized using CLOUDINARY_URL");
}

class StorageService {
  constructor() {
    this.localBasePath = path.join(process.cwd(), "uploads");
    this.cloudinaryFolder = process.env.CLOUDINARY_FOLDER || "myquotemate";
  }

  // =====================================================
  // UPLOAD
  // =====================================================
  async uploadFile(fileBuffer, metadata) {
    if (!fileBuffer) {
      throw new Error("No file buffer provided");
    }

    if (STORAGE_PROVIDER === "cloudinary") {
      return this.uploadToCloudinary(fileBuffer, metadata);
    }

    return this.uploadToLocal(fileBuffer, metadata);
  }

  // ------------------ CLOUDINARY ------------------
  async uploadToCloudinary(fileBuffer, metadata) {
    try {
      const publicId = this.generateCloudinaryPublicId(metadata);
      const checksums = this.calculateChecksums(fileBuffer);

      const bufferStream = new stream.PassThrough();
      bufferStream.end(fileBuffer);

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: this.cloudinaryFolder,
            public_id: publicId,
            resource_type: "auto",
            overwrite: false,
            context: {
              originalFilename: metadata.originalFilename,
              jobId: metadata.jobId,
              userId: metadata.userId || "guest"
            }
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        bufferStream.pipe(uploadStream);
      });

      logger.info(`Cloudinary upload successful: ${result.public_id}`);

      return {
        storageKey: result.public_id,
        publicId: result.public_id,
        location: result.secure_url,
        resourceType: result.resource_type,
        checksumMD5: checksums.md5,
        checksumSHA256: checksums.sha256
      };
    } catch (error) {
      logger.error("Cloudinary upload failed:", error);
      throw error;
    }
  }

  // ------------------ LOCAL ------------------
  uploadToLocal(fileBuffer, metadata) {
    try {
      if (!fs.existsSync(this.localBasePath)) {
        fs.mkdirSync(this.localBasePath, { recursive: true });
      }

      const filename = `${Date.now()}-${uuidv4()}-${metadata.originalFilename
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .substring(0, 100)}`;

      const filePath = path.join(this.localBasePath, filename);
      fs.writeFileSync(filePath, fileBuffer);

      logger.info(`Local file saved: ${filePath}`);

      return {
        storageKey: filePath,
        location: filePath,
        checksumMD5: crypto.createHash("md5").update(fileBuffer).digest("hex"),
        checksumSHA256: crypto.createHash("sha256").update(fileBuffer).digest("hex")
      };
    } catch (error) {
      logger.error("Local upload failed:", error);
      throw error;
    }
  }

  // =====================================================
  // ACCESS (PUBLIC URL)
  // =====================================================
async getSignedUrl(storageKey) {
  if (STORAGE_PROVIDER === "cloudinary") {
    if (storageKey.includes(":\\") || storageKey.startsWith("/")) {
      throw new Error("Invalid Cloudinary public_id (local path detected)");
    }

    return cloudinary.url(storageKey, { secure: true });
  }

  return storageKey;
}


  // =====================================================
  // DELETE
  // =====================================================
  async deleteFile(storageKey) {
    if (!storageKey) return;

    if (STORAGE_PROVIDER === "cloudinary") {
      try {
        await cloudinary.uploader.destroy(storageKey, {
          resource_type: "auto"
        });
        logger.info(`Cloudinary file deleted: ${storageKey}`);
      } catch (error) {
        logger.error("Cloudinary delete failed:", error);
      }
      return;
    }

    if (fs.existsSync(storageKey)) {
      fs.unlinkSync(storageKey);
      logger.info(`Local file deleted: ${storageKey}`);
    }
  }

  async deleteFiles(storageKeys = []) {
    for (const key of storageKeys) {
      await this.deleteFile(key);
    }
  }

  // =====================================================
  // HELPERS
  // =====================================================
  generateCloudinaryPublicId(metadata) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const safeName = metadata.originalFilename
      .replace(/\.[^/.]+$/, "") // remove extension
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 80);

    return `${year}/${month}/${metadata.jobId}/${uuidv4()}-${safeName}`;
  }

  calculateChecksums(buffer) {
    return {
      md5: crypto.createHash("md5").update(buffer).digest("hex"),
      sha256: crypto.createHash("sha256").update(buffer).digest("hex")
    };
  }
}

module.exports = new StorageService();