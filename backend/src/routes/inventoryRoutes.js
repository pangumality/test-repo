import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermissionOrDepartmentStaff } from '../middleware/rbacMiddleware.js';
import { PERMISSIONS } from '../config/rbac.js';
import {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  recordTransaction,
  getTransactions,
} from '../controllers/inventoryController.js';

const router = express.Router();

router.use(authenticate, requirePermissionOrDepartmentStaff(PERMISSIONS.INVENTORY_MANAGE, 'inventory'));

router.get('/', getInventoryItems);
router.post('/', createInventoryItem);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);

router.post('/transaction', recordTransaction);
router.get('/:itemId/transactions', getTransactions);

export default router;
