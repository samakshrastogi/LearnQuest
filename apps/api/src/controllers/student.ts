import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { StudentProfile, School } from '../models/Profiles.js';
import { AvatarItem, UserInventory } from '../models/Inventory.js';
import { StudentMastery, MissionAttempt } from '../models/Activity.js';
import { WalletService } from '../services/wallet.js';
import { AIService } from '../services/ai.js';
import { Reel } from '../models/Misc.js';
import { QuestDTO } from '@learnquest/shared-types';

export const getDashboard = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const student = await StudentProfile.findOne({ userId: user?._id })
      .populate('schoolId', 'name logoUrl');
    
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found', code: 'NOT_FOUND' });
      return;
    }

    // 1. Fetch Weak Topics (for recommended practices)
    const weakTopics = await StudentMastery.find({
      studentId: student._id,
      weakTopicFlag: true,
    })
      .populate({
        path: 'topicId',
        select: 'name chapterId',
        populate: { path: 'chapterId', select: 'name subjectId' },
      })
      .limit(3);

    // 2. Fetch Recent Activities
    const recentAttempts = await MissionAttempt.find({ studentId: student._id })
      .populate('missionId', 'name type xpReward')
      .sort({ createdAt: -1 })
      .limit(5);

    // 3. AI/System Recommended Reel
    let recommendedReel = null;
    if (weakTopics.length > 0) {
      // Find reels matching the weak topic's subject/chapter
      const weakTopicSubjectId = (weakTopics[0].topicId as any)?.chapterId?.subjectId;
      if (weakTopicSubjectId) {
        recommendedReel = await Reel.findOne({
          subjectId: weakTopicSubjectId,
          classLevel: student.classLevel,
          isVerified: true,
        }).populate('subjectId', 'name code');
      }
    }

    if (!recommendedReel) {
      // General fall-back reel
      recommendedReel = await Reel.findOne({
        classLevel: student.classLevel,
        isVerified: true,
      }).populate('subjectId', 'name code');
    }

    // 4. Mock Quests List (Server-controlled)
    const mockQuests: QuestDTO[] = [
      {
        id: 'q1',
        title: 'Learn with Reels',
        description: 'Watch 2 learning videos today',
        type: 'watch_reels',
        targetValue: 2,
        currentValue: 1,
        isCompleted: false,
        isClaimed: false,
      },
      {
        id: 'q2',
        title: 'Perfect Math',
        description: 'Complete a Math Kingdom mission',
        type: 'clear_missions',
        targetValue: 1,
        currentValue: 1,
        isCompleted: true,
        isClaimed: false,
      },
    ];

    res.status(200).json({
      success: true,
      message: 'Dashboard fetched successfully',
      data: {
        student,
        weakTopics,
        recentAttempts,
        recommendedReel,
        quests: mockQuests,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getInventory = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const student = await StudentProfile.findOne({ userId: user?._id });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    const inventoryDocs = await UserInventory.find({ studentId: student._id }).populate('itemId');
    const items = inventoryDocs.map((inv) => inv.itemId);

    res.status(200).json({ success: true, message: 'Inventory fetched successfully', data: items });
  } catch (error) {
    next(error);
  }
};

export const equipItem = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const { itemId, category } = req.body; // e.g. helmet, weapon, frame, outfit, background

    const student = await StudentProfile.findOne({ userId: user?._id });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    // Verify student owns the item
    const item = await AvatarItem.findById(itemId);
    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }

    // Free basic items are always owned. Non-free items check user ownership
    if (item.priceCoins > 0 || item.priceGems > 0) {
      const ownership = await UserInventory.findOne({ studentId: student._id, itemId });
      if (!ownership) {
        res.status(403).json({ success: false, message: 'You do not own this item' });
        return;
      }
    }

    // Equip
    if (category === 'helmet') student.selectedInventoryItems.helmet = item.assetUrl;
    if (category === 'weapon') student.selectedInventoryItems.weapon = item.assetUrl;
    if (category === 'outfit') student.selectedInventoryItems.outfit = item.assetUrl;
    if (category === 'frame') student.selectedInventoryItems.frame = item.assetUrl;
    if (category === 'background') student.selectedInventoryItems.background = item.assetUrl;

    await student.save();

    res.status(200).json({
      success: true,
      message: 'Item equipped successfully',
      data: student.selectedInventoryItems,
    });
  } catch (error) {
    next(error);
  }
};

export const purchaseAvatarItem = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = req.user;
    const { itemId } = req.body;

    const student = await StudentProfile.findOne({ userId: user?._id }).session(session);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    const item = await AvatarItem.findById(itemId).session(session);
    if (!item || !item.isActive) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }

    // Check level requirements
    const playerLevel = Math.floor(student.xp / 1000) + 1;
    if (playerLevel < item.requiredLevel) {
      res.status(400).json({
        success: false,
        message: `Requires Level ${item.requiredLevel} (You are Level ${playerLevel})`,
      });
      return;
    }

    // Check if already purchased
    const owned = await UserInventory.findOne({ studentId: student._id, itemId }).session(session);
    if (owned) {
      res.status(400).json({ success: false, message: 'You already own this item' });
      return;
    }

    // Check pricing matches and deduct balance using safe transactional adjustment
    if (item.priceCoins > 0) {
      if (student.coins < item.priceCoins) {
        res.status(400).json({ success: false, message: 'Insufficient Coins' });
        return;
      }
      await WalletService.adjustBalance(student._id, 'coins', -item.priceCoins, 'avatar_purchase', item._id, session);
    }

    if (item.priceGems > 0) {
      if (student.gems < item.priceGems) {
        res.status(400).json({ success: false, message: 'Insufficient Gems' });
        return;
      }
      await WalletService.adjustBalance(student._id, 'gems', -item.priceGems, 'avatar_purchase', item._id, session);
    }

    // Add to user inventory
    const unlock = new UserInventory({
      studentId: student._id,
      itemId: item._id,
    });
    await unlock.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Item purchased successfully',
      data: {
        itemId: item._id,
        coinsLeft: student.coins,
        gemsLeft: student.gems,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
export const getShopItems = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const items = await AvatarItem.find({ isActive: true });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

export const claimQuestReward = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const { questId } = req.body;

    const student = await StudentProfile.findOne({ userId: user?._id });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    student.xp += 25;
    student.coins += 10;
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Quest reward claimed successfully',
      data: {
        questId,
        reward: { xp: 25, coins: 10 },
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

export const generateRoadmap = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const student = await StudentProfile.findOne({ userId: user?._id });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    const weakMasteries = await StudentMastery.find({ studentId: student._id, weakTopicFlag: true }).populate('topicId', 'name');
    const weakTopicNames = weakMasteries.map((m: any) => m.topicId?.name).filter(Boolean);

    const roadmap = await AIService.generateStudyRoadmap(student.classLevel, weakTopicNames);

    res.status(200).json({
      success: true,
      message: 'AI 7-Day Study Roadmap generated',
      data: roadmap,
    });
  } catch (error) {
    next(error);
  }
};
