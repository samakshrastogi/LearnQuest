import { Router } from 'express';
import { getDashboard, getInventory, equipItem, purchaseAvatarItem, getShopItems } from '../controllers/student.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { avatarPurchaseSchema } from '@learnquest/validation';

const router = Router();

router.use(authenticate);
router.use(authorize('Student', 'Super Administrator'));

router.get('/dashboard', getDashboard);
router.get('/inventory', getInventory);
router.post('/equip', equipItem);
router.post('/purchase', validateRequest(avatarPurchaseSchema), purchaseAvatarItem);
router.get('/shop', getShopItems);

export default router;
