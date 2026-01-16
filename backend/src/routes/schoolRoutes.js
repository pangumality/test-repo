import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getSchools } from '../controllers/schoolController.js';

const router = express.Router();

// Allow authenticated users to list schools
router.use(authenticate);

router.get('/', getSchools);

export default router;
