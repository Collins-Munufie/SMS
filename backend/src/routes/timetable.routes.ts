import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

// GET /api/timetable
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { streamId, teacherId } = req.query;

    const where: any = {};
    if (streamId) where.streamId = String(streamId);
    if (teacherId) where.teacherId = String(teacherId);

    const slots = await prisma.timetableSlot.findMany({
      where,
      include: {
        stream: { include: { class: true } },
        subject: true,
        teacher: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
    });

    res.json({ slots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/timetable/slot (Create/Update Slot with Conflict Detection)
router.post('/slot', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const { streamId, subjectId, teacherId, dayOfWeek, period, startTime, endTime, room } = req.body;

    if (!streamId || !subjectId || !teacherId || !dayOfWeek || !period) {
      return res.status(400).json({ error: 'streamId, subjectId, teacherId, dayOfWeek, and period are required' });
    }

    // 1. Conflict Check: Teacher double booking across streams
    const teacherConflict = await prisma.timetableSlot.findFirst({
      where: {
        teacherId,
        dayOfWeek,
        period: Number(period),
        NOT: { streamId },
      },
      include: {
        stream: { include: { class: true } },
        teacher: { select: { fullName: true } },
      },
    });

    if (teacherConflict) {
      return res.status(409).json({
        error: `Teacher Conflict: ${teacherConflict.teacher.fullName} is already assigned to ${teacherConflict.stream.class.name} ${teacherConflict.stream.name} during Period ${period} on ${dayOfWeek}.`,
      });
    }

    // 2. Upsert Timetable Slot for Stream
    const slot = await prisma.timetableSlot.upsert({
      where: {
        streamId_dayOfWeek_period: {
          streamId,
          dayOfWeek,
          period: Number(period),
        },
      },
      update: {
        subjectId,
        teacherId,
        startTime: startTime || '08:00',
        endTime: endTime || '08:45',
        room: room || null,
      },
      create: {
        streamId,
        subjectId,
        teacherId,
        dayOfWeek,
        period: Number(period),
        startTime: startTime || '08:00',
        endTime: endTime || '08:45',
        room: room || null,
      },
      include: {
        stream: { include: { class: true } },
        subject: true,
        teacher: { select: { id: true, fullName: true } },
      },
    });

    res.status(201).json({ message: 'Timetable slot assigned successfully', slot });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/timetable/slot/:id
router.delete('/slot/:id', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN), async (req: Request, res: Response) => {
  try {
    await prisma.timetableSlot.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Slot deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
