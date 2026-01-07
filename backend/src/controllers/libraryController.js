import { randomUUID } from 'node:crypto';
import prisma from '../config/db.js';

// 1. Get Books
export const getBooks = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const { search } = req.query;
        
        const where = { schoolId };
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { author: { contains: search, mode: 'insensitive' } },
                { isbn: { contains: search, mode: 'insensitive' } }
            ];
        }

        const books = await prisma.book.findMany({
            where,
            orderBy: { title: 'asc' }
        });
        res.json(books);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
};

// 2. Add Book
export const addBook = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const { title, author, isbn, quantity, category } = req.body;

        const book = await prisma.book.create({
            data: {
                id: randomUUID(),
                schoolId,
                title,
                author,
                isbn,
                quantity: parseInt(quantity),
                available: parseInt(quantity), // Initially all available
                category
            }
        });
        res.status(201).json(book);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add book' });
    }
};

// 3. Update Book
export const updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, author, isbn, category, quantity } = req.body; // Not allowing direct available update for now

        // We need to handle quantity change logic carefully regarding availability
        // For MVP, simplistic update:
        const book = await prisma.book.findUnique({ where: { id } });
        if (!book) return res.status(404).json({ error: 'Book not found' });

        const quantityDiff = parseInt(quantity) - book.quantity;
        const newAvailable = book.available + quantityDiff;

        if (newAvailable < 0) {
            return res.status(400).json({ error: 'Cannot reduce quantity below currently issued count' });
        }

        const updated = await prisma.book.update({
            where: { id },
            data: {
                title,
                author,
                isbn,
                category,
                quantity: parseInt(quantity),
                available: newAvailable
            }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update book' });
    }
};

// 4. Delete Book
export const deleteBook = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.book.delete({ where: { id } });
        res.json({ message: 'Book deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete book' });
    }
};

// 5. Issue Book
export const issueBook = async (req, res) => {
    try {
        const { bookId, studentId, dueDate } = req.body;
        
        // Transaction to ensure consistency
        const result = await prisma.$transaction(async (prisma) => {
            const book = await prisma.book.findUnique({ where: { id: bookId } });
            if (!book) throw new Error('Book not found');
            if (book.available < 1) throw new Error('Book not available');

            // Decrement available
            await prisma.book.update({
                where: { id: bookId },
                data: { available: { decrement: 1 } }
            });

            // Create Issue Record
            return await prisma.bookIssue.create({
                data: {
                    id: randomUUID(),
                    bookId,
                    studentId,
                    dueDate: new Date(dueDate),
                    status: 'ISSUED'
                },
                include: { book: true, student: { include: { user: true } } }
            });
        });

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message || 'Failed to issue book' });
    }
};

// 6. Return Book
export const returnBook = async (req, res) => {
    try {
        const { issueId } = req.body;

        const result = await prisma.$transaction(async (prisma) => {
            const issue = await prisma.bookIssue.findUnique({ where: { id: issueId } });
            if (!issue) throw new Error('Issue record not found');
            if (issue.status === 'RETURNED') throw new Error('Book already returned');

            // Update Issue Record
            const updatedIssue = await prisma.bookIssue.update({
                where: { id: issueId },
                data: {
                    status: 'RETURNED',
                    returnedAt: new Date()
                },
                include: { book: true, student: { include: { user: true } } }
            });

            // Increment available
            await prisma.book.update({
                where: { id: issue.bookId },
                data: { available: { increment: 1 } }
            });

            return updatedIssue;
        });

        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message || 'Failed to return book' });
    }
};

// 7. Get Issued Books (Active)
export const getIssuedBooks = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const issues = await prisma.bookIssue.findMany({
            where: {
                book: { schoolId },
                status: 'ISSUED'
            },
            include: {
                book: true,
                student: { include: { user: true, klass: true } }
            },
            orderBy: { issuedAt: 'desc' }
        });
        res.json(issues);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch issued books' });
    }
};
