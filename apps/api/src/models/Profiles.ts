import mongoose, { Schema, Document } from 'mongoose';

// 1. School Schema
export interface ISchool extends Document {
  name: string;
  code: string;
  board: string;
  logoUrl?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SchoolSchema = new Schema<ISchool>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    board: { type: String, required: true, trim: true },
    logoUrl: String,
    address: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const School = mongoose.model<ISchool>('School', SchoolSchema);

// 2. Student Profile Schema
export interface IStudentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  dob?: Date;
  classLevel: number; // 1 to 10
  board: 'CBSE' | 'ICSE' | 'State';
  schoolId?: mongoose.Types.ObjectId;
  languagePreference: 'en' | 'hi';
  learningGoals?: string;
  dailyStudyTargetMinutes: number;
  selectedAvatarId: string;
  selectedInventoryItems: {
    helmet?: string;
    weapon?: string;
    outfit?: string;
    frame?: string;
    background?: string;
  };
  streakCount: number;
  longestStreak: number;
  xp: number;
  coins: number;
  gems: number;
  energy: number;
  energyLastRefilledAt: Date;
  clanId?: mongoose.Types.ObjectId;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dob: Date,
    classLevel: { type: Number, required: true, min: 1, max: 10, index: true },
    board: { type: String, required: true, enum: ['CBSE', 'ICSE', 'State'], index: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', index: true },
    languagePreference: { type: String, required: true, enum: ['en', 'hi'], default: 'en' },
    learningGoals: String,
    dailyStudyTargetMinutes: { type: Number, default: 20 },
    selectedAvatarId: { type: String, default: 'boy' },
    selectedInventoryItems: {
      helmet: String,
      weapon: String,
      outfit: String,
      frame: String,
      background: String,
    },
    streakCount: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    xp: { type: Number, default: 0, index: true },
    coins: { type: Number, default: 100 },
    gems: { type: Number, default: 10 },
    energy: { type: Number, default: 100 },
    energyLastRefilledAt: { type: Date, default: Date.now },
    clanId: { type: Schema.Types.ObjectId, ref: 'Clan', index: true },
    title: { type: String, default: 'Novice Learner' },
  },
  { timestamps: true }
);

export const StudentProfile = mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);

// 3. Parent Profile Schema
export interface IParentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  phone: string;
  linkedStudents: mongoose.Types.ObjectId[];
  weeklyReportPreference: boolean;
  screenTimeLimits: Map<string, number>; // Map of studentId string -> minutes
  createdAt: Date;
  updatedAt: Date;
}

const ParentProfileSchema = new Schema<IParentProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    linkedStudents: [{ type: Schema.Types.ObjectId, ref: 'StudentProfile' }],
    weeklyReportPreference: { type: Boolean, default: true },
    screenTimeLimits: { type: Map, of: Number, default: new Map() },
  },
  { timestamps: true }
);

export const ParentProfile = mongoose.model<IParentProfile>('ParentProfile', ParentProfileSchema);

// 4. Teacher Profile Schema
export interface ITeacherProfile extends Document {
  userId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  schoolId?: mongoose.Types.ObjectId;
  subjects: string[];
  classesTaught: number[];
  bio?: string;
  verificationDocumentUrl?: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherProfileSchema = new Schema<ITeacherProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', index: true },
    subjects: [{ type: String, required: true }],
    classesTaught: [{ type: Number, required: true }],
    bio: String,
    verificationDocumentUrl: String,
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const TeacherProfile = mongoose.model<ITeacherProfile>('TeacherProfile', TeacherProfileSchema);

// 5. Classroom Schema
export interface IClassRoom extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  teacherId: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClassRoomSchema = new Schema<IClassRoom>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true, trim: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'TeacherProfile', required: true, index: true },
    students: [{ type: Schema.Types.ObjectId, ref: 'StudentProfile' }],
    academicYear: { type: String, required: true },
  },
  { timestamps: true }
);

export const ClassRoom = mongoose.model<IClassRoom>('ClassRoom', ClassRoomSchema);
