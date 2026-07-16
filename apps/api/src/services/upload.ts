import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { MediaAsset } from '../models/Misc.js';

let s3Client: S3Client | null = null;
const isAWSConfigured = !!(
  env.AWS_ACCESS_KEY_ID &&
  env.AWS_SECRET_ACCESS_KEY &&
  env.AWS_S3_BUCKET &&
  env.AWS_REGION
);

if (isAWSConfigured) {
  try {
    s3Client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    logger.info('☁️ AWS S3 client successfully initialized.');
  } catch (error) {
    logger.error(`❌ AWS S3 Initialization failed: ${(error as Error).message}`);
  }
} else {
  logger.warn('⚠️ AWS S3 credentials missing. Media upload will fall back to local disk storage.');
}

export class UploadService {
  /**
   * Generates a pre-signed upload URL (S3) OR local file landing route details (fallback).
   */
  static async requestUploadSession(
    fileName: string,
    mimeType: string,
    fileSize: number,
    usageType: 'avatar' | 'reel' | 'certificate' | 'logo' | 'verification' | 'worksheet',
    userId: string
  ): Promise<{
    uploadUrl: string;
    objectKey: string;
    isAws: boolean;
    mediaAssetId: string;
  }> {
    const objectKey = `${usageType}/${Date.now()}-${fileName.replace(/\s+/g, '_')}`;

    // Create preliminary media asset document in MongoDB
    const mediaAsset = new MediaAsset({
      name: fileName,
      s3Key: objectKey,
      bucket: env.AWS_S3_BUCKET || 'local-storage',
      mimeType,
      fileSize,
      uploadedBy: new mongoose.Types.ObjectId(userId),
      usageType,
      isTemporary: true, // Becomes false when client confirms upload completed
    });
    await mediaAsset.save();

    if (isAWSConfigured && s3Client) {
      try {
        const command = new PutObjectCommand({
          Bucket: env.AWS_S3_BUCKET,
          Key: objectKey,
          ContentType: mimeType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 mins expiry
        
        return {
          uploadUrl,
          objectKey,
          isAws: true,
          mediaAssetId: mediaAsset._id.toString() as string,
        };
      } catch (err) {
        logger.error(`⚠️ S3 Pre-signed URL generation failed: ${(err as Error).message}. Falling back to local.`);
      }
    }

    // Fallback: Return a local API upload endpoint URL
    const localUploadUrl = `${env.API_URL}/api/v1/media/upload-local?assetId=${mediaAsset._id}`;
    return {
      uploadUrl: localUploadUrl,
      objectKey,
      isAws: false,
      mediaAssetId: mediaAsset._id.toString() as string,
    };
  }

  /**
   * Confirms upload and marks file as permanent.
   */
  static async confirmUpload(mediaAssetId: string): Promise<boolean> {
    const media = await MediaAsset.findById(mediaAssetId);
    if (!media) return false;
    media.isTemporary = false;
    await media.save();
    return true;
  }
}
export { isAWSConfigured };
