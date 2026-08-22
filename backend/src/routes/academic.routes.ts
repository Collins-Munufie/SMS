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
    if (!name || !code) {
      return res.status(400).json({ error: 'Class name and code are required' });
    }
    const newClass = await prisma.class.create({
      data: { name, code, level: level || 'PRIMARY' },
    });
    res.status(201).json({ message: 'Class created successfully', class: newClass });
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
      orderBy: [{ class: { name: 'asc' } }, { name: 'asc' }],
    });
    res.json({ streams });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/academic/streams (Add Stream Section to a Class)
router.post('/streams', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const { classId, name, formTeacherId } = req.body;
    if (!classId || !name) {
      return res.status(400).json({ error: 'Class ID and Stream name (e.g. "A", "Gold") are required' });
    }

    const stream = await prisma.stream.create({
      data: {
        classId,
        name,
        formTeacherId: formTeacherId || null,
      },
      include: {
        class: true,
        formTeacher: { select: { id: true, fullName: true, email: true } },
      },
    });

    res.status(201).json({ message: 'Stream section created successfully', stream });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/academic/streams/:id
router.delete('/streams/:id', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.stream.delete({ where: { id } });
    res.json({ message: 'Stream section deleted successfully' });
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
    if (!name || !code) {
      return res.status(400).json({ error: 'Subject name and code are required' });
    }

    const subject = await prisma.subject.create({
      data: { name, code, category: category || 'CORE', description },
    });
    res.status(201).json({ message: 'Subject created successfully', subject });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/academic/subjects/:id
router.delete('/subjects/:id', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.subject.delete({ where: { id } });
    res.json({ message: 'Subject deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
