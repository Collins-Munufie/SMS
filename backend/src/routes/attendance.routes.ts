import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken, AuthRequest, authorizeRoles } from '../middleware/auth';
import { Role, AttendanceStatus } from '@prisma/client';

const router = Router();

// GET /api/attendance
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { streamId, date } = req.query;
    if (!streamId || !date) {
      return res.status(400).json({ error: 'streamId and date are required parameters' });
    }

    const queryDate = new Date(String(date));
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    const records = await prisma.attendance.findMany({
      where: {
        streamId: String(streamId),
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    res.json({ records });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/bulk (Teachers & Admins)
router.post('/bulk', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.FORM_TEACHER), async (req: AuthRequest, res: Response) => {
  try {
    const { streamId, date, records } = req.body; // records: [{ studentId, status, remark }]
    if (!streamId || !date || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Invalid payload for bulk attendance' });
    }

    const attendanceDate = new Date(date);

    const operations = records.map((rec: { studentId: string; status: AttendanceStatus; remark?: string }) => {
      return prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: rec.studentId,
            date: attendanceDate,
          },
        },
        update: {
          status: rec.status,
          remark: rec.remark,
          markedById: req.user!.id,
        },
        create: {
          studentId: rec.studentId,
          streamId,
          date: attendanceDate,
          status: rec.status,
          markedById: req.user!.id,
          remark: rec.remark,
        },
      });
    });

    await prisma.$transaction(operations);

    res.json({ message: `Successfully updated attendance for ${records.length} students` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/analytics
router.get('/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { streamId } = req.query;
    const whereCondition = streamId ? { streamId: String(streamId) } : {};

    const presentCount = await prisma.attendance.count({ where: { ...whereCondition, status: AttendanceStatus.PRESENT } });
    const absentCount = await prisma.attendance.count({ where: { ...whereCondition, status: AttendanceStatus.ABSENT } });
    const lateCount = await prisma.attendance.count({ where: { ...whereCondition, status: AttendanceStatus.LATE } });
    const excusedCount = await prisma.attendance.count({ where: { ...whereCondition, status: AttendanceStatus.EXCUSED } });

    const total = presentCount + absentCount + lateCount + excusedCount;
    const attendancePercentage = total > 0 ? ((presentCount + lateCount) / total) * 100 : 100;

    res.json({
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      excused: excusedCount,
      total,
      attendancePercentage: Math.round(attendancePercentage * 10) / 10,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
