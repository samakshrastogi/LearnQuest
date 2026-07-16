import mongoose, { Schema, Document } from 'mongoose';

// 1. Avatar Item Schema (Shop inventory definition)
export interface IAvatarItem extends Document {
  name: string;
  category: 'helmet' | 'weapon' | 'outfit' | 'frame' | 'background' | 'emote';
  assetUrl: string;
  priceCoins: number;
  priceGems: number;
  requiredLevel: number;
  isPremiumOnly: boolean;
  isActive: boolean;
}

const AvatarItemSchema = new Schema<IAvatarItem>(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['helmet', 'weapon', 'outfit', 'frame', 'background', 'emote'],
      index: true,
    },
    assetUrl: { type: String, required: true },
    priceCoins: { type: Number, default: 0 },
    priceGems: { type: Number, default: 0 },
    requiredLevel: { type: Number, default: 1 },
    isPremiumOnly: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const AvatarItem = mongoose.model<IAvatarItem>('AvatarItem', AvatarItemSchema);

// 2. User Inventory Schema (Student unlocks)
export interface IUserInventory extends Document {
  studentId: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  unlockedAt: Date;
}

const UserInventorySchema = new Schema<IUserInventory>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'AvatarItem', required: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserInventorySchema.index({ studentId: 1, itemId: 1 }, { unique: true });

export const UserInventory = mongoose.model<IUserInventory>('UserInventory', UserInventorySchema);

// 3. Wallet Transaction Schema (Transaction ledger)
export interface IWalletTransaction extends Document {
  studentId: mongoose.Types.ObjectId;
  currency: 'xp' | 'coins' | 'gems' | 'energy';
  amount: number; // positive for gain, negative for spent
  type: 'lesson_reward' | 'avatar_purchase' | 'quest_completion' | 'admin_adjustment' | 'daily_refill' | 'clan_reward' | 'tournament_reward';
  referenceId?: mongoose.Types.ObjectId; // e.g. MissionAttempt ID or UserQuest ID or AvatarItem ID
  createdAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    currency: { type: String, required: true, enum: ['xp', 'coins', 'gems', 'energy'], index: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      required: true,
      enum: [
        'lesson_reward',
        'avatar_purchase',
        'quest_completion',
        'admin_adjustment',
        'daily_refill',
        'clan_reward',
        'tournament_reward',
      ],
      index: true,
    },
    referenceId: Schema.Types.ObjectId,
  },
  { timestamps: true }
);

export const WalletTransaction = mongoose.model<IWalletTransaction>('WalletTransaction', WalletTransactionSchema);
