import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getNotices, createNotice, updateNotice, deleteNotice } from '../controllers/noticeController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getNotices);
router.post('/', createNotice);
router.put('/:id', updateNotice);
router.delete('/:id', deleteNotice);

export default router;
