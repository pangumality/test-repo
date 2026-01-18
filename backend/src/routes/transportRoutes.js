import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermissionOrDepartmentStaff } from '../middleware/rbacMiddleware.js';
import { PERMISSIONS } from '../config/rbac.js';
import { getBuses, createBus, updateBus } from '../controllers/transportController.js';

const router = express.Router();

router.use(authenticate, requirePermissionOrDepartmentStaff(PERMISSIONS.TRANSPORT_MANAGE, 'transport'));

router.get('/buses', getBuses);
router.post('/buses', createBus);
router.put('/buses/:id', updateBus);

export default router;

