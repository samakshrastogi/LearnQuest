import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/Misc.js';
import { StudentProfile, ParentProfile, TeacherProfile, School } from '../models/Profiles.js';
import { PlayerProgress } from '../models/Activity.js';
import { UserRole } from '@learnquest/shared-types';
import { logger } from '../config/logger.js';
import { EmailService } from '../services/email.js';

// JWT Generation Helpers
const generateAccessToken = (userId: string, username: string, role: UserRole): string => {
  return jwt.sign({ id: userId, username, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: (env.JWT_ACCESS_EXPIRES_IN || '15m') as any,
  });
};

const generateRefreshToken = (): string => {
  return crypto.randomBytes(40).toString('hex');
};

const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Backend Helper: Auto-seed demo accounts (student1, parent1, teacher1) if missing
 */
const seedDemoAccountIfRequested = async (username: string, role: UserRole) => {
  try {
    const existing = await User.findOne({ username });
    if (existing) return existing;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const newUser = new User({
      username,
      email: `${username}@learnquest.demo`,
      passwordHash,
      role,
      isVerified: true,
      isActive: true,
    });
    await newUser.save();

    if (role === 'Student') {
      const studentProfile = new StudentProfile({
        userId: newUser._id,
        firstName: username === 'student1' ? 'Aarav' : 'Demo Student',
        lastName: 'Sharma',
        classLevel: 6,
        board: 'CBSE',
        languagePreference: 'en',
        xp: 1500,
        coins: 250,
        gems: 15,
        energy: 100,
        selectedAvatarId: 'boy',
        selectedInventoryItems: {
          helmet: 'free_helmet',
          weapon: 'free_pencil',
          outfit: 'free_explorer',
          frame: 'free_wood',
          background: 'free_plains',
        },
      });
      await studentProfile.save();

      const progress = new PlayerProgress({
        studentId: studentProfile._id,
        unlockedMissions: [],
        completedMissions: [],
        unlockedSubjects: [],
      });
      await progress.save();

    } else if (role === 'Parent') {
      const student1 = await StudentProfile.findOne({});
      const parentProfile = new ParentProfile({
        userId: newUser._id,
        firstName: 'Rajesh',
        lastName: 'Sharma',
        phone: '+91 9876543210',
        linkedStudents: student1 ? [student1._id] : [],
      });
      await parentProfile.save();

    } else if (role === 'Teacher') {
      const teacherProfile = new TeacherProfile({
        userId: newUser._id,
        firstName: 'Priya',
        lastName: 'Verma',
        subjects: ['Mathematics', 'Science'],
        classesTaught: [5, 6, 7, 8],
        bio: 'Senior STEM Educator',
        isApproved: true,
      });
      await teacherProfile.save();
    }

    logger.info(`✨ Auto-seeded demo account on backend: ${username} (${role})`);
    return newUser;
  } catch (err: any) {
    logger.error(`Failed to auto-seed demo account ${username}: ${err.message}`);
    return null;
  }
};

/**
 * Backend Controller: User Registration
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, email, password, role, schoolInvitationCode } = req.body;

    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;

    if (!cleanUsername || !password || !role) {
      res.status(400).json({ success: false, message: 'Username, password, and role are required', code: 'BAD_REQUEST' });
      return;
    }

    // Check if user already exists
    const existingUsername = await User.findOne({ username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') } });
    if (existingUsername) {
      res.status(400).json({ success: false, message: 'Username is already taken', code: 'BAD_REQUEST' });
      return;
    }

    if (cleanEmail) {
      const existingEmail = await User.findOne({ email: cleanEmail });
      if (existingEmail) {
        res.status(400).json({ success: false, message: 'Email is already registered', code: 'BAD_REQUEST' });
        return;
      }
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // If school code was supplied, look up the school
    let associatedSchoolId = null;
    if (schoolInvitationCode) {
      const schoolObj = await School.findOne({ code: schoolInvitationCode.toUpperCase() });
      if (!schoolObj) {
        res.status(400).json({ success: false, message: 'Invalid school invitation code', code: 'BAD_REQUEST' });
        return;
      }
      associatedSchoolId = schoolObj._id;
    }

    // Create User
    const user = new User({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      role,
      isVerified: role !== 'Teacher',
    });
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString() as string, user.username, user.role);
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashToken(rawRefreshToken);

    const refreshTokenDoc = new RefreshToken({
      userId: user._id,
      tokenHash,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await refreshTokenDoc.save();

    res.cookie('refreshToken', rawRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        accessToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Backend Controller: User Login
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      res.status(400).json({ success: false, message: 'Username and password are required', code: 'BAD_REQUEST' });
      return;
    }

    const cleanQuery = usernameOrEmail.trim().toLowerCase();

    // Find User case-insensitively
    let user = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${cleanQuery}$`, 'i') } },
        { email: cleanQuery }
      ],
    });

    // Auto-seed demo accounts if requested and missing
    if (!user && ['student1', 'parent1', 'teacher1'].includes(cleanQuery)) {
      const demoRole = cleanQuery === 'student1' ? 'Student' : cleanQuery === 'parent1' ? 'Parent' : 'Teacher';
      user = await seedDemoAccountIfRequested(cleanQuery, demoRole as UserRole);
    }

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Invalid username or password', code: 'UNAUTHORIZED' });
      return;
    }

    // Verify Password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid username or password', code: 'UNAUTHORIZED' });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString() as string, user.username, user.role);
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashToken(rawRefreshToken);

    const refreshTokenDoc = new RefreshToken({
      userId: user._id,
      tokenHash,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await refreshTokenDoc.save();

    res.cookie('refreshToken', rawRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Check if profile exists
    let onboarded = false;
    let profileData: any = null;

    if (user.role === 'Student') {
      profileData = await StudentProfile.findOne({ userId: user._id });
      onboarded = !!profileData;
    } else if (user.role === 'Parent') {
      profileData = await ParentProfile.findOne({ userId: user._id });
      onboarded = !!profileData;
    } else if (user.role === 'Teacher') {
      profileData = await TeacherProfile.findOne({ userId: user._id });
      onboarded = !!profileData;
    } else {
      onboarded = true;
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        onboarded,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
        profile: profileData,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Backend Controller: Session Refresh & Token Rotation
 */
export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!rawRefreshToken) {
      res.status(401).json({ success: false, message: 'Refresh token required', code: 'UNAUTHORIZED' });
      return;
    }

    const tokenHash = hashToken(rawRefreshToken);
    const activeSession = await RefreshToken.findOne({ tokenHash });

    if (!activeSession || activeSession.expiresAt < new Date()) {
      res.status(401).json({ success: false, message: 'Invalid or expired session', code: 'UNAUTHORIZED' });
      return;
    }

    const user = await User.findById(activeSession.userId);
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Inactive or non-existent account', code: 'UNAUTHORIZED' });
      return;
    }

    // Rotate refresh token
    const newRawRefreshToken = generateRefreshToken();
    const newHash = hashToken(newRawRefreshToken);

    activeSession.tokenHash = newHash;
    activeSession.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await activeSession.save();

    const accessToken = generateAccessToken(user._id.toString() as string, user.username, user.role);

    res.cookie('refreshToken', newRawRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Token rotated successfully',
      data: {
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Backend Controller: Logout
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await RefreshToken.deleteOne({ tokenHash });
    }

    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Backend Controller: User Onboarding
 */
export const onboardUser = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const body = req.body;
    let createdProfile: any = null;

    if (user.role === 'Student') {
      const { firstName, lastName, dob, classLevel, board, schoolId, languagePreference, learningGoals, dailyStudyTargetMinutes, selectedAvatarId } = body;
      
      const existing = await StudentProfile.findOne({ userId: user._id }).session(session);
      if (existing) {
        res.status(400).json({ success: false, message: 'Student profile already onboarded', code: 'BAD_REQUEST' });
        return;
      }

      createdProfile = new StudentProfile({
        userId: user._id,
        firstName,
        lastName,
        dob: dob ? new Date(dob) : undefined,
        classLevel,
        board,
        schoolId: schoolId ? new mongoose.Types.ObjectId(schoolId) : undefined,
        languagePreference,
        learningGoals,
        dailyStudyTargetMinutes,
        selectedAvatarId,
        selectedInventoryItems: {
          helmet: 'free_helmet',
          weapon: 'free_pencil',
          outfit: 'free_explorer',
          frame: 'free_wood',
          background: 'free_plains',
        },
      });
      await createdProfile.save({ session });

      const progress = new PlayerProgress({
        studentId: createdProfile._id,
        unlockedMissions: [],
        completedMissions: [],
        unlockedSubjects: [],
      });
      await progress.save({ session });

    } else if (user.role === 'Parent') {
      const { firstName, lastName, phone, studentLinkingCode } = body;

      const existing = await ParentProfile.findOne({ userId: user._id }).session(session);
      if (existing) {
        res.status(400).json({ success: false, message: 'Parent profile already onboarded', code: 'BAD_REQUEST' });
        return;
      }

      const linkedStudent = await StudentProfile.findOne({
        userId: await User.findOne({ username: studentLinkingCode }).then(u => u?._id)
      }).session(session);

      if (!linkedStudent) {
        res.status(400).json({ success: false, message: 'Student not found with this linking code/username', code: 'BAD_REQUEST' });
        return;
      }

      createdProfile = new ParentProfile({
        userId: user._id,
        firstName,
        lastName,
        phone,
        linkedStudents: [linkedStudent._id],
      });
      await createdProfile.save({ session });

    } else if (user.role === 'Teacher') {
      const { firstName, lastName, schoolCode, subjects, classesTaught, bio, verificationDocumentUrl } = body;

      const existing = await TeacherProfile.findOne({ userId: user._id }).session(session);
      if (existing) {
        res.status(400).json({ success: false, message: 'Teacher profile already onboarded', code: 'BAD_REQUEST' });
        return;
      }

      const schoolObj = await School.findOne({ code: schoolCode.toUpperCase() }).session(session);
      if (!schoolObj) {
        res.status(400).json({ success: false, message: 'School not found with this code', code: 'BAD_REQUEST' });
        return;
      }

      createdProfile = new TeacherProfile({
        userId: user._id,
        firstName,
        lastName,
        schoolId: schoolObj._id,
        subjects,
        classesTaught,
        bio,
        verificationDocumentUrl,
        isApproved: false,
      });
      await createdProfile.save({ session });

    } else if (user.role === 'School Administrator') {
      const { schoolName, board, address } = body;
      const schoolCode = crypto.randomBytes(3).toString('hex').toUpperCase();
      
      const newSchool = new School({
        name: schoolName,
        code: schoolCode,
        board,
        address,
        isActive: true,
      });
      await newSchool.save({ session });

      createdProfile = newSchool;
    }

    await session.commitTransaction();
    session.endSession();

    if (user.email) {
      const name = createdProfile?.firstName || user.username;
      EmailService.sendWelcomeEmail(user.email, name, user.role).catch(err => {
        logger.error(`❌ Welcome email failed for ${user.email}: ${err.message}`);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Onboarding completed successfully',
      data: createdProfile,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
