import mongoose, { Schema, Document } from 'mongoose';

// 1. Notification Schema
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  type: 'assignment' | 'quest' | 'clan' | 'system' | 'badge';
  isRead: boolean;
  deepLink?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, required: true, enum: ['assignment', 'quest', 'clan', 'system', 'badge'] },
    isRead: { type: Boolean, default: false, index: true },
    deepLink: String,
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

// 2. Subscription Schema
export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  plan: 'free' | 'premium_student' | 'family' | 'school';
  status: 'active' | 'expired' | 'canceled';
  expiresAt: Date;
  stripeSubscriptionId?: string;
  billingHistory: Array<Record<string, any>>;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    plan: { type: String, required: true, enum: ['free', 'premium_student', 'family', 'school'], default: 'free' },
    status: { type: String, required: true, enum: ['active', 'expired', 'canceled'], default: 'active' },
    expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) }, // 100 years for free users
    stripeSubscriptionId: String,
    billingHistory: { type: [Schema.Types.Mixed], default: [] } as any,
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

// 3. Educational Reel Schema
export interface IReel extends Document {
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  subjectId: mongoose.Types.ObjectId;
  chapterId: mongoose.Types.ObjectId;
  classLevel: number;
  language: 'en' | 'hi';
  teacherId?: mongoose.Types.ObjectId;
  quizQuestions: mongoose.Types.ObjectId[]; // Question IDs for the end quiz
  likesCount: number;
  viewsCount: number;
  isVerified: boolean;
}

const ReelSchema = new Schema<IReel>(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    videoUrl: { type: String, required: true },
    thumbnailUrl: String,
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
    classLevel: { type: Number, required: true, min: 1, max: 10, index: true },
    language: { type: String, required: true, enum: ['en', 'hi'], default: 'en' },
    teacherId: { type: Schema.Types.ObjectId, ref: 'TeacherProfile' },
    quizQuestions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    likesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Reel = mongoose.model<IReel>('Reel', ReelSchema);

// 4. Reel Interaction Schema (Screen-time and accuracy metrics)
export interface IReelInteraction extends Document {
  studentId: mongoose.Types.ObjectId;
  reelId: mongoose.Types.ObjectId;
  watchDurationSeconds: number;
  liked: boolean;
  saved: boolean;
  quizScore?: number;
  quizCompleted: boolean;
}

const ReelInteractionSchema = new Schema<IReelInteraction>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    reelId: { type: Schema.Types.ObjectId, ref: 'Reel', required: true, index: true },
    watchDurationSeconds: { type: Number, default: 0 },
    liked: { type: Boolean, default: false },
    saved: { type: Boolean, default: false },
    quizScore: Number,
    quizCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ReelInteractionSchema.index({ studentId: 1, reelId: 1 }, { unique: true });

export const ReelInteraction = mongoose.model<IReelInteraction>('ReelInteraction', ReelInteractionSchema);

// 5. Media Asset Schema
export interface IMediaAsset extends Document {
  name: string;
  s3Key: string;
  bucket: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: mongoose.Types.ObjectId;
  usageType: 'avatar' | 'reel' | 'certificate' | 'logo' | 'verification' | 'worksheet';
  isTemporary: boolean;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    name: { type: String, required: true },
    s3Key: { type: String, required: true, unique: true },
    bucket: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    usageType: {
      type: String,
      required: true,
      enum: ['avatar', 'reel', 'certificate', 'logo', 'verification', 'worksheet'],
    },
    isTemporary: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const MediaAsset = mongoose.model<IMediaAsset>('MediaAsset', MediaAssetSchema);

// 6. Audit Log Schema
export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  action: { type: String, required: true, index: true },
  ipAddress: String,
  userAgent: String,
  metadata: { type: Schema.Types.Map, of: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true },
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

// 7. Feature Flag Schema
export interface IFeatureFlag extends Document {
  key: string;
  value: boolean;
  description?: string;
}

const FeatureFlagSchema = new Schema<IFeatureFlag>({
  key: { type: String, required: true, unique: true, uppercase: true, index: true },
  value: { type: Boolean, required: true, default: false },
  description: String,
});

export const FeatureFlag = mongoose.model<IFeatureFlag>('FeatureFlag', FeatureFlagSchema);

// 8. AI Conversation Schema
export interface IAIConversation extends Document {
  studentId: mongoose.Types.ObjectId;
  questionId?: mongoose.Types.ObjectId;
  contextType: 'wrong_answer_help' | 'revision' | 'chapter_summary';
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  tokensUsed: number;
}

const AIConversationSchema = new Schema<IAIConversation>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
    contextType: {
      type: String,
      required: true,
      enum: ['wrong_answer_help', 'revision', 'chapter_summary'],
    },
    messages: [
      {
        role: { type: String, required: true, enum: ['system', 'user', 'assistant'] },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    tokensUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const AIConversation = mongoose.model<IAIConversation>('AIConversation', AIConversationSchema);

// 9. Refresh Token Schema (JWT Device tracking)
export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    deviceId: String,
    ipAddress: String,
    userAgent: String,
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
