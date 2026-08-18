import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken, AuthRequest, authorizeRoles } from '../middleware/auth';
import { Role, Priority } from '../types';

const router = Router();

// GET /api/announcements
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const announcements = await prisma.announcement.findMany({
      include: {
        author: { select: { fullName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ announcements });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/announcements (Admin & Super Admin)
router.post('/', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, priority, targetRole } = req.body;
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority: (priority as Priority) || Priority.NORMAL,
        targetRole: targetRole ? (targetRole as Role) : null,
        authorId: req.user!.id,
      },
    });

    res.status(201).json({ announcement });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
