import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { PERMISSIONS } from '../config/rbac.js';
import { getBuses, createBus, updateBus } from '../controllers/transportController.js';

const router = express.Router();

router.use(authenticate, requirePermission(PERMISSIONS.TRANSPORT_MANAGE));

router.get('/buses', getBuses);
router.post('/buses', createBus);
router.put('/buses/:id', updateBus);

export default router;

