import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { PERMISSIONS } from '../config/rbac.js';
import {
    getFinanceOverview,
    addPayment,
    deletePayment
} from '../controllers/financeController.js';

const router = express.Router();

router.get('/students', authenticate, requirePermission(PERMISSIONS.FINANCE_MANAGE), getFinanceOverview);
router.post('/payments', authenticate, requirePermission(PERMISSIONS.FINANCE_MANAGE), addPayment);
router.delete('/payments/:id', authenticate, requirePermission(PERMISSIONS.FINANCE_MANAGE), deletePayment);

export default router;
