import mongoose, { Schema, Document } from 'mongoose';

// 1. Question Schema (The Question Bank)
export interface IQuestion extends Document {
  topicId: mongoose.Types.ObjectId;
  type: 'mcq' | 'multi-select' | 'fitb' | 'matching' | 'ordering' | 'short';
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  questionMedia?: string;
  options: string[]; // Options choices list (shuffled on frontend if needed)
  correctAnswer: any; // Checked strictly on backend. Can be string index, number, array of indexes/words
  explanation?: string;
  hints: string[];
  marks: number;
  timeLimitSeconds?: number;
  isActive: boolean;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['mcq', 'multi-select', 'fitb', 'matching', 'ordering', 'short'],
      default: 'mcq',
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      index: true,
    },
    questionText: { type: String, required: true },
    questionMedia: String,
    options: [{ type: String }],
    correctAnswer: { type: Schema.Types.Mixed, required: true },
    explanation: String,
    hints: [{ type: String }],
    marks: { type: Number, default: 10 },
    timeLimitSeconds: { type: Number, default: 30 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);

// 2. Game Session Schema (Anti-cheat configuration validation)
export interface IGameSession extends Document {
  studentId: mongoose.Types.ObjectId;
  levelId: mongoose.Types.ObjectId;
  sessionToken: string;
  status: 'active' | 'completed' | 'failed';
  startedAt: Date;
  expiresAt: Date;
}

const GameSessionSchema = new Schema<IGameSession>({
  studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
  levelId: { type: Schema.Types.ObjectId, ref: 'GameLevel', required: true },
  sessionToken: { type: String, required: true, unique: true, index: true },
  status: { type: String, required: true, enum: ['active', 'completed', 'failed'], default: 'active' },
  startedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

export const GameSession = mongoose.model<IGameSession>('GameSession', GameSessionSchema);

// 3. Mission Attempt Schema
export interface IMissionAttempt extends Document {
  studentId: mongoose.Types.ObjectId;
  missionId: mongoose.Types.ObjectId;
  status: 'success' | 'failed';
  score: number;
  xpGained: number;
  coinsGained: number;
  gemsGained: number;
  timeSpentSeconds: number;
  completedAt: Date;
}

const MissionAttemptSchema = new Schema<IMissionAttempt>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    missionId: { type: Schema.Types.ObjectId, ref: 'Mission', required: true, index: true },
    status: { type: String, required: true, enum: ['success', 'failed'] },
    score: { type: Number, required: true },
    xpGained: { type: Number, default: 0 },
    coinsGained: { type: Number, default: 0 },
    gemsGained: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, required: true },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const MissionAttempt = mongoose.model<IMissionAttempt>('MissionAttempt', MissionAttemptSchema);

// 4. Question Attempt Schema
export interface IQuestionAttempt extends Document {
  studentId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  missionAttemptId?: mongoose.Types.ObjectId;
  isCorrect: boolean;
  selectedAnswer: any;
  timeTakenSeconds: number;
  hintCountUsed: number;
  createdAt: Date;
}

const QuestionAttemptSchema = new Schema<IQuestionAttempt>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
    missionAttemptId: { type: Schema.Types.ObjectId, ref: 'MissionAttempt', index: true },
    isCorrect: { type: Boolean, required: true, index: true },
    selectedAnswer: { type: Schema.Types.Mixed },
    timeTakenSeconds: { type: Number, default: 0 },
    hintCountUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const QuestionAttempt = mongoose.model<IQuestionAttempt>('QuestionAttempt', QuestionAttemptSchema);

// 5. Student Mastery Schema (Adaptive Learning engine uses this)
export interface IStudentMastery extends Document {
  studentId: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  masteryScore: number; // 0 to 100
  confidenceScore: number; // 0 to 100
  attemptsCount: number;
  correctAttemptsCount: number;
  weakTopicFlag: boolean;
  lastAttemptedAt: Date;
}

const StudentMasterySchema = new Schema<IStudentMastery>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    masteryScore: { type: Number, default: 0, min: 0, max: 100, index: true },
    confidenceScore: { type: Number, default: 0, min: 0, max: 100 },
    attemptsCount: { type: Number, default: 0 },
    correctAttemptsCount: { type: Number, default: 0 },
    weakTopicFlag: { type: Boolean, default: false, index: true },
    lastAttemptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

StudentMasterySchema.index({ studentId: 1, topicId: 1 }, { unique: true });

export const StudentMastery = mongoose.model<IStudentMastery>('StudentMastery', StudentMasterySchema);

// 6. Player Progress Schema (Simple index tracking unlocks)
export interface IPlayerProgress extends Document {
  studentId: mongoose.Types.ObjectId;
  unlockedMissions: mongoose.Types.ObjectId[];
  completedMissions: mongoose.Types.ObjectId[];
  unlockedSubjects: mongoose.Types.ObjectId[];
}

const PlayerProgressSchema = new Schema<IPlayerProgress>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true, unique: true, index: true },
    unlockedMissions: [{ type: Schema.Types.ObjectId, ref: 'Mission' }],
    completedMissions: [{ type: Schema.Types.ObjectId, ref: 'Mission' }],
    unlockedSubjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
  },
  { timestamps: true }
);

export const PlayerProgress = mongoose.model<IPlayerProgress>('PlayerProgress', PlayerProgressSchema);
