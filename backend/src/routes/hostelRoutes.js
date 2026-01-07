import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
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
router.get('/', authenticate, requirePermission(PERMISSIONS.HOSTEL_MANAGE), getHostels);
router.post('/', authenticate, requirePermission(PERMISSIONS.HOSTEL_MANAGE), createHostel);
router.get('/:id', authenticate, requirePermission(PERMISSIONS.HOSTEL_MANAGE), getHostelById);
router.put('/:id', authenticate, requirePermission(PERMISSIONS.HOSTEL_MANAGE), updateHostel);
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.HOSTEL_MANAGE), deleteHostel);

// Rooms (Nested under hostels or flat? Using flat for update/delete, nested for create)
router.post('/:hostelId/rooms', authenticate, requirePermission(PERMISSIONS.HOSTEL_MANAGE), createRoom);
// Flat routes for room update/delete
router.put('/rooms/:id', authenticate, requirePermission(PERMISSIONS.HOSTEL_MANAGE), updateRoom);
router.delete('/rooms/:id', authenticate, requirePermission(PERMISSIONS.HOSTEL_MANAGE), deleteRoom);

// Allocations
router.post('/allocations', authenticate, requirePermission(PERMISSIONS.HOSTEL_MANAGE), allocateStudent);
router.put('/allocations/:id/vacate', authenticate, requirePermission(PERMISSIONS.HOSTEL_MANAGE), deallocateStudent);

export default router;
