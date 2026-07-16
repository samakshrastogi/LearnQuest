import { Router } from 'express';
import authRouter from './auth.js';
import studentsRouter from './students.js';
import parentsRouter from './parents.js';
import teachersRouter from './teachers.js';
import curriculumRouter from './curriculum.js';
import gameRouter from './game.js';
import reelsRouter from './reels.js';
import socialRouter from './social.js';
import adminRouter from './admin.js';
import mediaRouter from './media.js';
import aiRouter from './ai.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/students', studentsRouter);
apiRouter.use('/parents', parentsRouter);
apiRouter.use('/teachers', teachersRouter);
apiRouter.use('/curriculum', curriculumRouter);
apiRouter.use('/game', gameRouter);
apiRouter.use('/reels', reelsRouter);
apiRouter.use('/social', socialRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/media', mediaRouter);
apiRouter.use('/ai', aiRouter);

export default apiRouter;
