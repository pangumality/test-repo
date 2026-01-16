import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { PERMISSIONS } from '../config/rbac.js';
import { getCalendarEvents, createCalendarEvent } from '../controllers/calendarController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getCalendarEvents);
router.post('/', requirePermission(PERMISSIONS.CALENDAR_MANAGE), createCalendarEvent);

export default router;
