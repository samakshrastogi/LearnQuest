import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    
    // In test environment, connect only if not already connected
    if (mongoose.connection.readyState >= 1) {
      return;
    }

    const conn = await mongoose.connect(env.MONGODB_URI);
    logger.info(`🔌 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`❌ MongoDB Connection Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export const closeDB = async (): Promise<void> => {
  await mongoose.connection.close();
  logger.info('🔌 MongoDB connection closed.');
};
