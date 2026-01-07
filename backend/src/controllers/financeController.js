import { randomUUID } from 'node:crypto';
import prisma from '../config/db.js';

const FEE_AMOUNT = 1200; // Configurable in future

// Helper to determine term from date
const getTermFromDate = (date) => {
    const d = new Date(date);
    const m = d.getMonth(); // 0-11
    if (m <= 3) return '1';
    if (m <= 7) return '2';
    return '3';
};

// 1. Get Finance Overview (Students + Payments)
export const getFinanceOverview = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const { classId, search } = req.query; // Filters

        const where = { schoolId };
        
        if (classId && classId !== 'all') {
            where.classId = classId;
        }
        
        if (search) {
            where.OR = [
                { user: { firstName: { contains: search, mode: 'insensitive' } } },
                { user: { lastName: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const students = await prisma.student.findMany({
            where,
            include: {
                user: {
                    select: { firstName: true, lastName: true }
                },
                klass: {
                    select: { id: true, name: true }
                },
                payments: {
                    orderBy: { paidAt: 'desc' }
                }
            },
            orderBy: { user: { firstName: 'asc' } }
        });

        // Format for frontend
        const formatted = students.map(s => ({
            id: s.id,
            name: `${s.user.firstName} ${s.user.lastName}`,
            section: s.section,
            klass: s.klass?.id, // ID for filtering
            klassName: s.klass?.name,
            payments: s.payments.map(p => ({
                id: p.id,
                amount: p.amount,
                method: p.method,
                date: p.paidAt.toISOString().split('T')[0],
                reference: p.reference
            }))
        }));

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch finance data' });
    }
};

// 2. Add Payment
export const addPayment = async (req, res) => {
    try {
        const { studentId, amount, method, date, reference } = req.body;
        
        // Validation?
        const student = await prisma.student.findUnique({ where: { id: studentId } });
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const methodMap = {
            'Cash': 'cash',
            'Mobile Money': 'mobile_money',
            'Bank Transfer': 'bank'
        };
        const dbMethod = methodMap[method] || 'cash';

        const payment = await prisma.payment.create({
            data: {
                id: randomUUID(),
                studentId,
                amount: parseFloat(amount),
                method: dbMethod,
                reference,
                paidAt: new Date(date)
            }
        });

        res.status(201).json(payment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to record payment' });
    }
};

// 3. Delete Payment
export const deletePayment = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.payment.delete({ where: { id } });
        res.json({ message: 'Payment deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete payment' });
    }
};

// 4. Get Stats (Optional, if we want server-side aggregation later)
export const getFinanceStats = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const { year, term } = req.query; // e.g. 2024, 1

        // Fetch all students count
        const studentCount = await prisma.student.count({ where: { schoolId } });
        
        // Fetch payments
        // This is tricky because term logic is date-based. 
        // For MVP, letting frontend do it is easier.
        // But if we do it here:
        
        const totalDue = studentCount * FEE_AMOUNT;
        
        // We'd need to filter payments by date range for the term
        // ... omitted for now, frontend handles it.

        res.json({ totalDue });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};
