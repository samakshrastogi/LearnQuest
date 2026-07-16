import mongoose, { Schema, Document } from 'mongoose';

// 1. Subject Schema
export interface ISubject extends Document {
  name: string;
  code: string; // e.g., math, science, english
  icon?: string;
  storyPrompt?: string; // Text setting up the world's narrative
  isActive: boolean;
}

const SubjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true, lowercase: true, trim: true },
    icon: String,
    storyPrompt: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Subject = mongoose.model<ISubject>('Subject', SubjectSchema);

// 2. Chapter Schema
export interface IChapter extends Document {
  subjectId: mongoose.Types.ObjectId;
  name: string;
  sequence: number;
  bannerUrl?: string;
  description?: string;
}

const ChapterSchema = new Schema<IChapter>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    name: { type: String, required: true },
    sequence: { type: Number, required: true },
    bannerUrl: String,
    description: String,
  },
  { timestamps: true }
);

ChapterSchema.index({ subjectId: 1, sequence: 1 }, { unique: true });

export const Chapter = mongoose.model<IChapter>('Chapter', ChapterSchema);

// 3. Topic Schema
export interface ITopic extends Document {
  chapterId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  sequence: number;
}

const TopicSchema = new Schema<ITopic>(
  {
    chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true, index: true },
    name: { type: String, required: true },
    description: String,
    sequence: { type: Number, required: true },
  },
  { timestamps: true }
);

TopicSchema.index({ chapterId: 1, sequence: 1 }, { unique: true });

export const Topic = mongoose.model<ITopic>('Topic', TopicSchema);

// 4. Mission Schema
export interface IMission extends Document {
  topicId: mongoose.Types.ObjectId;
  name: string;
  type: 'story' | 'normal' | 'boss' | 'practice';
  sequence: number;
  xpReward: number;
  coinReward: number;
  crystalReward: number;
  prerequisites: mongoose.Types.ObjectId[];
}

const MissionSchema = new Schema<IMission>(
  {
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ['story', 'normal', 'boss', 'practice'], default: 'normal' },
    sequence: { type: Number, required: true },
    xpReward: { type: Number, default: 50 },
    coinReward: { type: Number, default: 10 },
    crystalReward: { type: Number, default: 0 },
    prerequisites: [{ type: Schema.Types.ObjectId, ref: 'Mission' }],
  },
  { timestamps: true }
);

MissionSchema.index({ topicId: 1, sequence: 1 }, { unique: true });

export const Mission = mongoose.model<IMission>('Mission', MissionSchema);

// 5. GameLevel Schema (Holds Phaser specific level properties)
export interface IGameLevel extends Document {
  missionId: mongoose.Types.ObjectId;
  sceneKey: string; // Phaser scene reference
  mapData: Record<string, any>; // Grid/Tile layouts
  enemyConfig: Array<Record<string, any>>;
  checkpointQuestions: mongoose.Types.ObjectId[]; // Questions triggered at doors/barriers
}

const GameLevelSchema = new Schema<IGameLevel>(
  {
    missionId: { type: Schema.Types.ObjectId, ref: 'Mission', required: true, unique: true, index: true },
    sceneKey: { type: String, required: true, default: 'PlatformerScene' },
    mapData: { type: Schema.Types.Map, of: Schema.Types.Mixed, default: {} },
    enemyConfig: { type: [Schema.Types.Mixed], default: [] } as any,
    checkpointQuestions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  },
  { timestamps: true }
);

export const GameLevel = mongoose.model<IGameLevel>('GameLevel', GameLevelSchema);
