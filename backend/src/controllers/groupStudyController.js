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

        const study = await prisma.groupStudy.create({
            data: {
                id: randomUUID(),
                schoolId,
                creatorId: userId,
                title,
                description,
                date: new Date(date),
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
        
        const study = await prisma.groupStudy.update({
            where: { id },
            data: {
                title,
                description,
                date: new Date(date),
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
        await prisma.groupStudy.delete({ where: { id } });
        res.json({ message: 'Group study deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete group study' });
    }
};
