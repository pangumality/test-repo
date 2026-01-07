import prisma from '../config/db.js';
import { randomUUID } from 'node:crypto';
import { logAudit } from '../utils/auditLogger.js';

// --- Hostels ---

export const getHostels = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const hostels = await prisma.hostel.findMany({
      where: { schoolId },
      include: {
        _count: {
          select: { rooms: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(hostels);
  } catch (error) {
    console.error('Error fetching hostels:', error);
    res.status(500).json({ error: 'Failed to fetch hostels' });
  }
};

export const getHostelById = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.user;

    const hostel = await prisma.hostel.findFirst({
      where: { id, schoolId },
      include: {
        rooms: {
            include: {
                allocations: {
                    where: { status: 'ACTIVE' },
                    include: {
                        student: {
                            include: { user: true }
                        }
                    }
                }
            }
        }
      }
    });

    if (!hostel) {
      return res.status(404).json({ error: 'Hostel not found' });
    }

    res.json(hostel);
  } catch (error) {
    console.error('Error fetching hostel:', error);
    res.status(500).json({ error: 'Failed to fetch hostel' });
  }
};

export const createHostel = async (req, res) => {
  try {
    const { name, type, address, warden, capacity } = req.body;
    const { schoolId } = req.user;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const hostel = await prisma.hostel.create({
      data: {
        id: randomUUID(),
        schoolId,
        name,
        type, // BOYS, GIRLS, MIXED
        address,
        warden,
        capacity: parseInt(capacity) || 0
      }
    });

    await logAudit(req.user.id, 'CREATE', 'hostel', { id: hostel.id, name });
    res.status(201).json(hostel);
  } catch (error) {
    console.error('Error creating hostel:', error);
    res.status(500).json({ error: 'Failed to create hostel' });
  }
};

export const updateHostel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, address, warden, capacity } = req.body;
    const { schoolId } = req.user;

    const existing = await prisma.hostel.findFirst({ where: { id, schoolId } });
    if (!existing) return res.status(404).json({ error: 'Hostel not found' });

    const updated = await prisma.hostel.update({
      where: { id },
      data: {
        name,
        type,
        address,
        warden,
        capacity: capacity ? parseInt(capacity) : undefined
      }
    });

    await logAudit(req.user.id, 'UPDATE', 'hostel', { id, name });
    res.json(updated);
  } catch (error) {
    console.error('Error updating hostel:', error);
    res.status(500).json({ error: 'Failed to update hostel' });
  }
};

export const deleteHostel = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.user;

    const existing = await prisma.hostel.findFirst({ where: { id, schoolId } });
    if (!existing) return res.status(404).json({ error: 'Hostel not found' });

    await prisma.hostel.delete({ where: { id } });
    await logAudit(req.user.id, 'DELETE', 'hostel', { id });
    res.json({ message: 'Hostel deleted successfully' });
  } catch (error) {
    console.error('Error deleting hostel:', error);
    res.status(500).json({ error: 'Failed to delete hostel' });
  }
};

// --- Rooms ---

export const createRoom = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const { roomNumber, floor, capacity, type } = req.body;
    const { schoolId } = req.user;

    // Verify hostel belongs to school
    const hostel = await prisma.hostel.findFirst({ where: { id: hostelId, schoolId } });
    if (!hostel) return res.status(404).json({ error: 'Hostel not found' });

    const room = await prisma.hostelRoom.create({
      data: {
        id: randomUUID(),
        hostelId,
        roomNumber,
        floor: floor ? parseInt(floor) : null,
        capacity: parseInt(capacity) || 1,
        type
      }
    });

    await logAudit(req.user.id, 'CREATE', 'hostel_room', { id: room.id, roomNumber });
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
};

export const updateRoom = async (req, res) => {
    try {
        const { id } = req.params; // room id
        const { roomNumber, floor, capacity, type } = req.body;
        const { schoolId } = req.user;

        // Verify room and hostel access
        const room = await prisma.hostelRoom.findUnique({ 
            where: { id },
            include: { hostel: true }
        });

        if (!room || room.hostel.schoolId !== schoolId) {
            return res.status(404).json({ error: 'Room not found' });
        }

        const updated = await prisma.hostelRoom.update({
            where: { id },
            data: {
                roomNumber,
                floor: floor ? parseInt(floor) : undefined,
                capacity: capacity ? parseInt(capacity) : undefined,
                type
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ error: 'Failed to update room' });
    }
};

export const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { schoolId } = req.user;

        const room = await prisma.hostelRoom.findUnique({ 
            where: { id },
            include: { hostel: true }
        });

        if (!room || room.hostel.schoolId !== schoolId) {
            return res.status(404).json({ error: 'Room not found' });
        }

        await prisma.hostelRoom.delete({ where: { id } });
        res.json({ message: 'Room deleted' });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ error: 'Failed to delete room' });
    }
};

// --- Allocations ---

export const allocateStudent = async (req, res) => {
    try {
        const { roomId, studentId, startDate, endDate } = req.body;
        const { schoolId } = req.user;

        // 1. Verify Room and School
        const room = await prisma.hostelRoom.findUnique({
            where: { id: roomId },
            include: { 
                hostel: true,
                allocations: { where: { status: 'ACTIVE' } }
            }
        });
        if (!room || room.hostel.schoolId !== schoolId) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // 2. Check Capacity
        if (room.allocations.length >= room.capacity) {
            return res.status(400).json({ error: 'Room is full' });
        }

        // 3. Verify Student
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { user: true }
        });
        if (!student || student.schoolId !== schoolId) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // 4. Check if student already allocated
        const existingAllocation = await prisma.hostelAllocation.findFirst({
            where: { 
                studentId,
                status: 'ACTIVE'
            }
        });
        if (existingAllocation) {
            return res.status(400).json({ error: 'Student already has an active allocation' });
        }

        // 5. Create Allocation
        const allocation = await prisma.hostelAllocation.create({
            data: {
                id: randomUUID(),
                roomId,
                studentId,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                status: 'ACTIVE'
            }
        });

        await logAudit(req.user.id, 'CREATE', 'hostel_allocation', { id: allocation.id, studentId, roomId });
        res.status(201).json(allocation);

    } catch (error) {
        console.error('Error allocating student:', error);
        res.status(500).json({ error: 'Failed to allocate student' });
    }
};

export const deallocateStudent = async (req, res) => {
    try {
        const { id } = req.params; // allocation id
        const { schoolId } = req.user;

        const allocation = await prisma.hostelAllocation.findUnique({
            where: { id },
            include: { 
                room: { include: { hostel: true } }
            }
        });

        if (!allocation || allocation.room.hostel.schoolId !== schoolId) {
            return res.status(404).json({ error: 'Allocation not found' });
        }

        const updated = await prisma.hostelAllocation.update({
            where: { id },
            data: {
                status: 'VACATED',
                endDate: new Date() // Set end date to now
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error deallocating student:', error);
        res.status(500).json({ error: 'Failed to deallocate student' });
    }
};
