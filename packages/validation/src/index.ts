import { z } from 'zod';

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(3, 'Username or Email must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Username must be alphanumeric or contain _ or -'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum([
    'Student',
    'Parent',
    'Teacher',
    'School Administrator',
    'Content Creator',
    'Moderator',
    'Platform Administrator',
    'Super Administrator',
  ]),
  schoolInvitationCode: z.string().optional(),
});

export const studentOnboardingSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dob: z.string().optional(),
  classLevel: z.number().int().min(1).max(10),
  board: z.enum(['CBSE', 'ICSE', 'State']),
  schoolId: z.string().optional(),
  languagePreference: z.enum(['en', 'hi']),
  learningGoals: z.string().optional(),
  dailyStudyTargetMinutes: z.number().int().min(5).max(180).default(20),
  selectedAvatarId: z.string().default('boy'),
});

export const parentOnboardingSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().regex(/^\+?[0-9]{10,14}$/, 'Invalid phone number format'),
  studentLinkingCode: z.string().min(6, 'Linking code must be at least 6 characters'),
  weeklyReportPreference: z.boolean().default(true),
});

export const teacherOnboardingSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  schoolCode: z.string().min(3, 'School code is required'),
  subjects: z.array(z.string()).min(1, 'Select at least one subject'),
  classesTaught: z.array(z.number().int().min(1).max(10)).min(1, 'Select at least one class'),
  bio: z.string().max(300, 'Bio must be under 300 characters').optional(),
});

export const schoolOnboardingSchema = z.object({
  schoolName: z.string().min(3, 'School name must be at least 3 characters'),
  board: z.string().min(2, 'Board name is required'),
  address: z.string().min(5, 'Address is required'),
  administrativeContact: z.string().min(5, 'Contact details are required'),
  teacherInvitationCode: z.string().min(4, 'Teacher code must be at least 4 characters'),
});

export const answerSubmissionSchema = z.object({
  questionId: z.string(),
  answer: z.union([z.string(), z.number(), z.array(z.string()), z.array(z.number())]),
  timeTakenSeconds: z.number().optional(),
  hintCountUsed: z.number().optional(),
});

export const levelCompletionSchema = z.object({
  levelId: z.string(),
  sessionToken: z.string(),
  score: z.number().min(0),
  timeSpentSeconds: z.number().min(1),
  answers: z.array(answerSubmissionSchema),
});

export const avatarPurchaseSchema = z.object({
  itemId: z.string(),
});

export const createAssignmentSchema = z.object({
  classRoomId: z.string(),
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  subjectId: z.string(),
  dueDate: z.string().datetime('Invalid date format'),
  type: z.enum(['mission', 'quiz', 'worksheet']),
  referenceId: z.string(),
  maxScore: z.number().int().positive().default(100),
});

export const clanCreateSchema = z.object({
  name: z.string().min(3, 'Clan name must be at least 3 characters').max(20, 'Clan name must be under 20 characters'),
  logoUrl: z.string().optional(),
});

export const clanJoinSchema = z.object({
  code: z.string().min(6, 'Clan join code is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type StudentOnboardingInput = z.infer<typeof studentOnboardingSchema>;
export type ParentOnboardingInput = z.infer<typeof parentOnboardingSchema>;
export type TeacherOnboardingInput = z.infer<typeof teacherOnboardingSchema>;
export type SchoolOnboardingInput = z.infer<typeof schoolOnboardingSchema>;
export type AnswerSubmissionInput = z.infer<typeof answerSubmissionSchema>;
export type LevelCompletionInput = z.infer<typeof levelCompletionSchema>;
export type AvatarPurchaseInput = z.infer<typeof avatarPurchaseSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type ClanCreateInput = z.infer<typeof clanCreateSchema>;
export type ClanJoinInput = z.infer<typeof clanJoinSchema>;
