import mongoose from 'mongoose';
import { StudentProfile } from '../models/Profiles.js';
import { WalletTransaction } from '../models/Inventory.js';
import { Notification } from '../models/Misc.js';
import { logger } from '../config/logger.js';

export class WalletService {
  /**
   * Adjusts a student's currency wallet. Enforces atomic safety, checks level ups, and logs transactions.
   */
  static async adjustBalance(
    studentId: string | mongoose.Types.ObjectId,
    currency: 'xp' | 'coins' | 'gems' | 'energy',
    amount: number,
    type: 'lesson_reward' | 'avatar_purchase' | 'quest_completion' | 'admin_adjustment' | 'daily_refill' | 'clan_reward' | 'tournament_reward',
    referenceId?: string | mongoose.Types.ObjectId,
    session?: mongoose.ClientSession
  ): Promise<any> {
    const profile = await StudentProfile.findById(studentId).session(session || null);
    if (!profile) {
      throw new Error('Student profile not found');
    }

    // Prevent negative balances for spendable currencies
    if (currency === 'coins' && profile.coins + amount < 0) {
      throw new Error('Insufficient Coins');
    }
    if (currency === 'gems' && profile.gems + amount < 0) {
      throw new Error('Insufficient Gems');
    }
    if (currency === 'energy' && profile.energy + amount < 0) {
      throw new Error('Insufficient Energy');
    }

    const previousXP = profile.xp;
    
    // Apply changes
    if (currency === 'xp') profile.xp = Math.max(0, profile.xp + amount);
    if (currency === 'coins') profile.coins = Math.max(0, profile.coins + amount);
    if (currency === 'gems') profile.gems = Math.max(0, profile.gems + amount);
    if (currency === 'energy') profile.energy = Math.max(0, Math.min(100, profile.energy + amount)); // Cap energy at 100

    // Check Level Up: 1000 XP per level
    let leveledUp = false;
    let newLevel = profile.classLevel; // Use class level or custom level? Let's use custom Level calculated from XP.
    // Custom level: floor(xp / 1000) + 1
    const oldLevelNum = Math.floor(previousXP / 1000) + 1;
    const newLevelNum = Math.floor(profile.xp / 1000) + 1;
    
    if (newLevelNum > oldLevelNum) {
      leveledUp = true;
      profile.title = this.getTitleForLevel(newLevelNum);
      // Reward on level up
      profile.coins += 100;
      profile.gems += 10;
      logger.info(`🎉 Student ${profile._id} Leveled Up to ${newLevelNum}!`);
    }

    await profile.save({ session });

    // Log transaction
    const transaction = new WalletTransaction({
      studentId,
      currency,
      amount,
      type,
      referenceId: referenceId ? new mongoose.Types.ObjectId(referenceId.toString()) : undefined,
    });
    await transaction.save({ session });

    // If leveled up, log bonus coins/gems transactions and trigger notification
    if (leveledUp) {
      const levelUpCoins = new WalletTransaction({
        studentId,
        currency: 'coins',
        amount: 100,
        type: 'lesson_reward',
        referenceId: transaction._id,
      });
      await levelUpCoins.save({ session });

      const levelUpGems = new WalletTransaction({
        studentId,
        currency: 'gems',
        amount: 10,
        type: 'lesson_reward',
        referenceId: transaction._id,
      });
      await levelUpGems.save({ session });

      // Create level up notification
      const notification = new Notification({
        userId: profile.userId,
        title: '🎉 Level Up!',
        body: `Congratulations! You reached Level ${newLevelNum} and earned 100 Coins & 10 Gems! New Title: ${profile.title}`,
        type: 'badge',
        deepLink: '/profile',
      });
      await notification.save({ session });
    }

    return {
      success: true,
      xp: profile.xp,
      coins: profile.coins,
      gems: profile.gems,
      energy: profile.energy,
      level: newLevelNum,
      title: profile.title,
      leveledUp,
    };
  }

  private static getTitleForLevel(level: number): string {
    if (level >= 30) return 'Knowledge Overlord';
    if (level >= 20) return 'Grandmaster Learner';
    if (level >= 15) return 'Sage Explorer';
    if (level >= 10) return 'Knowledge Warrior';
    if (level >= 5) return 'curious Scholar';
    return 'Novice Learner';
  }
}
