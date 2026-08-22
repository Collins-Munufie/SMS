import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

// Standard bell schedule periods definition (45 min periods, Ghana Basic Education Standard)
export const DEFAULT_PERIODS = [
  { period: 1, name: 'Period 1', startTime: '08:00', endTime: '08:45', type: 'ACADEMIC' },
  { period: 2, name: 'Period 2', startTime: '08:45', endTime: '09:30', type: 'ACADEMIC' },
  { period: 3, name: 'Period 3', startTime: '09:30', endTime: '10:15', type: 'ACADEMIC' },
  { period: 4, name: 'Period 4', startTime: '10:45', endTime: '11:30', type: 'ACADEMIC' },
  { period: 5, name: 'Period 5', startTime: '11:30', endTime: '12:15', type: 'ACADEMIC' },
  { period: 6, name: 'Period 6', startTime: '13:00', endTime: '13:45', type: 'ACADEMIC' },
  { period: 7, name: 'Period 7', startTime: '13:45', endTime: '14:30', type: 'ACADEMIC' },
  { period: 8, name: 'Period 8', startTime: '14:30', endTime: '15:15', type: 'ACADEMIC' },
];

export const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

// GET /api/timetable/periods - Standard Bell Schedule Config
router.get('/periods', authenticateToken, async (_req: Request, res: Response) => {
  res.json({
    periods: DEFAULT_PERIODS,
    days: DAYS_OF_WEEK,
    breaks: [
      { name: 'Morning Devotions & Assembly', startTime: '07:30', endTime: '08:00', placement: 'BEFORE_P1' },
      { name: 'Snack & Recess Break', startTime: '10:15', endTime: '10:45', placement: 'AFTER_P3' },
      { name: 'Midday Lunch & Recreation', startTime: '12:15', endTime: '13:00', placement: 'AFTER_P5' },
      { name: 'Closing & Extra-Curriculars', startTime: '15:15', endTime: '16:00', placement: 'AFTER_P8' },
    ],
  });
});

// GET /api/timetable (Fetch slots with rich filtering)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { streamId, teacherId, dayOfWeek, room, classId } = req.query;

    const where: any = {};
    if (streamId) where.streamId = String(streamId);
    if (teacherId) where.teacherId = String(teacherId);
    if (dayOfWeek) where.dayOfWeek = String(dayOfWeek);
    if (room) where.room = String(room);
    if (classId) {
      where.stream = { classId: String(classId) };
    }

    const slots = await prisma.timetableSlot.findMany({
      where,
      include: {
        stream: {
          include: {
            class: true,
            formTeacher: { select: { id: true, fullName: true, email: true } },
          },
        },
        subject: true,
        teacher: { select: { id: true, fullName: true, email: true, phone: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
    });

    res.json({ slots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/timetable/conflicts (Full Conflict Detection Engine)
router.get('/conflicts', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { streamId, teacherId } = req.query;

    const allSlots = await prisma.timetableSlot.findMany({
      include: {
        stream: { include: { class: true } },
        subject: true,
        teacher: { select: { id: true, fullName: true } },
      },
    });

    const teacherCollisions: any[] = [];
    const roomCollisions: any[] = [];
    const consecutiveOverloads: any[] = [];

    // 1. Group by day & period
    const slotMap = new Map<string, typeof allSlots>();
    for (const slot of allSlots) {
      const key = `${slot.dayOfWeek}_P${slot.period}`;
      if (!slotMap.has(key)) slotMap.set(key, []);
      slotMap.get(key)!.push(slot);
    }

    // 2. Scan each time-period bucket
    slotMap.forEach((slotsInPeriod, key) => {
      // Check Teacher Double-Booking
      const teacherMap = new Map<string, typeof allSlots>();
      for (const slot of slotsInPeriod) {
        if (!teacherMap.has(slot.teacherId)) teacherMap.set(slot.teacherId, []);
        teacherMap.get(slot.teacherId)!.push(slot);
      }

      teacherMap.forEach((matchedSlots, tId) => {
        if (matchedSlots.length > 1) {
          teacherCollisions.push({
            id: `tc_${key}_${tId}`,
            type: 'TEACHER_COLLISION',
            severity: 'CRITICAL',
            teacherId: tId,
            teacherName: matchedSlots[0].teacher.fullName,
            dayOfWeek: matchedSlots[0].dayOfWeek,
            period: matchedSlots[0].period,
            timeRange: `${matchedSlots[0].startTime} - ${matchedSlots[0].endTime}`,
            conflictingSlots: matchedSlots.map((s) => ({
              slotId: s.id,
              streamId: s.streamId,
              streamName: `${s.stream.class.name} ${s.stream.name}`,
              subjectName: s.subject.name,
              room: s.room || 'Classroom',
            })),
            description: `${matchedSlots[0].teacher.fullName} is double-booked across ${matchedSlots.map((s) => `${s.stream.class.name} ${s.stream.name}`).join(' and ')} on ${matchedSlots[0].dayOfWeek} Period ${matchedSlots[0].period}.`,
          });
        }
      });

      // Check Room Double-Booking (excluding empty or null rooms)
      const roomMap = new Map<string, typeof allSlots>();
      for (const slot of slotsInPeriod) {
        if (slot.room && slot.room.trim() !== '') {
          const roomNorm = slot.room.trim().toLowerCase();
          if (!roomMap.has(roomNorm)) roomMap.set(roomNorm, []);
          roomMap.get(roomNorm)!.push(slot);
        }
      }

      roomMap.forEach((matchedSlots, roomNorm) => {
        if (matchedSlots.length > 1) {
          roomCollisions.push({
            id: `rc_${key}_${roomNorm}`,
            type: 'ROOM_COLLISION',
            severity: 'WARNING',
            room: matchedSlots[0].room,
            dayOfWeek: matchedSlots[0].dayOfWeek,
            period: matchedSlots[0].period,
            timeRange: `${matchedSlots[0].startTime} - ${matchedSlots[0].endTime}`,
            conflictingSlots: matchedSlots.map((s) => ({
              slotId: s.id,
              streamId: s.streamId,
              streamName: `${s.stream.class.name} ${s.stream.name}`,
              subjectName: s.subject.name,
              teacherName: s.teacher.fullName,
            })),
            description: `Room '${matchedSlots[0].room}' is booked simultaneously by ${matchedSlots.map((s) => `${s.stream.class.name} ${s.stream.name} (${s.subject.name})`).join(' and ')} on ${matchedSlots[0].dayOfWeek} Period ${matchedSlots[0].period}.`,
          });
        }
      });
    });

    // 3. Scan for Teacher Fatigue / Consecutive Periods (>3 consecutive periods on the same day)
    const teachersList = await prisma.user.findMany({
      where: { role: { in: ['TEACHER', 'FORM_TEACHER', 'ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true, fullName: true },
    });

    for (const teacher of teachersList) {
      for (const day of DAYS_OF_WEEK) {
        const teacherDaySlots = allSlots
          .filter((s) => s.teacherId === teacher.id && s.dayOfWeek === day)
          .sort((a, b) => a.period - b.period);

        let streak = 0;
        let lastPeriod = -1;
        for (const slot of teacherDaySlots) {
          if (lastPeriod !== -1 && slot.period === lastPeriod + 1) {
            streak++;
          } else {
            streak = 1;
          }
          lastPeriod = slot.period;

          if (streak >= 4) {
            consecutiveOverloads.push({
              id: `co_${teacher.id}_${day}_P${slot.period}`,
              type: 'WORKLOAD_FATIGUE',
              severity: 'INFO',
              teacherId: teacher.id,
              teacherName: teacher.fullName,
              dayOfWeek: day,
              streakPeriods: streak,
              description: `${teacher.fullName} has ${streak} consecutive teaching periods on ${day} without a break.`,
            });
          }
        }
      }
    }

    let conflicts = [...teacherCollisions, ...roomCollisions, ...consecutiveOverloads];

    if (streamId) {
      conflicts = conflicts.filter((c) =>
        c.conflictingSlots?.some((cs: any) => cs.streamId === streamId)
      );
    }
    if (teacherId) {
      conflicts = conflicts.filter((c) => c.teacherId === teacherId);
    }

    res.json({
      totalConflicts: conflicts.length,
      criticalCount: teacherCollisions.length,
      warningCount: roomCollisions.length,
      infoCount: consecutiveOverloads.length,
      conflicts,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/timetable/teacher-workload (Workload Summary for all teachers)
router.get('/teacher-workload', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: { in: ['TEACHER', 'FORM_TEACHER', 'ADMIN', 'SUPER_ADMIN'] } },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    const allSlots = await prisma.timetableSlot.findMany({
      include: {
        stream: { include: { class: true } },
        subject: true,
      },
    });

    const MAX_PERIODS_WEEK = 40; // 5 days * 8 periods

    const workloads = teachers.map((teacher) => {
      const teacherSlots = allSlots.filter((s) => s.teacherId === teacher.id);
      const totalPeriods = teacherSlots.length;
      const freePeriods = MAX_PERIODS_WEEK - totalPeriods;

      const dailyCount: Record<string, number> = {
        MONDAY: 0,
        TUESDAY: 0,
        WEDNESDAY: 0,
        THURSDAY: 0,
        FRIDAY: 0,
      };

      teacherSlots.forEach((s) => {
        if (dailyCount[s.dayOfWeek] !== undefined) {
          dailyCount[s.dayOfWeek]++;
        }
      });

      // Distinct classes taught
      const streamSet = new Set(teacherSlots.map((s) => `${s.stream.class.name} ${s.stream.name}`));
      const subjectSet = new Set(teacherSlots.map((s) => s.subject.name));

      return {
        teacher,
        totalPeriods,
        freePeriods,
        utilizationPercentage: Math.round((totalPeriods / MAX_PERIODS_WEEK) * 100),
        dailyDistribution: dailyCount,
        classesTaught: Array.from(streamSet),
        subjectsTaught: Array.from(subjectSet),
        status: totalPeriods > 25 ? 'HEAVY' : totalPeriods < 10 ? 'LIGHT' : 'OPTIMAL',
      };
    });

    res.json({ workloads });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/timetable/rooms (List distinct rooms & usage)
router.get('/rooms', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const slots = await prisma.timetableSlot.findMany({
      where: { room: { not: null } },
      include: {
        stream: { include: { class: true } },
        subject: true,
        teacher: { select: { fullName: true } },
      },
    });

    const roomMap = new Map<string, any>();

    // Standard school rooms
    const defaultFacilityRooms = [
      'Science Lab 1',
      'Science Lab 2',
      'ICT Computer Lab',
      'Library Media Room',
      'Creative Arts Studio',
      'JHS Block Room 7A',
      'JHS Block Room 7B',
      'JHS Block Room 8A',
      'JHS Block Room 9A',
      'Primary Block B1',
      'Primary Block B4',
      'Primary Block B6',
      'KG Play Arena',
      'Sports & Football Pitch',
    ];

    defaultFacilityRooms.forEach((r) => {
      roomMap.set(r, {
        name: r,
        totalBookedPeriods: 0,
        slots: [],
      });
    });

    slots.forEach((slot) => {
      if (!slot.room) return;
      if (!roomMap.has(slot.room)) {
        roomMap.set(slot.room, {
          name: slot.room,
          totalBookedPeriods: 0,
          slots: [],
        });
      }
      const rObj = roomMap.get(slot.room)!;
      rObj.totalBookedPeriods++;
      rObj.slots.push({
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        period: slot.period,
        startTime: slot.startTime,
        endTime: slot.endTime,
        streamName: `${slot.stream.class.name} ${slot.stream.name}`,
        subjectName: slot.subject.name,
        teacherName: slot.teacher.fullName,
      });
    });

    const rooms = Array.from(roomMap.values());
    res.json({ rooms });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/timetable/slot (Create/Update Slot with Conflict Check & Override)
router.post(
  '/slot',
  authenticateToken,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.FORM_TEACHER),
  async (req: Request, res: Response) => {
    try {
      const {
        streamId,
        subjectId,
        teacherId,
        dayOfWeek,
        period,
        startTime,
        endTime,
        room,
        forceOverride,
      } = req.body;

      if (!streamId || !subjectId || !teacherId || !dayOfWeek || !period) {
        return res.status(400).json({
          error: 'streamId, subjectId, teacherId, dayOfWeek, and period are required.',
        });
      }

      const periodNum = Number(period);

      // 1. Conflict Check: Teacher double-booking in other classes
      if (!forceOverride) {
        const teacherConflict = await prisma.timetableSlot.findFirst({
          where: {
            teacherId,
            dayOfWeek,
            period: periodNum,
            NOT: { streamId },
          },
          include: {
            stream: { include: { class: true } },
            teacher: { select: { fullName: true } },
            subject: true,
          },
        });

        if (teacherConflict) {
          return res.status(409).json({
            error: `Teacher Conflict: ${teacherConflict.teacher.fullName} is already teaching ${teacherConflict.subject.name} in ${teacherConflict.stream.class.name} ${teacherConflict.stream.name} during Period ${periodNum} on ${dayOfWeek}.`,
            conflictType: 'TEACHER_COLLISION',
            conflictingSlot: teacherConflict,
          });
        }

        // Room conflict check (if room is provided)
        if (room && room.trim() !== '') {
          const roomConflict = await prisma.timetableSlot.findFirst({
            where: {
              room: room.trim(),
              dayOfWeek,
              period: periodNum,
              NOT: { streamId },
            },
            include: {
              stream: { include: { class: true } },
              subject: true,
              teacher: { select: { fullName: true } },
            },
          });

          if (roomConflict) {
            return res.status(409).json({
              error: `Room Conflict: ${room} is already booked by ${roomConflict.stream.class.name} ${roomConflict.stream.name} (${roomConflict.subject.name}) during Period ${periodNum} on ${dayOfWeek}.`,
              conflictType: 'ROOM_COLLISION',
              conflictingSlot: roomConflict,
            });
          }
        }
      }

      // 2. Derive start and end times from default period definition if not provided
      const defaultPeriodDef = DEFAULT_PERIODS.find((p) => p.period === periodNum);
      const slotStartTime = startTime || defaultPeriodDef?.startTime || '08:00';
      const slotEndTime = endTime || defaultPeriodDef?.endTime || '08:45';

      // 3. Upsert slot
      const slot = await prisma.timetableSlot.upsert({
        where: {
          streamId_dayOfWeek_period: {
            streamId,
            dayOfWeek,
            period: periodNum,
          },
        },
        update: {
          subjectId,
          teacherId,
          startTime: slotStartTime,
          endTime: slotEndTime,
          room: room ? room.trim() : null,
        },
        create: {
          streamId,
          subjectId,
          teacherId,
          dayOfWeek,
          period: periodNum,
          startTime: slotStartTime,
          endTime: slotEndTime,
          room: room ? room.trim() : null,
        },
        include: {
          stream: { include: { class: true } },
          subject: true,
          teacher: { select: { id: true, fullName: true, email: true } },
        },
      });

      res.status(201).json({ message: 'Timetable slot assigned successfully', slot });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/timetable/batch (Batch assign multiple slots)
router.post(
  '/batch',
  authenticateToken,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const { slots } = req.body;
      if (!Array.isArray(slots) || slots.length === 0) {
        return res.status(400).json({ error: 'slots array is required' });
      }

      const results = [];
      for (const item of slots) {
        const defaultDef = DEFAULT_PERIODS.find((p) => p.period === Number(item.period));
        const slot = await prisma.timetableSlot.upsert({
          where: {
            streamId_dayOfWeek_period: {
              streamId: item.streamId,
              dayOfWeek: item.dayOfWeek,
              period: Number(item.period),
            },
          },
          update: {
            subjectId: item.subjectId,
            teacherId: item.teacherId,
            startTime: item.startTime || defaultDef?.startTime || '08:00',
            endTime: item.endTime || defaultDef?.endTime || '08:45',
            room: item.room || null,
          },
          create: {
            streamId: item.streamId,
            subjectId: item.subjectId,
            teacherId: item.teacherId,
            dayOfWeek: item.dayOfWeek,
            period: Number(item.period),
            startTime: item.startTime || defaultDef?.startTime || '08:00',
            endTime: item.endTime || defaultDef?.endTime || '08:45',
            room: item.room || null,
          },
        });
        results.push(slot);
      }

      res.json({ message: `Successfully saved ${results.length} slots`, count: results.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/timetable/copy (Copy timetable from source stream to target stream)
router.post(
  '/copy',
  authenticateToken,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const { sourceStreamId, targetStreamId, overrideExisting } = req.body;

      if (!sourceStreamId || !targetStreamId) {
        return res.status(400).json({ error: 'sourceStreamId and targetStreamId are required' });
      }

      const sourceSlots = await prisma.timetableSlot.findMany({
        where: { streamId: sourceStreamId },
      });

      if (sourceSlots.length === 0) {
        return res.status(404).json({ error: 'Source stream has no timetable slots to copy.' });
      }

      if (overrideExisting) {
        await prisma.timetableSlot.deleteMany({
          where: { streamId: targetStreamId },
        });
      }

      // Check subject teachers allocated to target stream
      const targetAllocations = await prisma.classSubjectTeacher.findMany({
        where: { streamId: targetStreamId },
      });

      let copiedCount = 0;
      for (const slot of sourceSlots) {
        // Match teacher allocated for the target stream if available, otherwise reuse source teacher
        const allocatedTeacher = targetAllocations.find((a) => a.subjectId === slot.subjectId);
        const finalTeacherId = allocatedTeacher ? allocatedTeacher.teacherId : slot.teacherId;

        await prisma.timetableSlot.upsert({
          where: {
            streamId_dayOfWeek_period: {
              streamId: targetStreamId,
              dayOfWeek: slot.dayOfWeek,
              period: slot.period,
            },
          },
          update: {
            subjectId: slot.subjectId,
            teacherId: finalTeacherId,
            startTime: slot.startTime,
            endTime: slot.endTime,
            room: slot.room,
          },
          create: {
            streamId: targetStreamId,
            subjectId: slot.subjectId,
            teacherId: finalTeacherId,
            dayOfWeek: slot.dayOfWeek,
            period: slot.period,
            startTime: slot.startTime,
            endTime: slot.endTime,
            room: slot.room,
          },
        });
        copiedCount++;
      }

      res.json({ message: `Successfully copied ${copiedCount} periods to target class stream.`, count: copiedCount });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/timetable/auto-generate (Smart Algorithmic Timetable Generator)
router.post(
  '/auto-generate',
  authenticateToken,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const { streamId, clearExisting } = req.body;

      if (!streamId) {
        return res.status(400).json({ error: 'streamId is required' });
      }

      const stream = await prisma.stream.findUnique({
        where: { id: streamId },
        include: { class: true },
      });

      if (!stream) {
        return res.status(404).json({ error: 'Stream not found' });
      }

      // 1. Fetch allocated subject teachers for this stream
      const allocations = await prisma.classSubjectTeacher.findMany({
        where: { streamId },
        include: { subject: true, teacher: true },
      });

      // If no stream allocations, fetch all available subjects and pick default teachers
      let subjectPool: { subjectId: string; teacherId: string; subjectName: string; periodsPerWeek: number; room?: string }[] = [];

      if (allocations.length > 0) {
        allocations.forEach((a) => {
          // Determine weekly weight
          const weight = a.subject.category === 'CORE' ? 6 : 4;
          subjectPool.push({
            subjectId: a.subjectId,
            teacherId: a.teacherId,
            subjectName: a.subject.name,
            periodsPerWeek: weight,
            room: a.subject.name.toLowerCase().includes('science')
              ? 'Science Lab 1'
              : a.subject.name.toLowerCase().includes('ict') || a.subject.name.toLowerCase().includes('computing')
              ? 'ICT Computer Lab'
              : `${stream.class.name} Room`,
          });
        });
      } else {
        // Fallback to all subjects in school
        const allSubjects = await prisma.subject.findMany();
        const defaultTeacher = await prisma.user.findFirst({
          where: { role: { in: ['TEACHER', 'FORM_TEACHER', 'ADMIN', 'SUPER_ADMIN'] } },
        });

        if (!defaultTeacher || allSubjects.length === 0) {
          return res.status(400).json({ error: 'No subjects or teachers configured in system to auto-generate.' });
        }

        allSubjects.forEach((sub) => {
          subjectPool.push({
            subjectId: sub.id,
            teacherId: defaultTeacher.id,
            subjectName: sub.name,
            periodsPerWeek: 5,
            room: `${stream.class.name} Room`,
          });
        });
      }

      if (clearExisting) {
        await prisma.timetableSlot.deleteMany({ where: { streamId } });
      }

      // 2. Fetch existing slots in other streams to check teacher availability in real time
      const otherStreamSlots = await prisma.timetableSlot.findMany({
        where: { NOT: { streamId } },
      });

      const teacherBusySet = new Set<string>();
      otherStreamSlots.forEach((s) => {
        teacherBusySet.add(`${s.teacherId}_${s.dayOfWeek}_${s.period}`);
      });

      // Build target slots list (8 periods/day * 5 days = 40 periods)
      const days = DAYS_OF_WEEK;
      const periods = [1, 2, 3, 4, 5, 6, 7, 8];
      let poolIndex = 0;
      const generatedSlots = [];

      for (const day of days) {
        for (const period of periods) {
          // Find an allocated subject whose teacher is NOT busy at this day & period
          let candidate = null;
          let attempts = 0;
          while (attempts < subjectPool.length) {
            const currentCandidate = subjectPool[poolIndex % subjectPool.length];
            const busyKey = `${currentCandidate.teacherId}_${day}_${period}`;
            if (!teacherBusySet.has(busyKey)) {
              candidate = currentCandidate;
              poolIndex++;
              break;
            }
            poolIndex++;
            attempts++;
          }

          if (!candidate && subjectPool.length > 0) {
            // Pick first candidate anyway if all are busy
            candidate = subjectPool[0];
          }

          if (candidate) {
            const defPeriod = DEFAULT_PERIODS.find((p) => p.period === period);
            const slot = await prisma.timetableSlot.upsert({
              where: {
                streamId_dayOfWeek_period: {
                  streamId,
                  dayOfWeek: day,
                  period,
                },
              },
              update: {
                subjectId: candidate.subjectId,
                teacherId: candidate.teacherId,
                startTime: defPeriod?.startTime || '08:00',
                endTime: defPeriod?.endTime || '08:45',
                room: candidate.room || `${stream.class.name} Room`,
              },
              create: {
                streamId,
                subjectId: candidate.subjectId,
                teacherId: candidate.teacherId,
                dayOfWeek: day,
                period,
                startTime: defPeriod?.startTime || '08:00',
                endTime: defPeriod?.endTime || '08:45',
                room: candidate.room || `${stream.class.name} Room`,
              },
            });
            generatedSlots.push(slot);
            teacherBusySet.add(`${candidate.teacherId}_${day}_${period}`);
          }
        }
      }

      res.status(201).json({
        message: `Successfully auto-generated ${generatedSlots.length} weekly timetable periods for ${stream.class.name} ${stream.name}.`,
        count: generatedSlots.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// DELETE /api/timetable/slot/:id
router.delete(
  '/slot/:id',
  authenticateToken,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.FORM_TEACHER),
  async (req: Request, res: Response) => {
    try {
      await prisma.timetableSlot.delete({
        where: { id: req.params.id },
      });
      res.json({ message: 'Timetable slot deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// DELETE /api/timetable/stream/:streamId (Clear entire stream timetable)
router.delete(
  '/stream/:streamId',
  authenticateToken,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const { count } = await prisma.timetableSlot.deleteMany({
        where: { streamId: req.params.streamId },
      });
      res.json({ message: `Successfully cleared ${count} slots for stream.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// DELETE /api/timetable/clear-day (Clear a single day for a stream)
router.delete(
  '/clear-day',
  authenticateToken,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.FORM_TEACHER),
  async (req: Request, res: Response) => {
    try {
      const { streamId, dayOfWeek } = req.body;
      if (!streamId || !dayOfWeek) {
        return res.status(400).json({ error: 'streamId and dayOfWeek are required' });
      }

      const { count } = await prisma.timetableSlot.deleteMany({
        where: { streamId, dayOfWeek },
      });
      res.json({ message: `Successfully cleared ${count} slots for ${dayOfWeek}.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
