import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { TeacherProfile, ClassRoom, StudentProfile } from '../models/Profiles.js';
import { Assignment, AssignmentSubmission } from '../models/Assignments.js';
import { StudentMastery } from '../models/Activity.js';
import mongoose from 'mongoose';

export const getClasses = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const teacher = await TeacherProfile.findOne({ userId: user?._id });
    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher profile not found' });
      return;
    }

    const classes = await ClassRoom.find({ teacherId: teacher._id })
      .populate('students', 'firstName lastName xp selectedAvatarId');
      
    res.status(200).json({ success: true, data: classes });
  } catch (error) {
    next(error);
  }
};

export const createAssignment = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const { classRoomId, title, description, subjectId, dueDate, type, referenceId, maxScore } = req.body;

    const teacher = await TeacherProfile.findOne({ userId: user?._id });
    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher profile not found' });
      return;
    }

    // Verify classroom belongs to teacher
    const classroom = await ClassRoom.findOne({ _id: classRoomId, teacherId: teacher._id });
    if (!classroom) {
      res.status(403).json({ success: false, message: 'Classroom not found or unauthorized' });
      return;
    }

    const assignment = new Assignment({
      classRoomId,
      teacherId: teacher._id,
      title,
      description,
      subjectId,
      dueDate: new Date(dueDate),
      type,
      referenceId,
      maxScore: maxScore || 100,
    });
    await assignment.save();

    res.status(201).json({ success: true, message: 'Assignment created successfully', data: assignment });
  } catch (error) {
    next(error);
  }
};

export const getClassReport = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const { classroomId } = req.params;

    const teacher = await TeacherProfile.findOne({ userId: user?._id });
    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher profile not found' });
      return;
    }

    const classroom = await ClassRoom.findOne({ _id: classroomId, teacherId: teacher._id })
      .populate({
        path: 'students',
        select: 'firstName lastName xp selectedAvatarId coins gems',
      });

    if (!classroom) {
      res.status(404).json({ success: false, message: 'Classroom not found' });
      return;
    }

    // Gather report details per student
    const studentIds = classroom.students.map((s) => s._id);
    
    // Find average topic mastery scores and weak topic counts
    const masteries = await StudentMastery.find({ studentId: { $in: studentIds } });
    
    const studentMasteryMap = new Map();
    for (const m of masteries) {
      const current = studentMasteryMap.get(m.studentId.toString()) || {
        totalScore: 0,
        count: 0,
        weakCount: 0,
      };
      
      current.totalScore += m.masteryScore;
      current.count += 1;
      if (m.weakTopicFlag) {
        current.weakCount += 1;
      }
      studentMasteryMap.set(m.studentId.toString(), current);
    }

    const studentsReport = classroom.students.map((stud: any) => {
      const stats = studentMasteryMap.get(stud._id.toString()) || { totalScore: 0, count: 0, weakCount: 0 };
      const avgMastery = stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0;
      
      return {
        id: stud._id,
        firstName: stud.firstName,
        lastName: stud.lastName,
        xp: stud.xp,
        avatar: stud.selectedAvatarId,
        averageMastery: avgMastery,
        weakTopicsCount: stats.weakCount,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        classRoomName: classroom.name,
        students: studentsReport,
      },
    });
  } catch (error) {
    next(error);
  }
};
