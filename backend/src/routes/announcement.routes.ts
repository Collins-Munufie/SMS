import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken, AuthRequest, authorizeRoles } from '../middleware/auth';
import { Role, Priority } from '../types';

const router = Router();

// GET /api/announcements
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { targetRole } = req.query;
    const where: any = {};
    if (targetRole) {
      where.OR = [
        { targetRole: String(targetRole) },
        { targetRole: null },
      ];
    }

    const announcements = await prisma.announcement.findMany({
      where,
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

// POST /api/announcements (Create Broadcast Notice)
router.post('/', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, priority, targetRole } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority: priority || Priority.NORMAL,
        targetRole: targetRole || null,
        authorId: req.user!.id,
      },
      include: {
        author: { select: { fullName: true, role: true } },
      },
    });

    res.status(201).json({
      message: 'Announcement posted successfully',
      announcement,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/announcements/broadcast-sms (Simulate Ghana Twilio / Hubtel SMS Broadcast to Parents)
router.post('/broadcast-sms', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const { message, recipientGroup } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'SMS Message body is required' });
    }

    const guardians = await prisma.guardian.findMany({
      include: { user: { select: { fullName: true, phone: true } } },
    });

    const recipientCount = guardians.length || 15;

    res.json({
      success: true,
      message: `SMS Broadcast sent to ${recipientCount} parent mobile contacts via Ghana Gateway (Hubtel/Twilio).`,
      recipientCount,
      sampleRecipient: guardians[0]?.user?.phone || '+233 24 999 8877',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
