import { randomUUID } from 'node:crypto';
import prisma from '../config/db.js';

export const getBuses = async (req, res) => {
  try {
    const { schoolId, role } = req.user;
    const { schoolId: querySchoolId } = req.query;

    let effectiveSchoolId = schoolId || querySchoolId || null;

    if (schoolId && role !== 'admin') {
      effectiveSchoolId = schoolId;
    }

    const where = {};
    if (effectiveSchoolId) {
      where.schoolId = effectiveSchoolId;
    }

    const buses = await prisma.transportBus.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(buses);
  } catch (error) {
    console.error('Error fetching buses:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch buses' });
  }
};

export const createBus = async (req, res) => {
  try {
    const { schoolId, role } = req.user;
    const {
      schoolId: bodySchoolId,
      driverName,
      driverPhone,
      numberPlate,
      pickupTime,
      arrivalTime,
    } = req.body;

    if (!driverName || !numberPlate) {
      return res.status(400).json({ error: 'driverName and numberPlate are required' });
    }

    let targetSchoolId = schoolId || bodySchoolId;
    if (schoolId && role !== 'admin') {
      targetSchoolId = schoolId;
    }

    if (!targetSchoolId) {
      return res.status(400).json({ error: 'schoolId is required' });
    }

    const bus = await prisma.transportBus.create({
      data: {
        id: randomUUID(),
        schoolId: targetSchoolId,
        driverName: driverName.trim(),
        driverPhone: driverPhone ? String(driverPhone).trim() : null,
        numberPlate: numberPlate.trim(),
        pickupTime: pickupTime || '',
        arrivalTime: arrivalTime || '',
      },
    });

    res.status(201).json(bus);
  } catch (error) {
    console.error('Error creating bus:', error);
    res.status(500).json({ error: error.message || 'Failed to create bus' });
  }
};

export const updateBus = async (req, res) => {
  try {
    const { schoolId, role } = req.user;
    const { id } = req.params;
    const {
      driverName,
      driverPhone,
      numberPlate,
      pickupTime,
      arrivalTime,
      hasStarted,
      hasArrived,
    } = req.body;

    const existing = await prisma.transportBus.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    if (schoolId && role !== 'admin' && existing.schoolId !== schoolId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const data = {};

    if (driverName !== undefined) data.driverName = driverName.trim();
    if (driverPhone !== undefined) data.driverPhone = driverPhone ? String(driverPhone).trim() : null;
    if (numberPlate !== undefined) data.numberPlate = numberPlate.trim();
    if (pickupTime !== undefined) data.pickupTime = pickupTime;
    if (arrivalTime !== undefined) data.arrivalTime = arrivalTime;
    if (hasStarted !== undefined) data.hasStarted = Boolean(hasStarted);
    if (hasArrived !== undefined) data.hasArrived = Boolean(hasArrived);

    const updated = await prisma.transportBus.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update bus' });
  }
};

