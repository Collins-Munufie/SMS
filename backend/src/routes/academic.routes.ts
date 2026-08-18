import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

// GET /api/academic/school-profile
router.get('/school-profile', async (req: Request, res: Response) => {
  try {
    const profile = await prisma.schoolProfile.findFirst();
    res.json({ profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/academic/years
router.get('/years', authenticateToken, async (req: Request, res: Response) => {
  try {
    const years = await prisma.academicYear.findMany({
      include: { terms: true },
      orderBy: { startDate: 'desc' },
    });
    res.json({ years });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/academic/terms
router.get('/terms', authenticateToken, async (req: Request, res: Response) => {
  try {
    const terms = await prisma.term.findMany({
      include: { academicYear: true },
      orderBy: { startDate: 'desc' },
    });
    res.json({ terms });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/academic/classes
router.get('/classes', authenticateToken, async (req: Request, res: Response) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        streams: {
          include: {
            formTeacher: { select: { id: true, fullName: true, email: true } },
            _count: { select: { enrollments: true } },
          },
        },
        assessmentComponents: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json({ classes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/academic/classes (Super Admin & Admin)
router.post('/classes', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const { name, code, level } = req.body;
    const newClass = await prisma.class.create({
      data: { name, code, level },
    });
    res.status(201).json({ class: newClass });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/academic/streams
router.get('/streams', authenticateToken, async (req: Request, res: Response) => {
  try {
    const streams = await prisma.stream.findMany({
      include: {
        class: true,
        formTeacher: { select: { id: true, fullName: true, email: true } },
        subjectTeachers: {
          include: {
            subject: true,
            teacher: { select: { id: true, fullName: true, email: true } },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });
    res.json({ streams });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/academic/subjects
router.get('/subjects', authenticateToken, async (req: Request, res: Response) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ subjects });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/academic/subjects
router.post('/subjects', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const { name, code, category, description } = req.body;
    const subject = await prisma.subject.create({
      data: { name, code, category: category || 'CORE', description },
    });
    res.status(201).json({ subject });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
