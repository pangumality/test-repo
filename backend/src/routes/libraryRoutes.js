import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermissionOrDepartmentStaff } from '../middleware/rbacMiddleware.js';
import { PERMISSIONS } from '../config/rbac.js';
import {
  getBooks,
  addBook,
  updateBook,
  deleteBook,
  issueBook,
  returnBook,
  getIssuedBooks,
} from '../controllers/libraryController.js';

const router = express.Router();

router.get('/', authenticate, requirePermissionOrDepartmentStaff(PERMISSIONS.LIBRARY_MANAGE, 'library'), getBooks);
router.post('/', authenticate, requirePermissionOrDepartmentStaff(PERMISSIONS.LIBRARY_MANAGE, 'library'), addBook);
router.put('/:id', authenticate, requirePermissionOrDepartmentStaff(PERMISSIONS.LIBRARY_MANAGE, 'library'), updateBook);
router.delete('/:id', authenticate, requirePermissionOrDepartmentStaff(PERMISSIONS.LIBRARY_MANAGE, 'library'), deleteBook);
router.post('/issue', authenticate, requirePermissionOrDepartmentStaff(PERMISSIONS.LIBRARY_MANAGE, 'library'), issueBook);
router.post('/return', authenticate, requirePermissionOrDepartmentStaff(PERMISSIONS.LIBRARY_MANAGE, 'library'), returnBook);
router.get('/issued', authenticate, requirePermissionOrDepartmentStaff(PERMISSIONS.LIBRARY_MANAGE, 'library'), getIssuedBooks);

export default router;
