export type UserRole =
  | 'Student'
  | 'Parent'
  | 'Teacher'
  | 'School Administrator'
  | 'Content Creator'
  | 'Moderator'
  | 'Platform Administrator'
  | 'Super Administrator';

export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: any;
}

export interface APIErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: any[];
}

export interface UserDTO {
  id: string;
  email?: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface StudentProfileDTO {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dob?: string;
  classLevel: number;
  board: 'CBSE' | 'ICSE' | 'State';
  schoolId?: string;
  schoolName?: string;
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
  clanId?: string;
  title?: string;
}

export interface ParentProfileDTO {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  linkedStudents: string[];
  weeklyReportPreference: boolean;
  screenTimeLimits: Record<string, number>;
}

export interface TeacherProfileDTO {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  schoolId?: string;
  subjects: string[];
  classesTaught: number[];
  bio?: string;
  verificationDocumentUrl?: string;
  isApproved: boolean;
}

export interface SchoolDTO {
  id: string;
  name: string;
  code: string;
  board: string;
  logoUrl?: string;
  address?: string;
}

export interface SubjectDTO {
  id: string;
  name: string;
  code: string;
  icon?: string;
  storyPrompt?: string;
}

export interface ChapterDTO {
  id: string;
  subjectId: string;
  name: string;
  sequence: number;
  bannerUrl?: string;
  description?: string;
}

export interface TopicDTO {
  id: string;
  chapterId: string;
  name: string;
  description?: string;
  sequence: number;
}

export interface MissionDTO {
  id: string;
  topicId: string;
  name: string;
  type: 'story' | 'normal' | 'boss' | 'practice';
  sequence: number;
  xpReward: number;
  coinReward: number;
  crystalReward: number;
  prerequisites: string[];
}

export interface QuestionDTO {
  id: string;
  topicId: string;
  type: 'mcq' | 'multi-select' | 'fitb' | 'matching' | 'ordering' | 'short';
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  questionMedia?: string;
  options: string[];
  explanation?: string;
  hints: string[];
  marks: number;
  timeLimitSeconds?: number;
}

export interface AvatarItemDTO {
  id: string;
  name: string;
  category: 'helmet' | 'weapon' | 'outfit' | 'frame' | 'background' | 'emote';
  assetUrl: string;
  priceCoins: number;
  priceGems: number;
  requiredLevel: number;
  isPremiumOnly: boolean;
  isActive: boolean;
}

export interface ReelDTO {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  subjectId: string;
  chapterId: string;
  classLevel: number;
  language: 'en' | 'hi';
  teacherId?: string;
  teacherName?: string;
  quizQuestions: QuestionDTO[];
  likesCount: number;
  viewsCount: number;
  isVerified: boolean;
}

export interface ClanDTO {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  membersCount: number;
  weeklyXPEarned: number;
}

export interface TournamentDTO {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  classes: number[];
  subjects: string[];
  status: 'upcoming' | 'active' | 'completed' | 'reviewing';
}

export interface AssignmentDTO {
  id: string;
  classRoomId: string;
  teacherId: string;
  title: string;
  description?: string;
  subjectId: string;
  dueDate: string;
  type: 'mission' | 'quiz' | 'worksheet';
  referenceId: string;
  maxScore: number;
  status: 'active' | 'closed';
}

export interface QuestDTO {
  id: string;
  title: string;
  description: string;
  type: string;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  isClaimed: boolean;
}
