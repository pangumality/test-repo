import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermissionOrDepartmentStaff } from '../middleware/rbacMiddleware.js';
import { PERMISSIONS } from '../config/rbac.js';
import {
  getHostels,
  getHostelById,
  createHostel,
  updateHostel,
  deleteHostel,
  createRoom,
  updateRoom,
  deleteRoom,
  allocateStudent,
  deallocateStudent
} from '../controllers/hostelController.js';

const router = express.Router();

// Hostels
router.get('/', authenticate, requirePermissionOrDepartmentStaff(PERMISSIONS.HOSTEL_MANAGE, 'hostel'), getHostels);
router.post('/', authenticate, requirePermissionOrDepartmentStaff(PERMISSIONS.HOSTEL_MANAGE, 'hostel'), createHostel);
router.get('/:id', authenticate, requirePermissionOrDepartmentStaff(PERMISSIONS.HOSTEL_MANAGE, 'hostel'), getHostelById);
router.put('/:id', authenticate, requirePermissionOrDepartmentStaff(PERMISSIONS.HOSTEL_MANAGE, 'hostel'), updateHostel);
router.delete('/:id', authenticate, requirePermissionOrDepartmentStaff(PERMISSIONS.HOSTEL_MANAGE, 'hostel'), deleteHostel);

// Rooms (Nested under hostels or flat? Using flat for update/delete, nested for create)
router.post('/:hostelId/rooms', authenticate, requirePermissionOrDepartmentStaff(PERMISSIONS.HOSTEL_MANAGE, 'hostel'), createRoom);
// Flat routes for room update/delete
router.put('/rooms/:id', authenticate, requirePermissionOrDepartmentStaff(PERMISSIONS.HOSTEL_MANAGE, 'hostel'), updateRoom);
router.delete('/rooms/:id', authenticate, requirePermissionOrDepartmentStaff(PERMISSIONS.HOSTEL_MANAGE, 'hostel'), deleteRoom);

// Allocations
router.post('/allocations', authenticate, requirePermissionOrDepartmentStaff(PERMISSIONS.HOSTEL_MANAGE, 'hostel'), allocateStudent);
router.put('/allocations/:id/vacate', authenticate, requirePermissionOrDepartmentStaff(PERMISSIONS.HOSTEL_MANAGE, 'hostel'), deallocateStudent);

export default router;
