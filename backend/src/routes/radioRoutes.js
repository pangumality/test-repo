import express from 'express';
import {
  createProgram,
  getSchedule,
  getCurrentProgram,
  getLivePrograms,
  deleteProgram,
  updateProgram,
} from '../controllers/radioController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { getDepartmentStaff } from '../config/departmentsStore.js';
import { ROLES } from '../config/rbac.js';

const router = express.Router();

const requireRadioManage = (req, res, next) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.SCHOOL_ADMIN) {
    return next();
  }

  const { schoolId, id } = user;
  if (!schoolId || !id) return res.status(403).json({ error: 'Access denied' });

  const ids = getDepartmentStaff('radio', schoolId);
  if (Array.isArray(ids) && ids.includes(id)) {
    return next();
  }

  return res.status(403).json({ error: 'Access denied' });
};

// Public/Student routes
router.get('/current', authenticate, getCurrentProgram);
router.get('/live', authenticate, getLivePrograms);
router.get('/schedule', authenticate, getSchedule);
router.get('/programs', authenticate, getSchedule);

// Admin/Staff routes
router.post('/programs', authenticate, requireRadioManage, upload.single('file'), createProgram);
router.put('/programs/:id', authenticate, requireRadioManage, upload.single('file'), updateProgram);
router.delete('/programs/:id', authenticate, requireRadioManage, deleteProgram);

export default router;
