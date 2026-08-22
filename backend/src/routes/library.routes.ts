import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

// GET /api/library/books
router.get('/books', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { search, category } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { author: { contains: String(search) } },
        { isbn: { contains: String(search) } },
      ];
    }
    if (category) {
      where.category = String(category);
    }

    let books = await prisma.book.findMany({
      where,
      orderBy: { title: 'asc' },
    });

    // Fallback seed default NaCCA approved books if empty
    if (books.length === 0 && !search) {
      const defaultBooks = [
        {
          title: 'Aki-Ola Basic Mathematics for JHS (Basic 7-9)',
          author: 'P. A. Asiedu',
          isbn: '978-9988-1-2345-1',
          category: 'Mathematics',
          totalCopies: 45,
          availableCopies: 38,
        },
        {
          title: 'Integrated Science for Basic Schools (NaCCA Approved)',
          author: 'Prof. K. E. Mensah',
          isbn: '978-9988-2-6789-0',
          category: 'Science',
          totalCopies: 30,
          availableCopies: 22,
        },
        {
          title: 'Ghana Basic Education Computing & ICT Textbook',
          author: 'E. K. Quartey',
          isbn: '978-9988-3-4512-9',
          category: 'Computing',
          totalCopies: 50,
          availableCopies: 44,
        },
        {
          title: 'Cockcrow: An Anthology for Junior High Schools',
          author: 'WAEC GES Literature Board',
          isbn: '978-9988-4-8899-2',
          category: 'Literature',
          totalCopies: 60,
          availableCopies: 55,
        },
      ];

      for (const b of defaultBooks) {
        await prisma.book.upsert({
          where: { isbn: b.isbn },
          update: {},
          create: b,
        });
      }

      books = await prisma.book.findMany({ orderBy: { title: 'asc' } });
    }

    res.json({ books });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/library/books (Add book to catalog)
router.post('/books', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.LIBRARIAN), async (req: Request, res: Response) => {
  try {
    const { title, author, isbn, category, totalCopies } = req.body;
    if (!title || !author || !isbn) {
      return res.status(400).json({ error: 'Title, author, and ISBN are required' });
    }

    const copies = parseInt(totalCopies) || 1;
    const book = await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        category: category || 'General',
        totalCopies: copies,
        availableCopies: copies,
      },
    });

    res.status(201).json({ message: 'Textbook added to catalog successfully', book });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/library/issue (Issue book to student)
router.post('/issue', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.LIBRARIAN, Role.TEACHER), async (req: Request, res: Response) => {
  try {
    const { bookId, studentId } = req.body;
    if (!bookId || !studentId) {
      return res.status(400).json({ error: 'bookId and studentId are required' });
    }

    // Find student by ID or Student ID
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id: studentId }, { studentId }],
      },
    });

    if (!student) {
      return res.status(404).json({ error: `Student with ID "${studentId}" not found` });
    }

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.availableCopies <= 0) {
      return res.status(400).json({ error: 'No copies available for checkout' });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14-day borrowing window

    const [record] = await prisma.$transaction([
      prisma.borrowRecord.create({
        data: {
          bookId,
          studentId: student.id,
          dueDate,
          status: 'BORROWED',
        },
      }),
      prisma.book.update({
        where: { id: bookId },
        data: { availableCopies: { decrement: 1 } },
      }),
    ]);

    res.status(201).json({ message: `Book issued successfully to ${student.studentId}. Due in 14 days.`, record });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/library/return (Return borrowed book)
router.post('/return', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.LIBRARIAN), async (req: Request, res: Response) => {
  try {
    const { recordId } = req.body;
    if (!recordId) {
      return res.status(400).json({ error: 'recordId is required' });
    }

    const record = await prisma.borrowRecord.findUnique({ where: { id: recordId } });
    if (!record) {
      return res.status(404).json({ error: 'Borrow record not found' });
    }

    await prisma.$transaction([
      prisma.borrowRecord.update({
        where: { id: recordId },
        data: {
          status: 'RETURNED',
          returnDate: new Date(),
        },
      }),
      prisma.book.update({
        where: { id: record.bookId },
        data: { availableCopies: { increment: 1 } },
      }),
    ]);

    res.json({ message: 'Book returned to catalog successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
