import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { ParentProfile, StudentProfile } from '../models/Profiles.js';
import { StudentMastery, MissionAttempt } from '../models/Activity.js';
import { User } from '../models/User.js';

export const getChildren = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const parent = await ParentProfile.findOne({ userId: user?._id })
      .populate('linkedStudents', 'firstName lastName xp selectedAvatarId classLevel board streakCount coins gems');

    if (!parent) {
      res.status(404).json({ success: false, message: 'Parent profile not found' });
      return;
    }

    res.status(200).json({ success: true, data: parent.linkedStudents });
  } catch (error) {
    next(error);
  }
};

export const getChildProgress = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const { childId } = req.params;

    const parent = await ParentProfile.findOne({ userId: user?._id });
    if (!parent) {
      res.status(404).json({ success: false, message: 'Parent profile not found' });
      return;
    }

    // Verify parent has access to this student
    if (!parent.linkedStudents.map((id) => id.toString()).includes(childId)) {
      res.status(403).json({ success: false, message: 'Unauthorized access to student data' });
      return;
    }

    const student = await StudentProfile.findById(childId);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    // 1. Gather Weak Topics
    const weakTopics = await StudentMastery.find({ studentId: childId, weakTopicFlag: true })
      .populate({
        path: 'topicId',
        select: 'name chapterId',
        populate: { path: 'chapterId', select: 'name' },
      });

    // 2. Gather Strong Topics (Mastery Score > 80)
    const strongTopics = await StudentMastery.find({
      studentId: childId,
      masteryScore: { $gte: 80 },
    })
      .populate({
        path: 'topicId',
        select: 'name chapterId',
        populate: { path: 'chapterId', select: 'name' },
      });

    // 3. Gather Mission Attempts
    const recentAttempts = await MissionAttempt.find({ studentId: childId })
      .populate('missionId', 'name type xpReward')
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate weekly stats: total study time, completion rate
    const totalDuration = recentAttempts.reduce((acc, curr) => acc + curr.timeSpentSeconds, 0);
    const successAttempts = recentAttempts.filter((a) => a.status === 'success').length;
    const accuracy = recentAttempts.length > 0 ? Math.round((successAttempts / recentAttempts.length) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        student,
        weakTopics,
        strongTopics,
        studyMetrics: {
          totalStudySeconds: totalDuration,
          accuracyPercent: accuracy,
          missionsCleared: successAttempts,
        },
        screenTimeLimitMinutes: parent.screenTimeLimits.get(childId) || 60, // Default 60 mins limit
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateScreenTimeLimits = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const { childId, limitMinutes } = req.body;

    const parent = await ParentProfile.findOne({ userId: user?._id });
    if (!parent) {
      res.status(404).json({ success: false, message: 'Parent profile not found' });
      return;
    }

    if (!parent.linkedStudents.map((id) => id.toString()).includes(childId)) {
      res.status(403).json({ success: false, message: 'Unauthorized student configuration' });
      return;
    }

    parent.screenTimeLimits.set(childId, limitMinutes);
    await parent.save();

    res.status(200).json({
      success: true,
      message: 'Screen time limits updated successfully',
      data: { childId, limitMinutes },
    });
  } catch (error) {
    next(error);
  }
};
