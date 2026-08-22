import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// GET /api/students
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { streamId, classId, status, search } = req.query;

    const where: any = {};
    if (status) where.status = String(status);
    if (search) {
      where.OR = [
        { studentId: { contains: String(search) } },
        { user: { fullName: { contains: String(search) } } },
        { user: { email: { contains: String(search) } } },
      ];
    }
    if (streamId) {
      where.enrollments = {
        some: { streamId: String(streamId) },
      };
    } else if (classId) {
      where.enrollments = {
        some: { stream: { classId: String(classId) } },
      };
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
        enrollments: {
          include: {
            stream: { include: { class: true } },
            term: true,
          },
        },
        guardians: {
          include: {
            guardian: {
              include: {
                user: { select: { fullName: true, phone: true, email: true } },
              },
            },
          },
        },
      },
      orderBy: { studentId: 'asc' },
    });

    res.json({ students });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/:id
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        enrollments: {
          include: {
            stream: { include: { class: true, formTeacher: true } },
            term: { include: { academicYear: true } },
          },
        },
        guardians: {
          include: {
            guardian: {
              include: { user: true },
            },
          },
        },
        attendances: { take: 30, orderBy: { date: 'desc' } },
        grades: { include: { subject: true, component: true } },
        termResults: { include: { term: true } },
        invoices: { include: { payments: true, term: true } },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ student });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students (Admissions)
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, dob, gender, address, streamId, termId } = req.body;

    const count = await prisma.student.count();
    const currentYear = new Date().getFullYear();
    const generatedStudentId = `SMS-${currentYear}-${String(count + 1).padStart(3, '0')}`;

    const passwordHash = await bcrypt.hash(password || 'Password123!', 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email: email || `${generatedStudentId.toLowerCase()}@kqprep.edu.gh`,
        passwordHash,
        role: 'STUDENT',
        phone: req.body.phone || null,
      },
    });

    const student = await prisma.student.create({
      data: {
        studentId: generatedStudentId,
        userId: user.id,
        dob: dob ? new Date(dob) : new Date('2014-01-01'),
        gender: gender || 'MALE',
        address: address || 'East Legon Hills, Accra, Ghana',
        status: 'ACTIVE',
      },
    });

    // Auto-resolve termId if not provided
    const targetTermId =
      termId ||
      (await prisma.term.findFirst({ where: { isCurrent: true } }))?.id ||
      (await prisma.term.findFirst())?.id;

    if (streamId && targetTermId) {
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          streamId,
          termId: targetTermId,
        },
      });
    }

    res.status(201).json({ message: 'Student registered and enrolled successfully', student });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/students/:id (Super Admin & Admin Delete Pupil)
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return res.status(404).json({ error: 'Pupil record not found' });
    }

    // Delete associated User account (cascades to student and related records)
    await prisma.user.delete({ where: { id: student.userId } });

    res.json({ message: 'Pupil record and account deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students/bulk-import (Bulk Student CSV Admission)
router.post('/bulk-import', authenticateToken, authorizeRoles('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { studentsList, streamId, termId } = req.body;

    if (!Array.isArray(studentsList) || studentsList.length === 0) {
      return res.status(400).json({ error: 'studentsList must be a non-empty array' });
    }

    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
    const initialCount = await prisma.student.count();
    const currentYear = new Date().getFullYear();
    const targetTermId =
      termId ||
      (await prisma.term.findFirst({ where: { isCurrent: true } }))?.id ||
      (await prisma.term.findFirst())?.id;

    const createdStudents = [];

    for (let i = 0; i < studentsList.length; i++) {
      const item = studentsList[i];
      const generatedStudentId = `SMS-${currentYear}-${String(initialCount + i + 1).padStart(3, '0')}`;

      const user = await prisma.user.create({
        data: {
          fullName: item.fullName,
          email: item.email || `${generatedStudentId.toLowerCase()}@kqprep.edu.gh`,
          passwordHash: defaultPasswordHash,
          role: 'STUDENT',
        },
      });

      const student = await prisma.student.create({
        data: {
          studentId: generatedStudentId,
          userId: user.id,
          dob: item.dob ? new Date(item.dob) : new Date('2014-01-01'),
          gender: item.gender || 'MALE',
          address: item.address || 'East Legon Hills, Accra, Ghana',
          status: 'ACTIVE',
        },
      });

      if (streamId && targetTermId) {
        await prisma.enrollment.create({
          data: {
            studentId: student.id,
            streamId,
            termId: targetTermId,
          },
        });
      }

      createdStudents.push(student);
    }

    res.status(201).json({
      message: `Successfully imported and enrolled ${createdStudents.length} pupils via bulk admission.`,
      count: createdStudents.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
