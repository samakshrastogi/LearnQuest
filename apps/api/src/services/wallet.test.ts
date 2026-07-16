import mongoose from 'mongoose';
import { WalletService } from './wallet';
import { StudentProfile } from '../models/Profiles';
import { WalletTransaction } from '../models/Inventory';
import { Notification } from '../models/Misc';

jest.mock('../models/Profiles');
jest.mock('../models/Inventory');
jest.mock('../models/Misc');

describe('WalletService', () => {
  let mockProfile: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProfile = {
      _id: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      xp: 1500,
      coins: 200,
      gems: 15,
      energy: 80,
      title: 'curious Scholar',
      save: jest.fn().mockResolvedValue(true),
    };

    (StudentProfile.findById as jest.Mock).mockReturnValue({
      session: jest.fn().mockResolvedValue(mockProfile),
    });

    // Mock constructors
    (WalletTransaction as unknown as jest.Mock).mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(true),
    }));
    (Notification as unknown as jest.Mock).mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(true),
    }));
  });

  it('should adjust student coins balance successfully', async () => {
    const res = await WalletService.adjustBalance(mockProfile._id, 'coins', 50, 'lesson_reward');

    expect(res.success).toBe(true);
    expect(res.coins).toBe(250);
    expect(mockProfile.save).toHaveBeenCalled();
  });

  it('should throw an error if adjusting coins results in negative balance', async () => {
    await expect(
      WalletService.adjustBalance(mockProfile._id, 'coins', -500, 'avatar_purchase')
    ).rejects.toThrow('Insufficient Coins');

    expect(mockProfile.save).not.toHaveBeenCalled();
  });

  it('should trigger a level up if XP exceeds the 1000 threshold', async () => {
    // Current XP: 1500 (Level 2). Add 600 XP -> 2100 XP (Level 3)
    const res = await WalletService.adjustBalance(mockProfile._id, 'xp', 600, 'lesson_reward');

    expect(res.success).toBe(true);
    expect(res.level).toBe(3);
    expect(res.leveledUp).toBe(true);
    expect(mockProfile.coins).toBe(300); // 200 initial + 100 reward
    expect(mockProfile.gems).toBe(25);   // 15 initial + 10 reward
  });

  it('should cap energy at 100 when refilled', async () => {
    const res = await WalletService.adjustBalance(mockProfile._id, 'energy', 50, 'daily_refill');

    expect(res.success).toBe(true);
    expect(res.energy).toBe(100); // Capped at 100
  });
});
