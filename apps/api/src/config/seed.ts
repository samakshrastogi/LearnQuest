import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, closeDB } from './db.js';
import { User } from '../models/User.js';
import { School, StudentProfile, ParentProfile, TeacherProfile, ClassRoom } from '../models/Profiles.js';
import { Subject, Chapter, Topic, Mission, GameLevel } from '../models/Curriculum.js';
import { Question, PlayerProgress } from '../models/Activity.js';
import { AvatarItem } from '../models/Inventory.js';
import { Reel } from '../models/Misc.js';
import { Clan, ClanMembership, Tournament } from '../models/Social.js';
import { logger } from './logger.js';

const seedDatabase = async () => {
  try {
    await connectDB();
    logger.info('🧹 Dropping existing database collections...');

    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    logger.info('✅ Collections cleared.');

    // 1. Password hash for all test accounts
    const devPasswordHash = await bcrypt.hash('LearnQuest2026!', 10);
    logger.info('🔑 Seeding user roles and accounts (default pass: LearnQuest2026!)...');

    // 2. Seed School
    const school = new School({
      name: 'Delhi Public School, RK Puram',
      code: 'DPSRKP',
      board: 'CBSE',
      address: 'Sector XII, RK Puram, New Delhi',
    });
    await school.save();

    // 3. Seed Platform Administrator
    const superAdmin = new User({
      username: 'admin',
      email: 'admin@learnquest.in',
      passwordHash: devPasswordHash,
      role: 'Super Administrator',
      isVerified: true,
    });
    await superAdmin.save();

    // 4. Seed School Administrator
    const schoolAdmin = new User({
      username: 'dpsadmin',
      email: 'admin@dpsrkp.edu.in',
      passwordHash: devPasswordHash,
      role: 'School Administrator',
      isVerified: true,
    });
    await schoolAdmin.save();

    // 5. Seed Teachers
    const teacherUser1 = new User({
      username: 'math_teacher',
      email: 'sharma.maths@dpsrkp.edu.in',
      passwordHash: devPasswordHash,
      role: 'Teacher',
      isVerified: true,
    });
    const teacherUser2 = new User({
      username: 'science_teacher',
      email: 'verma.science@dpsrkp.edu.in',
      passwordHash: devPasswordHash,
      role: 'Teacher',
      isVerified: true,
    });
    await teacherUser1.save();
    await teacherUser2.save();

    const teacherProfile1 = new TeacherProfile({
      userId: teacherUser1._id,
      firstName: 'Rakesh',
      lastName: 'Sharma',
      schoolId: school._id,
      subjects: ['Mathematics'],
      classesTaught: [5, 6, 7],
      isApproved: true,
    });
    const teacherProfile2 = new TeacherProfile({
      userId: teacherUser2._id,
      firstName: 'Anjali',
      lastName: 'Verma',
      schoolId: school._id,
      subjects: ['Science'],
      classesTaught: [5, 6, 7],
      isApproved: true,
    });
    await teacherProfile1.save();
    await teacherProfile2.save();

    // 6. Create Classroom
    const classroom = new ClassRoom({
      schoolId: school._id,
      name: 'Class 5-A',
      teacherId: teacherProfile1._id,
      academicYear: '2026-2027',
      students: [],
    });
    await classroom.save();

    // 7. Seed Students & Profiles
    logger.info('🎒 Seeding 10 student accounts and progress databases...');
    const studentsList = [];
    const studentUsernames = [
      'aarav', 'vihaan', 'aditya', 'sai', 'arjun',
      'diya', 'ananya', 'isha', 'rhea', 'aanya'
    ];
    const firstNames = ['Aarav', 'Vihaan', 'Aditya', 'Sai', 'Arjun', 'Diya', 'Ananya', 'Isha', 'Rhea', 'Aanya'];
    const lastNames = ['Patel', 'Sharma', 'Rao', 'Reddy', 'Singh', 'Joshi', 'Gupta', 'Mehta', 'Nair', 'Iyer'];

    for (let i = 0; i < 10; i++) {
      const studentUser = new User({
        username: studentUsernames[i],
        email: `${studentUsernames[i]}@gmail.com`,
        passwordHash: devPasswordHash,
        role: 'Student',
        isVerified: true,
      });
      await studentUser.save();

      const studentProfile = new StudentProfile({
        userId: studentUser._id,
        firstName: firstNames[i],
        lastName: lastNames[i],
        classLevel: 5,
        board: 'CBSE',
        schoolId: school._id,
        languagePreference: 'en',
        xp: 1500 - i * 100, // Staggered starting XP
        coins: 200,
        gems: 15,
        title: i < 3 ? 'Knowledge Warrior' : 'curious Scholar',
        selectedAvatarId: i % 2 === 0 ? 'boy' : 'girl',
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

      classroom.students.push(studentProfile._id);
      studentsList.push(studentProfile);
    }
    await classroom.save();

    // 8. Seed Parents
    logger.info('👨‍👩‍👧 Seeding parent accounts linking children...');
    const parentUser1 = new User({
      username: 'aarav_father',
      email: 'parent.aarav@gmail.com',
      passwordHash: devPasswordHash,
      role: 'Parent',
      isVerified: true,
    });
    const parentUser2 = new User({
      username: 'diya_mother',
      email: 'parent.diya@gmail.com',
      passwordHash: devPasswordHash,
      role: 'Parent',
      isVerified: true,
    });
    await parentUser1.save();
    await parentUser2.save();

    const parentProfile1 = new ParentProfile({
      userId: parentUser1._id,
      firstName: 'Vijay',
      lastName: 'Patel',
      phone: '+919876543210',
      linkedStudents: [studentsList[0]._id], // Aarav
    });
    const parentProfile2 = new ParentProfile({
      userId: parentUser2._id,
      firstName: 'Preeti',
      lastName: 'Joshi',
      phone: '+919876543211',
      linkedStudents: [studentsList[5]._id], // Diya
    });
    await parentProfile1.save();
    await parentProfile2.save();

    // 9. Seed Shop Avatar Customizations
    logger.info('🛍️ Seeding avatar item store...');
    const avatarItems = [
      { name: 'Wooden Helmet', category: 'helmet', assetUrl: 'wood_helmet', priceCoins: 50, priceGems: 0, requiredLevel: 1 },
      { name: 'Bronze Helmet', category: 'helmet', assetUrl: 'bronze_helmet', priceCoins: 150, priceGems: 2, requiredLevel: 3 },
      { name: 'Solar Crown', category: 'helmet', assetUrl: 'solar_crown', priceCoins: 500, priceGems: 10, requiredLevel: 7 },
      
      { name: 'Ruler Sword', category: 'weapon', assetUrl: 'ruler_sword', priceCoins: 100, priceGems: 0, requiredLevel: 1 },
      { name: 'Golden Pen Bow', category: 'weapon', assetUrl: 'pen_bow', priceCoins: 300, priceGems: 5, requiredLevel: 4 },
      
      { name: 'Academy Robes', category: 'outfit', assetUrl: 'academy_robes', priceCoins: 200, priceGems: 0, requiredLevel: 2 },
      { name: 'Space Explorer Suit', category: 'outfit', assetUrl: 'space_suit', priceCoins: 600, priceGems: 12, requiredLevel: 8 },
      
      { name: 'Steel Frame', category: 'frame', assetUrl: 'steel_frame', priceCoins: 50, priceGems: 0, requiredLevel: 1 },
      { name: 'Cosmic Nebula', category: 'background', assetUrl: 'space_bg', priceCoins: 400, priceGems: 8, requiredLevel: 6 },
    ];
    await AvatarItem.insertMany(avatarItems);

    // 10. Seed Math Curriculum (50 Levels)
    logger.info('🧮 Generating Math Kingdom Curriculum (50 Levels)...');
    const mathSub = new Subject({
      name: 'Mathematics',
      code: 'math',
      icon: 'calculator',
      storyPrompt: 'Welcome to Math Kingdom! Solve algebraic gates and geometric labyrinths to defeat Shadow Zero.',
    });
    await mathSub.save();

    const mathChapter = new Chapter({
      subjectId: mathSub._id,
      name: 'Arithmetic Operations',
      sequence: 1,
      bannerUrl: 'math_arithmetic_banner',
      description: 'Master basic arithmetic and fraction concepts.',
    });
    await mathChapter.save();

    const mathTopic = new Topic({
      chapterId: mathChapter._id,
      name: 'Numbers and Multiplication',
      sequence: 1,
      description: 'Review number patterns and rapid division.',
    });
    await mathTopic.save();

    // Create 5 questions to be reused across math gates checkpoints
    const mathQuestions = [];
    const questionsData = [
      { text: 'What is 15 x 6?', opt: ['75', '85', '90', '95'], ans: '2' },
      { text: 'Which number is a prime number?', opt: ['9', '15', '21', '23'], ans: '3' },
      { text: 'Find the value of x: 3x - 5 = 10.', opt: ['3', '4', '5', '6'], ans: '2' },
      { text: 'What is the sum of angles in a triangle?', opt: ['90°', '180°', '270°', '360°'], ans: '1' },
      { text: 'If a square has side 6cm, what is its area?', opt: ['12 cm²', '24 cm²', '36 cm²', '48 cm²'], ans: '2' },
    ];

    for (const qd of questionsData) {
      const q = new Question({
        topicId: mathTopic._id,
        type: 'mcq',
        difficulty: 'easy',
        questionText: qd.text,
        options: qd.opt,
        correctAnswer: qd.ans,
        explanation: 'Work it out step-by-step to arrive at the result.',
        hints: ['Try multiplying', 'Verify properties'],
      });
      await q.save();
      mathQuestions.push(q);
    }

    // Dynamic generation of 50 Math missions
    for (let levelIndex = 1; levelIndex <= 50; levelIndex++) {
      const isBoss = levelIndex === 50;
      const isPractice = levelIndex % 5 === 0 && !isBoss;
      const missionType = isBoss ? 'boss' : isPractice ? 'practice' : 'normal';

      const mission = new Mission({
        topicId: mathTopic._id,
        name: `Math Level ${levelIndex}: ${isBoss ? 'The Shadow Boss' : 'Curriculum Quest'}`,
        type: missionType,
        sequence: levelIndex,
        xpReward: isBoss ? 500 : isPractice ? 80 : 50,
        coinReward: isBoss ? 100 : isPractice ? 20 : 10,
        crystalReward: isBoss ? 5 : 0,
      });
      await mission.save();

      // Bind Phaser game level
      const level = new GameLevel({
        missionId: mission._id,
        sceneKey: isBoss ? 'BossBattleScene' : 'PlatformerScene',
        mapData: {
          gridWidth: 32,
          gridHeight: 16,
          theme: 'castle',
        },
        enemyConfig: [
          { type: 'goblin', x: 400, y: 300 },
          { type: 'slime', x: 800, y: 300 },
        ],
        checkpointQuestions: [mathQuestions[levelIndex % 5]._id],
      });
      await level.save();
    }

    // 11. Seed Science Curriculum (20 Levels)
    logger.info('🧬 Generating Science City Curriculum (20 Levels)...');
    const scienceSub = new Subject({
      name: 'Science',
      code: 'science',
      icon: 'beaker',
      storyPrompt: 'Science City is losing energy grids! Repair the batteries by resolving chemical questions.',
    });
    await scienceSub.save();

    const scienceChapter = new Chapter({
      subjectId: scienceSub._id,
      name: 'States of Matter',
      sequence: 1,
      bannerUrl: 'science_matter_banner',
      description: 'Understanding atoms and state transitions.',
    });
    await scienceChapter.save();

    const scienceTopic = new Topic({
      chapterId: scienceChapter._id,
      name: 'Solids, Liquids, Gases',
      sequence: 1,
      description: 'Differentiating state properties.',
    });
    await scienceTopic.save();

    // Create 3 questions for Science checkpoints
    const sciQuestions = [];
    const sciQuestionsData = [
      { text: 'Which state of matter has a definite volume but no definite shape?', opt: ['Solid', 'Liquid', 'Gas', 'Plasma'], ans: '1' },
      { text: 'What temperature does pure water freeze at?', opt: ['0°C', '32°C', '100°C', 'Both 0°C and 32°F'], ans: '3' },
      { text: 'What is the chemical formula for Water?', opt: ['CO2', 'O2', 'H2O', 'NaCl'], ans: '2' },
    ];

    for (const qd of sciQuestionsData) {
      const q = new Question({
        topicId: scienceTopic._id,
        type: 'mcq',
        difficulty: 'medium',
        questionText: qd.text,
        options: qd.opt,
        correctAnswer: qd.ans,
        explanation: 'Review the chemical bond properties.',
        hints: ['Two hydrogen atoms', 'Liquids conform to container'],
      });
      await q.save();
      sciQuestions.push(q);
    }

    // Dynamic generation of 20 Science missions
    for (let lvl = 1; lvl <= 20; lvl++) {
      const isBoss = lvl === 20;
      const isPractice = lvl % 4 === 0 && !isBoss;
      const missionType = isBoss ? 'boss' : isPractice ? 'practice' : 'normal';

      const mission = new Mission({
        topicId: scienceTopic._id,
        name: `Science Level ${lvl}: ${isBoss ? 'Defeat Lab-Zero' : 'Energy Grid Recovery'}`,
        type: missionType,
        sequence: lvl,
        xpReward: isBoss ? 400 : isPractice ? 70 : 60,
        coinReward: isBoss ? 80 : isPractice ? 15 : 12,
        crystalReward: isBoss ? 3 : 0,
      });
      await mission.save();

      const level = new GameLevel({
        missionId: mission._id,
        sceneKey: isBoss ? 'BossBattleScene' : 'PlatformerScene',
        mapData: {
          gridWidth: 32,
          gridHeight: 16,
          theme: 'laboratory',
        },
        enemyConfig: [
          { type: 'robot', x: 500, y: 300 },
        ],
        checkpointQuestions: [sciQuestions[lvl % 3]._id],
      });
      await level.save();
    }

    // 12. Seed Video Reels
    logger.info('📹 Seeding curriculum educational reels...');
    const reelsData = [
      {
        title: 'Rapid Multiplication Trick',
        description: 'Learn how to multiply any number by 11 in 2 seconds!',
        videoUrl: '/uploads/reel_math.mp4',
        thumbnailUrl: '/uploads/thumb_math.jpg',
        subjectId: mathSub._id,
        chapterId: mathChapter._id,
        classLevel: 5,
        quizQuestions: [mathQuestions[0]._id, mathQuestions[1]._id],
      },
      {
        title: 'States of Matter Song',
        description: 'Catchy song to memorize solids, liquids, and gases.',
        videoUrl: '/uploads/reel_science.mp4',
        thumbnailUrl: '/uploads/thumb_science.jpg',
        subjectId: scienceSub._id,
        chapterId: scienceChapter._id,
        classLevel: 5,
        quizQuestions: [sciQuestions[0]._id],
      },
    ];
    
    // Create dummy files for fallback local uploads directory so they load properly
    const localUploadsDir = path.resolve(process.cwd(), 'uploads');
    fs.mkdirSync(localUploadsDir, { recursive: true });
    fs.writeFileSync(path.join(localUploadsDir, 'reel_math.mp4'), 'Math video mock binary content');
    fs.writeFileSync(path.join(localUploadsDir, 'reel_science.mp4'), 'Science video mock binary content');
    fs.writeFileSync(path.join(localUploadsDir, 'thumb_math.jpg'), 'Math thumb mock binary content');
    fs.writeFileSync(path.join(localUploadsDir, 'thumb_science.jpg'), 'Science thumb mock binary content');

    await Reel.insertMany(reelsData.map(r => ({ ...r, isVerified: true })));

    // 13. Seed Clan
    logger.info('🛡️ Seeding student clans...');
    const clan = new Clan({
      name: 'Bengal Tigers',
      code: 'TIGERS',
      creatorId: studentsList[0]._id, // Aarav
      membersCount: 2,
      weeklyXPEarned: 200,
      activityFeed: [{ message: 'Aarav created Bengal Tigers!', createdAt: new Date() }],
    });
    await clan.save();

    await new ClanMembership({ studentId: studentsList[0]._id, clanId: clan._id, role: 'leader' }).save();
    await new ClanMembership({ studentId: studentsList[1]._id, clanId: clan._id, role: 'member' }).save();

    studentsList[0].clanId = clan._id;
    studentsList[1].clanId = clan._id;
    await studentsList[0].save();
    await studentsList[1].save();

    // 14. Seed Tournaments
    logger.info('🏆 Seeding school tournaments...');
    const tournament = new Tournament({
      name: 'National Knowledge Olympiad 2026',
      description: 'Compete against other schools in Mathematics and Science kingdoms!',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      classes: [5, 6],
      subjects: [mathSub._id, scienceSub._id],
      status: 'active',
    });
    await tournament.save();

    logger.info('✨ Seeding complete! Database successfully populated.');
    await closeDB();
  } catch (error) {
    logger.error(`❌ Seeding failed: ${(error as Error).message}`);
    process.exit(1);
  }
};

// Run Seeder if invoked directly
import path from 'path';
import fs from 'fs';
seedDatabase();
export { seedDatabase };
