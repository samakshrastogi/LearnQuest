import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { Clan, ClanMembership } from '../models/Social.js';
import { StudentProfile } from '../models/Profiles.js';
import { Tournament, TournamentParticipant } from '../models/Social.js';
import { redisClient, isRedisMocked } from '../config/redis.js';
import { logger } from '../config/logger.js';

export const createClan = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = req.user;
    const { name, logoUrl } = req.body;

    const student = await StudentProfile.findOne({ userId: user?._id }).session(session);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    // Verify student is not already in a clan
    const currentMember = await ClanMembership.findOne({ studentId: student._id }).session(session);
    if (currentMember) {
      res.status(400).json({ success: false, message: 'You are already in a clan!' });
      return;
    }

    const existingClan = await Clan.findOne({ name }).session(session);
    if (existingClan) {
      res.status(400).json({ success: false, message: 'Clan name is already taken' });
      return;
    }

    const code = crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g. T4B8C1

    const clan = new Clan({
      name,
      code,
      logoUrl,
      creatorId: student._id,
      membersCount: 1,
      activityFeed: [{ message: `${student.firstName} created the clan. Welcome!`, createdAt: new Date() }],
    });
    await clan.save({ session });

    const membership = new ClanMembership({
      studentId: student._id,
      clanId: clan._id,
      role: 'leader',
    });
    await membership.save({ session });

    // Link clan in student's profile
    student.clanId = clan._id;
    await student.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, message: 'Clan created successfully', data: clan });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const joinClan = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = req.user;
    const { code } = req.body;

    const student = await StudentProfile.findOne({ userId: user?._id }).session(session);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    // Verify student is not already in a clan
    const currentMember = await ClanMembership.findOne({ studentId: student._id }).session(session);
    if (currentMember) {
      res.status(400).json({ success: false, message: 'You are already in a clan!' });
      return;
    }

    const clan = await Clan.findOne({ code: code.toUpperCase() }).session(session);
    if (!clan) {
      res.status(404).json({ success: false, message: 'Clan not found with this code' });
      return;
    }

    const membership = new ClanMembership({
      studentId: student._id,
      clanId: clan._id,
      role: 'member',
    });
    await membership.save({ session });

    clan.membersCount += 1;
    clan.activityFeed.push({ message: `${student.firstName} joined the clan.`, createdAt: new Date() });
    await clan.save({ session });

    student.clanId = clan._id;
    await student.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: 'Joined clan successfully', data: clan });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const getClanDetails = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const student = await StudentProfile.findOne({ userId: user?._id });
    if (!student || !student.clanId) {
      res.status(200).json({ success: true, data: null });
      return;
    }

    const clan = await Clan.findById(student.clanId);
    if (!clan) {
      res.status(404).json({ success: false, message: 'Clan not found' });
      return;
    }

    // Fetch members detail
    const memberships = await ClanMembership.find({ clanId: clan._id }).populate({
      path: 'studentId',
      select: 'firstName lastName xp level selectedAvatarId title',
    });

    res.status(200).json({
      success: true,
      data: {
        clan,
        members: memberships,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Live Leaderboards. Uses Redis sorted sets for high speed updates, falling back to MongoDB aggregates.
 */
export const getLeaderboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { scope, tournamentId } = req.query; // 'global' | 'school' | 'clan' | 'tournament'
    
    // Default Global Leaderboard: top 15 students by XP
    if (scope === 'tournament' && tournamentId) {
      const participants = await TournamentParticipant.find({ tournamentId: new mongoose.Types.ObjectId(tournamentId.toString()) })
        .populate('studentId', 'firstName lastName selectedAvatarId title')
        .populate('schoolId', 'name logoUrl')
        .sort({ score: -1 })
        .limit(20);

      const results = participants.map((p, idx) => {
        const student = p.studentId as any;
        return {
          rank: idx + 1,
          score: p.score,
          studentName: student ? `${student.firstName} ${student.lastName.charAt(0)}.` : 'Anonymous Student',
          avatar: student?.selectedAvatarId || 'boy',
          title: student?.title || 'Knowledge Questor',
          schoolName: (p.schoolId as any)?.name || 'LearnQuest School',
        };
      });

      res.status(200).json({ success: true, data: results });
      return;
    }

    // Try reading Redis for Global leaderboard cache first
    const redisKey = 'leaderboard:global';
    if (!isRedisMocked) {
      try {
        const cached = await redisClient.get(redisKey);
        if (cached) {
          res.status(200).json({ success: true, data: JSON.parse(cached) });
          return;
        }
      } catch (err) {
        logger.warn('Redis read failed on leaderboard, pulling from MongoDB.');
      }
    }

    // Fallback MongoDB Aggregation
    const topStudents = await StudentProfile.find({})
      .select('firstName lastName xp selectedAvatarId title')
      .populate('schoolId', 'name')
      .sort({ xp: -1 })
      .limit(15);

    const rankings = topStudents.map((stud, index) => {
      // Child safety: Mask student's last name on global leaderboard
      return {
        rank: index + 1,
        score: stud.xp,
        studentName: `${stud.firstName} ${stud.lastName.charAt(0)}.`,
        avatar: stud.selectedAvatarId,
        title: stud.title || 'Novice Learner',
        schoolName: (stud.schoolId as any)?.name || 'LearnQuest Academy',
      };
    });

    // Write back to Redis cache for 2 minutes
    if (!isRedisMocked) {
      try {
        await redisClient.set(redisKey, JSON.stringify(rankings), 'EX', 120);
      } catch (err) {
        logger.error('Redis write failed on leaderboard cache.');
      }
    }

    res.status(200).json({ success: true, data: rankings });
  } catch (error) {
    next(error);
  }
};
export const getTournaments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tournaments = await Tournament.find({ status: { $in: ['active', 'upcoming'] } })
      .populate('subjects', 'name code icon');
    res.status(200).json({ success: true, data: tournaments });
  } catch (error) {
    next(error);
  }
};
export const postAnnouncement = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const { title, body } = req.body;

    const student = await StudentProfile.findOne({ userId: user?._id });
    if (!student || !student.clanId) {
      res.status(400).json({ success: false, message: 'You must be in a clan to post announcements.' });
      return;
    }

    const membership = await ClanMembership.findOne({ studentId: student._id });
    if (!membership || !['leader', 'elder'].includes(membership.role)) {
      res.status(403).json({ success: false, message: 'Only leaders or elders can post announcements.' });
      return;
    }

    const clan = await Clan.findById(student.clanId);
    if (!clan) {
      res.status(404).json({ success: false, message: 'Clan not found' });
      return;
    }

    clan.announcements.push({ title, body, createdAt: new Date() });
    await clan.save();

    res.status(200).json({ success: true, message: 'Announcement posted', data: clan });
  } catch (error) {
    next(error);
  }
};
