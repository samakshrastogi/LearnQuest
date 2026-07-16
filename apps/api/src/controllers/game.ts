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
    const student = await StudentProfile.findOne({ userId: user._id });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found', code: 'NOT_FOUND' });
      return;
    }

    const level = await GameLevel.findById(levelId);
    if (!level) {
      res.status(404).json({ success: false, message: 'Game level not found', code: 'NOT_FOUND' });
      return;
    }

    // Generate unique session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes validity

    const gameSession = new GameSession({
      studentId: student._id,
      levelId: level._id,
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
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const { levelId, sessionToken, score, timeSpentSeconds, answers } = req.body;

    const student = await StudentProfile.findOne({ userId: user._id }).session(mongoSession);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found', code: 'NOT_FOUND' });
      return;
    }

    // 1. Anti-Cheat: Validate GameSession token
    const activeSession = await GameSession.findOne({
      sessionToken,
      studentId: student._id,
      levelId,
      status: 'active',
    }).session(mongoSession);

    if (!activeSession) {
      res.status(400).json({ success: false, message: 'Invalid or expired game session', code: 'ANTI_CHEAT_TRIGGERED' });
      return;
    }

    if (activeSession.expiresAt < new Date()) {
      activeSession.status = 'failed';
      await activeSession.save({ session: mongoSession });
      res.status(400).json({ success: false, message: 'Game session expired', code: 'SESSION_EXPIRED' });
      return;
    }

    // 2. Anti-Cheat: Completion time check (e.g. impossible to finish in < 3 seconds)
    if (timeSpentSeconds < 3) {
      res.status(400).json({ success: false, message: 'Completion speed is suspicious', code: 'SUSPICIOUS_SPEED' });
      return;
    }

    const level = await GameLevel.findById(levelId).session(mongoSession);
    if (!level) {
      res.status(404).json({ success: false, message: 'Game level not found', code: 'NOT_FOUND' });
      return;
    }

    const mission = await Mission.findById(level.missionId).session(mongoSession);
    if (!mission) {
      res.status(404).json({ success: false, message: 'Associated mission not found', code: 'NOT_FOUND' });
      return;
    }

    // 3. Mark session completed to prevent double submissions
    activeSession.status = 'completed';
    await activeSession.save({ session: mongoSession });

    // Save MissionAttempt
    const missionAttempt = new MissionAttempt({
      studentId: student._id,
      missionId: mission._id,
      status: score >= 50 ? 'success' : 'failed', // 50% passing threshold
      score,
      xpGained: score >= 50 ? mission.xpReward : 5, // Grant partial XP even on failure for participation
      coinsGained: score >= 50 ? mission.coinReward : 1,
      gemsGained: score >= 90 ? mission.crystalReward : 0, // Bonus crystals/gems for high accuracy
      timeSpentSeconds,
    });
    await missionAttempt.save({ session: mongoSession });

    // Link individual question attempts (if provided by Phaser client)
    if (answers && Array.isArray(answers)) {
      for (const ans of answers) {
        await QuestionAttempt.create([
          {
            studentId: student._id,
            questionId: ans.questionId,
            missionAttemptId: missionAttempt._id,
            isCorrect: ans.isCorrect,
            selectedAnswer: ans.answer,
            timeTakenSeconds: ans.timeTakenSeconds || 0,
            hintCountUsed: ans.hintCountUsed || 0,
          }
        ], { session: mongoSession });
      }
    }

    // 4. Secure Wallet Transactions
    let walletResult = null;
    if (missionAttempt.status === 'success') {
      // Grant XP
      walletResult = await WalletService.adjustBalance(
        student._id,
        'xp',
        mission.xpReward,
        'lesson_reward',
        missionAttempt._id,
        mongoSession
      );

      // Grant Coins
      await WalletService.adjustBalance(
        student._id,
        'coins',
        mission.coinReward,
        'lesson_reward',
        missionAttempt._id,
        mongoSession
      );

      // Grant Gems (if crystals are rewarded)
      if (mission.crystalReward > 0) {
        await WalletService.adjustBalance(
          student._id,
          'gems',
          mission.crystalReward,
          'lesson_reward',
          missionAttempt._id,
          mongoSession
        );
      }

      // Update student unlocks progress
      const progress = await PlayerProgress.findOne({ studentId: student._id }).session(mongoSession);
      if (progress) {
        if (!progress.completedMissions.includes(mission._id)) {
          progress.completedMissions.push(mission._id);
        }
        // Unlock next missions based on sequence (or finding next mission sequence in topic)
        const nextMissions = await Mission.find({
          topicId: mission.topicId,
          sequence: mission.sequence + 1,
        }).session(mongoSession);
        
        for (const nm of nextMissions) {
          if (!progress.unlockedMissions.includes(nm._id)) {
            progress.unlockedMissions.push(nm._id);
          }
        }
        await progress.save({ session: mongoSession });
      }
    } else {
      // Small consolidation reward for playing
      walletResult = await WalletService.adjustBalance(
        student._id,
        'xp',
        5,
        'lesson_reward',
        missionAttempt._id,
        mongoSession
      );
      await WalletService.adjustBalance(
        student._id,
        'coins',
        1,
        'lesson_reward',
        missionAttempt._id,
        mongoSession
      );
    }

    await mongoSession.commitTransaction();
    mongoSession.endSession();

    res.status(200).json({
      success: true,
      message: 'Level completed successfully',
      data: {
        attemptId: missionAttempt._id,
        status: missionAttempt.status,
        rewards: {
          xp: missionAttempt.xpGained,
          coins: missionAttempt.coinsGained,
          gems: missionAttempt.gemsGained,
        },
        wallet: walletResult || {
          xp: student.xp,
          coins: student.coins,
          gems: student.gems,
          energy: student.energy,
        },
      },
    });
  } catch (error) {
    await mongoSession.abortTransaction();
    mongoSession.endSession();
    next(error);
  }
};
