import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middlewares/auth.js';
import { UploadService } from '../services/upload.js';
import { MediaAsset } from '../models/Misc.js';
import { logger } from '../config/logger.js';

const router = Router();

// Ensure local uploads directory exists
const localUploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

// Multer disk storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, localUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req: any, file: any, cb: any) => {
    // Validate MIME types
    const allowed = ['image/png', 'image/jpeg', 'image/gif', 'video/mp4', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Standard media images, videos, and PDFs only.'));
    }
  },
});

/**
 * 1. Request AWS S3 Pre-signed URL or Local upload metadata
 */
router.post(
  '/get-upload-url',
  authenticate,
  async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fileName, mimeType, fileSize, usageType } = req.body;
      if (!fileName || !mimeType || !usageType) {
        res.status(400).json({ success: false, message: 'Missing file details' });
        return;
      }

      const session = await UploadService.requestUploadSession(
        fileName,
        mimeType,
        fileSize || 0,
        usageType,
        req.user._id.toString()
      );

      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 2. Confirm Upload Completed (AWS flow)
 */
router.post(
  '/confirm-upload',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mediaAssetId } = req.body;
      if (!mediaAssetId) {
        res.status(400).json({ success: false, message: 'Missing media asset ID' });
        return;
      }

      const success = await UploadService.confirmUpload(mediaAssetId);
      if (!success) {
        res.status(404).json({ success: false, message: 'Media asset not found' });
        return;
      }

      res.status(200).json({ success: true, message: 'Upload confirmed' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 3. Local upload landing endpoint (fallback)
 * Client submits standard Multi-part Form POST containing 'file' to this URL
 */
router.post(
  '/upload-local',
  upload.single('file'),
  async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { assetId } = req.query;
      if (!req.file || !assetId) {
        res.status(400).json({ success: false, message: 'File and assetId query are required' });
        return;
      }

      const media = await MediaAsset.findById(assetId);
      if (!media) {
        res.status(404).json({ success: false, message: 'Media record not found' });
        return;
      }

      // Update local asset path properties
      const localFilePath = `/uploads/${req.file.filename}`;
      media.s3Key = req.file.filename;
      media.bucket = 'local-disk';
      media.isTemporary = false;
      await media.save();

      logger.info(`💾 Local upload saved: ${localFilePath}`);

      res.status(200).json({
        success: true,
        message: 'Local upload completed successfully',
        data: {
          mediaAssetId: media._id,
          fileUrl: localFilePath,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
export { localUploadsDir };
