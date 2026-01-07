import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getNotices, createNotice, deleteNotice } from '../controllers/noticeController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getNotices);
router.post('/', createNotice);
router.delete('/:id', deleteNotice);

export default router;
