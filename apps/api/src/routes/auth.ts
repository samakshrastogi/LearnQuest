import { Router } from 'express';
import { register, login, refresh, logout, onboardUser } from '../controllers/auth.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { registerSchema, loginSchema } from '@learnquest/validation';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/onboard', authenticate, onboardUser);

export default router;
