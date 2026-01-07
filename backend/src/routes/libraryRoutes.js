import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { PERMISSIONS } from '../config/rbac.js';
import {
    getBooks,
    addBook,
    updateBook,
    deleteBook,
    issueBook,
    returnBook,
    getIssuedBooks
} from '../controllers/libraryController.js';

const router = express.Router();

router.get('/', authenticate, requirePermission(PERMISSIONS.LIBRARY_MANAGE), getBooks);
router.post('/', authenticate, requirePermission(PERMISSIONS.LIBRARY_MANAGE), addBook);
router.put('/:id', authenticate, requirePermission(PERMISSIONS.LIBRARY_MANAGE), updateBook);
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.LIBRARY_MANAGE), deleteBook);
router.post('/issue', authenticate, requirePermission(PERMISSIONS.LIBRARY_MANAGE), issueBook);
router.post('/return', authenticate, requirePermission(PERMISSIONS.LIBRARY_MANAGE), returnBook);
router.get('/issued', authenticate, requirePermission(PERMISSIONS.LIBRARY_MANAGE), getIssuedBooks);

export default router;
