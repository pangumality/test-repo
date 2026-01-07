import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { 
    getGroupStudies, 
    createGroupStudy, 
    updateGroupStudy, 
    deleteGroupStudy 
} from '../controllers/groupStudyController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getGroupStudies);
router.post('/', createGroupStudy);
router.put('/:id', updateGroupStudy);
router.delete('/:id', deleteGroupStudy);

export default router;
