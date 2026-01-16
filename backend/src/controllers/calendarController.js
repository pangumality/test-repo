import { randomUUID } from 'node:crypto';
import prisma from '../config/db.js';

export const getCalendarEvents = async (req, res) => {
  try {
    const { schoolId } = req.user;

    if (!schoolId) {
      return res.json([]);
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [sportEvents, groupStudies, dateSheets, activities, notices, calendarEvents] = await Promise.all([
      prisma.sportEvent.findMany({
        where: {
          schoolId,
          startDate: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { startDate: 'asc' },
      }),
      prisma.groupStudy.findMany({
        where: {
          schoolId,
          date: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.dateSheet.findMany({
        where: {
          schoolId,
          date: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.subjectActivity.findMany({
        where: {
          schoolId,
          date: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.notice.findMany({
        where: {
          schoolId,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.calendarEvent.findMany({
        where: {
          schoolId,
          date: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    const events = [
      ...sportEvents.map((e) => ({
        id: e.id,
        date: e.startDate,
        title: e.title,
        type: 'sport',
        description: e.description || null,
      })),
      ...groupStudies.map((e) => ({
        id: e.id,
        date: e.date,
        title: e.title,
        type: 'group_study',
        description: e.description || null,
      })),
      ...dateSheets.map((e) => ({
        id: e.id,
        date: e.date,
        title: e.title,
        type: 'exam',
        description: e.description || null,
      })),
      ...activities.map((e) => ({
        id: e.id,
        date: e.date,
        title: e.title,
        type: 'activity',
        description: e.description || null,
      })),
      ...notices.map((e) => ({
        id: e.id,
        date: e.createdAt,
        title: e.title,
        type: 'notice',
        description: e.content || null,
      })),
      ...calendarEvents.map((e) => ({
        id: e.id,
        date: e.date,
        title: e.title,
        type: 'calendar',
        description: e.description || null,
      })),
    ];

    res.json(events);
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
};

export const createCalendarEvent = async (req, res) => {
  try {
    const { schoolId, role } = req.user;
    const { title, description, date } = req.body;

    if (role !== 'school_admin') {
      return res.status(403).json({ error: 'Only school admins can create calendar events' });
    }

    if (!schoolId) {
      return res.status(400).json({ error: 'User is not linked to a school' });
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true },
    });

    if (!school) {
      return res.status(400).json({ error: 'School not found for this user' });
    }

    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'date is invalid' });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        id: randomUUID(),
        schoolId,
        title: title.trim(),
        description: description || null,
        date: parsedDate,
      },
    });

    res.status(201).json(event);
  } catch (error) {
    if (error && error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid school reference for calendar event' });
    }
    console.error('Failed to create calendar event:', error);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
};
