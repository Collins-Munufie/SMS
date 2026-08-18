import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role, Gender, StudentStatus } from '@prisma/client';

const router = Router();

// GET /api/students
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { streamId, status, search } = req.query;

    const where: any = {};
    if (status) where.status = status as StudentStatus;
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
router.post('/', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, dob, gender, address, streamId, termId } = req.body;

    const count = await prisma.student.count();
    const currentYear = new Date().getFullYear();
    const generatedStudentId = `SMS-${currentYear}-${String(count + 1).padStart(3, '0')}`;

    const passwordHash = await bcrypt.hash(password || 'Password123!', 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email: email || `${generatedStudentId.toLowerCase()}@student.achimota.edu.gh`,
        passwordHash,
        role: Role.STUDENT,
        phone: req.body.phone || null,
      },
    });

    const student = await prisma.student.create({
      data: {
        studentId: generatedStudentId,
        userId: user.id,
        dob: new Date(dob),
        gender: gender as Gender,
        address: address || 'Accra, Ghana',
        status: StudentStatus.ACTIVE,
      },
    });

    if (streamId && termId) {
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          streamId,
          termId,
        },
      });
    }

    res.status(201).json({ message: 'Student registered successfully', student });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
