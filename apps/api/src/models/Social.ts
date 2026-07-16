import mongoose, { Schema, Document } from 'mongoose';

// 1. Clan Schema
export interface IClan extends Document {
  name: string;
  code: string; // Unique join code
  logoUrl?: string;
  creatorId: mongoose.Types.ObjectId; // References StudentProfile
  membersCount: number;
  weeklyXPEarned: number;
  announcements: Array<{
    title: string;
    body: string;
    createdAt: Date;
  }>;
  activityFeed: Array<{
    message: string;
    createdAt: Date;
  }>;
}

const ClanSchema = new Schema<IClan>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    logoUrl: String,
    creatorId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
    membersCount: { type: Number, default: 1 },
    weeklyXPEarned: { type: Number, default: 0, index: true },
    announcements: [
      {
        title: { type: String, required: true },
        body: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    activityFeed: [
      {
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Clan = mongoose.model<IClan>('Clan', ClanSchema);

// 2. Clan Membership Schema
export interface IClanMembership extends Document {
  studentId: mongoose.Types.ObjectId;
  clanId: mongoose.Types.ObjectId;
  role: 'leader' | 'elder' | 'member';
  joinedAt: Date;
}

const ClanMembershipSchema = new Schema<IClanMembership>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true, unique: true, index: true },
    clanId: { type: Schema.Types.ObjectId, ref: 'Clan', required: true, index: true },
    role: { type: String, required: true, enum: ['leader', 'elder', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ClanMembership = mongoose.model<IClanMembership>('ClanMembership', ClanMembershipSchema);

// 3. Tournament Schema
export interface ITournament extends Document {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  classes: number[]; // e.g. [5, 6, 7]
  subjects: mongoose.Types.ObjectId[]; // References Subject
  status: 'upcoming' | 'active' | 'completed' | 'reviewing';
}

const TournamentSchema = new Schema<ITournament>(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    classes: [{ type: Number, required: true }],
    subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject', required: true }],
    status: {
      type: String,
      required: true,
      enum: ['upcoming', 'active', 'completed', 'reviewing'],
      default: 'upcoming',
      index: true,
    },
  },
  { timestamps: true }
);

export const Tournament = mongoose.model<ITournament>('Tournament', TournamentSchema);

// 4. Tournament Participant Schema
export interface ITournamentParticipant extends Document {
  tournamentId: mongoose.Types.ObjectId;
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  score: number;
  rank: number;
}

const TournamentParticipantSchema = new Schema<ITournamentParticipant>(
  {
    tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true, index: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    score: { type: Number, default: 0, index: true },
    rank: { type: Number, default: 0 },
  },
  { timestamps: true }
);

TournamentParticipantSchema.index({ tournamentId: 1, studentId: 1 }, { unique: true });

export const TournamentParticipant = mongoose.model<ITournamentParticipant>('TournamentParticipant', TournamentParticipantSchema);

// 5. Historical Leaderboard Entry
export interface ILeaderboardEntry extends Document {
  studentId: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  leaderboardType: 'global' | 'school' | 'clan';
  score: number;
  rank: number;
  period: 'weekly' | 'monthly' | 'all_time';
  date: string; // e.g. YYYY-MM-DD or YYYY-WW
}

const LeaderboardEntrySchema = new Schema<ILeaderboardEntry>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', index: true },
    leaderboardType: { type: String, required: true, enum: ['global', 'school', 'clan'], index: true },
    score: { type: Number, required: true },
    rank: { type: Number, required: true },
    period: { type: String, required: true, enum: ['weekly', 'monthly', 'all_time'], index: true },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

export const LeaderboardEntry = mongoose.model<ILeaderboardEntry>('LeaderboardEntry', LeaderboardEntrySchema);
