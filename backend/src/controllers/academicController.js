import prisma from '../config/db.js';
import { randomUUID } from 'crypto';

// Helper to check access
const checkAccess = async (user, subjectId, classId) => {
  if (user.role === 'school_admin' || user.role === 'admin') return true;
  if (user.role === 'teacher') {
    // Check if teacher teaches this subject in this class
    const assignment = await prisma.classSubject.findFirst({
      where: {
        classId,
        subjectId,
        teacherId: user.teacher?.id
      }
    });
    // Also check if teacher created it (for updates/deletes) - handled in specific methods
    return !!assignment;
  }
  return false;
};

// --- Notes ---
export const getNotes = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { classId, subjectId } = req.query;
    
    const where = { schoolId };
    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;

    // Filter for students: Only show notes for their class
    if (req.user.role === 'student') {
        const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
        if (student && student.classId) {
            where.classId = student.classId;
        } else {
            return res.json([]); // Student not assigned to a class sees nothing
        }
    }

    const notes = await prisma.classNote.findMany({
      where,
      include: {
        subject: { select: { name: true } },
        klass: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
};

export const createNote = async (req, res) => {
  try {
    const { title, content, classId, subjectId, attachments } = req.body;
    const { schoolId } = req.user;

    // TODO: Add permission check for teacher

    const note = await prisma.classNote.create({
      data: {
        id: randomUUID(),
        schoolId,
        title,
        content,
        classId,
        subjectId,
        attachments: attachments || [] // Expecting array of { name, url }
      }
    });
    res.json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create note' });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    await prisma.classNote.update({ where: { id }, data });
    res.json({ message: 'Note updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update note' });
  }
};

export const deleteNote = async (req, res) => {
  try {
    await prisma.classNote.delete({ where: { id: req.params.id } });
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
};

// --- Assignments ---
export const getAssignments = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { type, classId, subjectId } = req.query; // type: 'homework' | 'classwork'
    
    const where = { schoolId };
    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;

    // Filter for students
    if (req.user.role === 'student') {
        const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
        if (student && student.classId) {
            where.classId = student.classId;
        } else {
            return res.json([]);
        }
    }

    let items = [];
    if (!type || type === 'homework') {
        const hw = await prisma.homework.findMany({ 
            where, 
            include: { subject: { select: { name: true } }, klass: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
        items = [...items, ...hw.map(h => ({ ...h, type: 'homework' }))];
    }
    if (!type || type === 'classwork') {
        const cw = await prisma.classWork.findMany({ 
            where,
            include: { subject: { select: { name: true } }, klass: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
        items = [...items, ...cw.map(c => ({ ...c, type: 'classwork' }))];
    }
    
    // Sort combined
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

export const createAssignment = async (req, res) => {
  try {
    const { type, title, description, classId, subjectId, dueDate, attachments } = req.body;
    const { schoolId, id: userId } = req.user;
    
    // Get teacher ID if user is teacher
    let teacherId = null;
    if (req.user.role === 'teacher') {
        const teacher = await prisma.teacher.findUnique({ where: { userId } });
        if (teacher) teacherId = teacher.id;
    }

    const data = {
        id: randomUUID(),
        schoolId,
        title,
        description,
        classId,
        subjectId,
        teacherId,
        attachments: attachments || []
    };

    if (type === 'homework') {
        await prisma.homework.create({
            data: { ...data, dueDate: new Date(dueDate) }
        });
    } else {
        await prisma.classWork.create({
            data: { ...data, date: new Date(dueDate || new Date()) }
        });
    }
    res.json({ message: 'Assignment created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
};

export const updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, ...data } = req.body;
        
        if (type === 'homework') {
            await prisma.homework.update({ where: { id }, data });
        } else {
            await prisma.classWork.update({ where: { id }, data });
        }
        res.json({ message: 'Assignment updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update' });
    }
};

export const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query;
        
        if (type === 'homework') {
            await prisma.homework.delete({ where: { id } });
        } else {
            await prisma.classWork.delete({ where: { id } });
        }
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete' });
    }
};

// --- Exams ---
export const getExams = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const exams = await prisma.exam.findMany({
            where: { schoolId },
            include: {
                papers: {
                    include: { subject: { select: { name: true } } }
                }
            }
        });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch exams' });
    }
};

export const createExam = async (req, res) => {
    try {
        const { name, term, year, papers } = req.body; // papers: [{ subjectId, date, duration }]
        const { schoolId } = req.user;
        
        const exam = await prisma.exam.create({
            data: {
                id: randomUUID(),
                schoolId,
                name,
                term,
                year: parseInt(year)
            }
        });
        
        // Create papers if provided
        if (papers && papers.length > 0) {
            for (const p of papers) {
                await prisma.examPaper.create({
                    data: {
                        id: randomUUID(),
                        examId: exam.id,
                        subjectId: p.subjectId,
                        duration: parseInt(p.duration) || 60,
                        totalMarks: parseInt(p.totalMarks) || 100
                    }
                });
            }
        }
        res.json(exam);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create exam' });
    }
};

export const updateExam = async (req, res) => {
    // Implementation for update
    res.json({ message: 'Not implemented yet' });
};

export const deleteExam = async (req, res) => {
    try {
        const { id } = req.params;
        // Delete papers first (cascade handled in logic or schema?)
        // Schema doesn't show cascade delete on relations usually in Prisma unless specified
        await prisma.examPaper.deleteMany({ where: { examId: id } });
        await prisma.examResult.deleteMany({ where: { examId: id } });
        await prisma.exam.delete({ where: { id } });
        res.json({ message: 'Exam deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete exam' });
    }
};

// --- Past Papers (Syllabus) ---
export const getSyllabus = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const { classId, subjectId, type } = req.query;
        const where = { schoolId };
        if (classId) where.classId = classId;
        if (subjectId) where.subjectId = subjectId;
        if (type) where.type = type;

        // Filter for students
        if (req.user.role === 'student') {
            const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
            if (student && student.classId) {
                where.classId = student.classId;
            } else {
                return res.json([]);
            }
        }

        const list = await prisma.syllabus.findMany({
            where,
            include: { subject: { select: { name: true } }, klass: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch syllabus' });
    }
};

export const createSyllabus = async (req, res) => {
    try {
        const { title, content, fileUrl, classId, subjectId, term, type } = req.body;
        const { schoolId } = req.user;
        
        const item = await prisma.syllabus.create({
            data: {
                id: randomUUID(),
                schoolId,
                title,
                content,
                fileUrl,
                classId,
                subjectId,
                term,
                type: type || 'SYLLABUS'
            }
        });
        res.json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create syllabus' });
    }
};

export const updateSyllabus = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.syllabus.update({ where: { id }, data: req.body });
        res.json({ message: 'Updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update' });
    }
};

export const deleteSyllabus = async (req, res) => {
    try {
        await prisma.syllabus.delete({ where: { id: req.params.id } });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete' });
    }
};

export const uploadAttachment = async (req, res) => {
    // Handled by upload middleware, just return url
    if (!req.file) return res.status(400).json({ error: 'No file' });
    res.json({ url: req.file.path }); // Or cloud URL
};
