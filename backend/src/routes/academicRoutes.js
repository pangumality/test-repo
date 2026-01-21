import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import {
  getNotes, createNote, updateNote, deleteNote,
  getAssignments, createAssignment, updateAssignment, deleteAssignment,
  getExams, createExam, updateExam, deleteExam,
  getSyllabus, createSyllabus, updateSyllabus, deleteSyllabus,
  uploadAttachment
} from '../controllers/academicController.js';
import { upload } from '../middleware/uploadMiddleware.js'; // Assuming this exists for generic files

const router = express.Router();

router.use(authenticate);

// --- Class Notes (Notes) ---
router.get('/notes', getNotes);
router.post('/notes', createNote);
router.put('/notes/:id', updateNote);
router.delete('/notes/:id', deleteNote);

// --- Assignments (Homework & ClassWork) ---
// Type query param: 'homework' or 'classwork'
router.get('/assignments', getAssignments);
router.post('/assignments', createAssignment);
router.put('/assignments/:id', updateAssignment);
router.delete('/assignments/:id', deleteAssignment);

// --- Exams ---
router.get('/exams', getExams);
router.post('/exams', createExam);
router.put('/exams/:id', updateExam);
router.delete('/exams/:id', deleteExam);

// --- Past Papers / Syllabus ---
router.get('/syllabus', getSyllabus);
router.post('/syllabus', createSyllabus);
router.put('/syllabus/:id', updateSyllabus);
router.delete('/syllabus/:id', deleteSyllabus);

// --- Uploads ---
router.post('/upload', upload.single('image'), uploadAttachment);

export default router;
