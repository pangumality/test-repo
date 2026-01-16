import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { PERMISSIONS } from '../config/rbac.js';
import {
  getGroupStudies,
  createGroupStudy,
  updateGroupStudy,
  deleteGroupStudy,
} from '../controllers/groupStudyController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getGroupStudies);
router.post('/', requirePermission(PERMISSIONS.GROUP_STUDY_MANAGE), createGroupStudy);
router.put('/:id', requirePermission(PERMISSIONS.GROUP_STUDY_MANAGE), updateGroupStudy);
router.delete('/:id', requirePermission(PERMISSIONS.GROUP_STUDY_MANAGE), deleteGroupStudy);

export default router;
