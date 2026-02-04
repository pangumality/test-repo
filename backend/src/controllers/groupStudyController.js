import { randomUUID } from 'node:crypto';
import prisma from '../config/db.js';

export const getGroupStudies = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const studies = await prisma.groupStudy.findMany({
            where: { schoolId },
            include: {
                creator: { select: { firstName: true, lastName: true } },
                subject: { select: { name: true } }
            },
            orderBy: { date: 'desc' }
        });
        res.json(studies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch group studies' });
    }
};

export const createGroupStudy = async (req, res) => {
    try {
        const { schoolId, id: userId } = req.user;
        const { title, description, date, subjectId } = req.body;

        const dt = new Date(date);
        if (Number.isNaN(dt.getTime())) {
            return res.status(400).json({ error: 'Invalid date' });
        }

        const study = await prisma.groupStudy.create({
            data: {
                id: randomUUID(),
                schoolId,
                creatorId: userId,
                title,
                description,
                date: dt,
                subjectId: subjectId || null
            }
        });
        res.status(201).json(study);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create group study' });
    }
};

export const updateGroupStudy = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, date, subjectId } = req.body;
        const { id: userId, schoolId, role } = req.user;

        const existing = await prisma.groupStudy.findUnique({ where: { id } });
        if (!existing || existing.schoolId !== schoolId) {
            return res.status(404).json({ error: 'Study not found' });
        }

        if ((role === 'teacher' || role === 'student') && existing.creatorId !== userId) {
            return res.status(403).json({ error: 'You can only edit your own group studies' });
        }

        const dt = new Date(date);
        if (Number.isNaN(dt.getTime())) {
            return res.status(400).json({ error: 'Invalid date' });
        }
        
        const study = await prisma.groupStudy.update({
            where: { id },
            data: {
                title,
                description,
                date: dt,
                subjectId: subjectId || null
            }
        });
        res.json(study);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update group study' });
    }
};

export const deleteGroupStudy = async (req, res) => {
    try {
        const { id } = req.params;
        const { id: userId, schoolId, role } = req.user;

        const existing = await prisma.groupStudy.findUnique({ where: { id } });
        if (!existing || existing.schoolId !== schoolId) {
            return res.status(404).json({ error: 'Study not found' });
        }

        if ((role === 'teacher' || role === 'student') && existing.creatorId !== userId) {
            return res.status(403).json({ error: 'You can only delete your own group studies' });
        }

        await prisma.groupStudy.delete({ where: { id } });
        res.json({ message: 'Group study deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete group study' });
    }
};
