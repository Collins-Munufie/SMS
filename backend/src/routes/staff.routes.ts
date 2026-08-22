import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// GET /api/staff (List staff members)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { role, search } = req.query;

    const staffRoles = ['TEACHER', 'FORM_TEACHER', 'ADMIN', 'BURSAR', 'LIBRARIAN', 'SUPER_ADMIN'];
    const whereCondition: any = {
      role: role ? String(role) : { in: staffRoles },
    };

    if (search) {
      whereCondition.OR = [
        { fullName: { contains: String(search) } },
        { email: { contains: String(search) } },
        { phone: { contains: String(search) } },
      ];
    }

    const staff = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        staffStreams: {
          include: {
            class: true,
          },
        },
        subjectTeachings: {
          include: {
            subject: true,
            stream: {
              include: { class: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ staff });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/staff (Register new staff member)
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, role, phone, avatarUrl } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Staff member with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password || 'Password123!', 10);

    const staffMember = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        role: role || 'TEACHER',
        phone: phone || null,
        avatarUrl: avatarUrl || null,
      },
    });

    res.status(201).json({
      message: 'Staff member registered successfully',
      staff: staffMember,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/staff/allocations (Allocate Subject & Stream to Teacher)
router.post('/allocations', authenticateToken, authorizeRoles('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { teacherId, streamId, subjectId } = req.body;

    if (!teacherId || !streamId || !subjectId) {
      return res.status(400).json({ error: 'teacherId, streamId, and subjectId are required' });
    }

    const allocation = await prisma.classSubjectTeacher.upsert({
      where: {
        streamId_subjectId: {
          streamId,
          subjectId,
        },
      },
      update: {
        teacherId,
      },
      create: {
        streamId,
        subjectId,
        teacherId,
      },
      include: {
        subject: true,
        stream: { include: { class: true } },
        teacher: { select: { id: true, fullName: true, email: true } },
      },
    });

    res.json({ message: 'Teacher allocated to subject and stream successfully', allocation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/staff/allocations/:id (Remove subject-teacher allocation)
router.delete('/allocations/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.classSubjectTeacher.delete({ where: { id } });
    res.json({ message: 'Subject allocation removed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/staff/:id (Delete staff member)
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Staff member account deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
