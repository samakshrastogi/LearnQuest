import { Router } from 'express';
import { getDashboard, getInventory, equipItem, purchaseAvatarItem, getShopItems, claimQuestReward, generateRoadmap } from '../controllers/student.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboard as any);
router.get('/inventory', getInventory as any);
router.post('/equip', equipItem as any);
router.post('/purchase', purchaseAvatarItem as any);
router.get('/shop', getShopItems as any);
router.post('/claim-quest', claimQuestReward as any);
router.post('/roadmap', generateRoadmap as any);

export default router;
