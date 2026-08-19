import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

// GET /api/reports/class-register
router.get('/class-register', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { streamId } = req.query;
    if (!streamId) {
      return res.status(400).json({ error: 'streamId is required' });
    }

    const stream = await prisma.stream.findUnique({
      where: { id: String(streamId) },
      include: {
        class: true,
        formTeacher: { select: { fullName: true } },
        enrollments: {
          include: {
            student: {
              include: {
                user: { select: { fullName: true, phone: true } },
                guardians: { include: { guardian: { include: { user: { select: { fullName: true, phone: true } } } } } },
              },
            },
          },
        },
      },
    });

    res.json({ stream });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/master-sheet
router.get('/master-sheet', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.FORM_TEACHER), async (req: Request, res: Response) => {
  try {
    const { streamId, termId } = req.query;
    if (!streamId || !termId) {
      return res.status(400).json({ error: 'streamId and termId are required' });
    }

    const results = await prisma.termResult.findMany({
      where: {
        streamId: String(streamId),
        termId: String(termId),
      },
      include: {
        student: {
          include: {
            user: { select: { fullName: true } },
          },
        },
        term: true,
      },
      orderBy: { positionInClass: 'asc' },
    });

    res.json({ results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
