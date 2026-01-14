import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { askTutor } from '../controllers/aiTutorController.js';

const router = express.Router();

// All AI routes require authentication
router.use(authenticate);

router.post('/ask', askTutor);

export default router;
