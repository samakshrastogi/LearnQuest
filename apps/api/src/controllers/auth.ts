import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/Misc.js';
import { StudentProfile, ParentProfile, TeacherProfile, School, ClassRoom } from '../models/Profiles.js';
import { PlayerProgress } from '../models/Activity.js';
import { UserRole } from '@learnquest/shared-types';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { logger } from '../config/logger.js';
import { EmailService } from '../services/email.js';

// JWT Generation Helpers
const generateAccessToken = (userId: string, username: string, role: UserRole): string => {
  return jwt.sign({ id: userId, username, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  });
};

const generateRefreshToken = (): string => {
  return crypto.randomBytes(40).toString('hex');
};

const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, email, password, role, schoolInvitationCode } = req.body;

    // Check if user already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      res.status(400).json({ success: false, message: 'Username is already taken', code: 'BAD_REQUEST' });
      return;
    }

    if (email) {
      const existingEmail = await User.findOne({ email });
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
      username,
      email: email || undefined,
      passwordHash,
      role,
      isVerified: role !== 'Teacher', // Mock Auto verify for development except teachers who need verification documents
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await refreshTokenDoc.save();

    // Set cookie
    res.cookie('refreshToken', rawRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
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

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { usernameOrEmail, password } = req.body;

    // Find User
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail.toLowerCase() }],
    });

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

    // Save refresh token
    const refreshTokenDoc = new RefreshToken({
      userId: user._id,
      tokenHash,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await refreshTokenDoc.save();

    // Set cookie
    res.cookie('refreshToken', rawRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
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
      onboarded = true; // Admins etc bypass standard onboarding forms
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

    // Rotate refresh token (Security best-practice)
    const newRawRefreshToken = generateRefreshToken();
    const newHash = hashToken(newRawRefreshToken);

    activeSession.tokenHash = newHash;
    activeSession.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await activeSession.save();

    const accessToken = generateAccessToken(user._id.toString() as string, user.username, user.role);

    res.cookie('refreshToken', newRawRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
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

      // Create profile
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

      // Create Player Progress tracker
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

      // De-obfuscate or link the student. Linking code is student's username (or we match _id directly for simplicity)
      const linkedStudent = await StudentProfile.findOne({
        // For development, we match username by finding User then StudentProfile
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
        isApproved: false, // Moderated verification required
      });
      await createdProfile.save({ session });

    } else if (user.role === 'School Administrator') {
      const { schoolName, board, address, administrativeContact, teacherInvitationCode } = body;

      // School Admin onboarding registers a new School
      const schoolCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // Random code like D84F3B
      
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

    // Send onboarding welcome email asynchronously
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
