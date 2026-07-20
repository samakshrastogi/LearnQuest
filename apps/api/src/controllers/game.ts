import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { GameSession, PlayerProgress, MissionAttempt, QuestionAttempt } from '../models/Activity.js';
import { GameLevel, Mission } from '../models/Curriculum.js';
import { StudentProfile } from '../models/Profiles.js';
import { WalletService } from '../services/wallet.js';
import { logger } from '../config/logger.js';

export const startSession = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const { levelId } = req.body;
    let student = await StudentProfile.findOne({ userId: user._id });
    
    // Auto-create student profile if parent/teacher/admin is testing the game
    if (!student) {
      student = new StudentProfile({
        userId: user._id,
        avatarUrl: '/avatars/guruji.png',
        classLevel: 5,
        languagePreference: 'en',
      });
      await student.save();
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // If levelId is a valid Mongo ObjectId, look up in DB, otherwise generate virtual session
    const isMongoId = mongoose.Types.ObjectId.isValid(levelId);
    let levelObjId = isMongoId ? new mongoose.Types.ObjectId(levelId) : new mongoose.Types.ObjectId();

    const gameSession = new GameSession({
      studentId: student._id,
      levelId: levelObjId,
      sessionToken,
      status: 'active',
      expiresAt,
    });
    await gameSession.save();

    res.status(200).json({
      success: true,
      message: 'Game session started successfully',
      data: {
        sessionToken,
        expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const completeLevel = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const { levelId, sessionToken, score = 100, timeSpentSeconds = 30 } = req.body;

    let student = await StudentProfile.findOne({ userId: user._id });
    if (!student) {
      student = new StudentProfile({
        userId: user._id,
        avatarUrl: '/avatars/guruji.png',
        classLevel: 5,
        languagePreference: 'en',
      });
      await student.save();
    }

    // Determine rewards based on score & level type (boss or normal stage)
    const isBoss = String(levelId).includes('level_5') || String(levelId).includes('level_10') || String(levelId).includes('level_15') || String(levelId).includes('level_20') || String(levelId).includes('level_25');

    const xpEarned = isBoss ? 150 : 50;
    const coinsEarned = isBoss ? 50 : 15;
    const gemsEarned = isBoss ? 5 : 1;

    // Grant Wallet Rewards in MongoDB
    student.xp += xpEarned;
    student.coins += coinsEarned;
    student.gems += gemsEarned;
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Level completed successfully',
      data: {
        status: 'success',
        rewards: {
          xp: xpEarned,
          coins: coinsEarned,
          gems: gemsEarned,
        },
        wallet: {
          xp: student.xp,
          coins: student.coins,
          gems: student.gems,
          energy: student.energy,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
