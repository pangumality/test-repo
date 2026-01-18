import { randomUUID } from 'node:crypto';
import prisma from '../config/db.js';

export const getNotices = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const notices = await prisma.notice.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
};

export const createNotice = async (req, res) => {
  try {
    const { schoolId, role } = req.user;
    if (role !== 'school_admin') {
      return res.status(403).json({ error: 'Only school admins can manage notices' });
    }
    const { title, content, audience } = req.body;

    const notice = await prisma.notice.create({
      data: {
        id: randomUUID(),
        schoolId,
        title,
        content,
        audience: audience || 'ALL'
      }
    });
    res.status(201).json(notice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create notice' });
  }
};

export const updateNotice = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'school_admin') {
      return res.status(403).json({ error: 'Only school admins can manage notices' });
    }

    const { id } = req.params;
    const { title, content, audience } = req.body;

    const notice = await prisma.notice.update({
      where: { id },
      data: {
        title,
        content,
        audience: audience || 'ALL'
      }
    });

    res.json(notice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update notice' });
  }
};

export const deleteNotice = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'school_admin') {
      return res.status(403).json({ error: 'Only school admins can manage notices' });
    }
    const { id } = req.params;
    await prisma.notice.delete({ where: { id } });
    res.json({ message: 'Notice deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete notice' });
  }
};
