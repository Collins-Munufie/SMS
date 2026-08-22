import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken, AuthRequest, authorizeRoles } from '../middleware/auth';
import { Role, AttendanceStatus } from '../types';

const router = Router();

// Helper: WAEC / GES 9-Point Grading Scale for Ghana Basic Education
export function getWaecGrade(score: number): { grade: string; remark: string; gpa: number } {
  if (score >= 80) return { grade: 'A1', remark: 'Excellent', gpa: 1 };
  if (score >= 75) return { grade: 'B2', remark: 'Very Good', gpa: 2 };
  if (score >= 70) return { grade: 'B3', remark: 'Good', gpa: 3 };
  if (score >= 65) return { grade: 'C4', remark: 'Credit', gpa: 4 };
  if (score >= 60) return { grade: 'C5', remark: 'Credit', gpa: 5 };
  if (score >= 55) return { grade: 'C6', remark: 'Credit', gpa: 6 };
  if (score >= 50) return { grade: 'D7', remark: 'Pass', gpa: 7 };
  if (score >= 45) return { grade: 'E8', remark: 'Pass', gpa: 8 };
  return { grade: 'F9', remark: 'Fail', gpa: 9 };
}

// 1. GET /api/grades/teacher/allocations (Scope teacher's assigned subjects & classes)
router.get('/teacher/allocations', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user!.role;
    const userId = req.user!.id;

    let allocations;

    if (userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN) {
      allocations = await prisma.classSubjectTeacher.findMany({
        include: {
          stream: { include: { class: true } },
          subject: true,
          teacher: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: [{ stream: { class: { name: 'asc' } } }, { subject: { name: 'asc' } }],
      });
    } else {
      allocations = await prisma.classSubjectTeacher.findMany({
        where: { teacherId: userId },
        include: {
          stream: { include: { class: true } },
          subject: true,
          teacher: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: [{ stream: { class: { name: 'asc' } } }, { subject: { name: 'asc' } }],
      });
    }

    res.json({ allocations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/grades/ca-grid (Spreadsheet score entry grid payload)
router.get('/ca-grid', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { streamId, subjectId, termId } = req.query;
    if (!streamId || !subjectId || !termId) {
      return res.status(400).json({ error: 'streamId, subjectId, and termId are required' });
    }

    const stream = await prisma.stream.findUnique({
      where: { id: String(streamId) },
      include: {
        class: true,
        formTeacher: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Get Active Term Window Locks
    const term = await prisma.term.findUnique({
      where: { id: String(termId) },
      include: { academicYear: true },
    });

    // Get Admin-configured Assessment Components for this class level
    let components = await prisma.assessmentComponent.findMany({
      where: { classId: stream.classId },
      orderBy: { weightPercentage: 'asc' },
    });

    // Fallback default Ghana GES CA components if not created yet
    if (components.length === 0) {
      components = [
        { id: 'ca-1', classId: stream.classId, name: 'Class Test 1', weightPercentage: 10, maxScore: 20 },
        { id: 'ca-2', classId: stream.classId, name: 'Class Test 2', weightPercentage: 10, maxScore: 20 },
        { id: 'ca-3', classId: stream.classId, name: 'Group Work / Project', weightPercentage: 10, maxScore: 20 },
        { id: 'ca-4', classId: stream.classId, name: 'Homework / Exercises', weightPercentage: 10, maxScore: 20 },
        { id: 'ca-exam', classId: stream.classId, name: 'Terminal Exam', weightPercentage: 60, maxScore: 100 },
      ] as any;
    }

    // Get Enrolled Students in Stream
    const enrollments = await prisma.enrollment.findMany({
      where: { streamId: String(streamId), termId: String(termId) },
      include: {
        student: {
          include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });

    // Get Recorded Raw Grades
    const existingGrades = await prisma.grade.findMany({
      where: {
        streamId: String(streamId),
        subjectId: String(subjectId),
        termId: String(termId),
      },
    });

    // Calculate missing score count summary
    const totalRequiredEntries = enrollments.length * components.length;
    const missingEntriesCount = totalRequiredEntries - existingGrades.length;

    res.json({
      stream: {
        id: stream.id,
        name: stream.name,
        className: stream.class.name,
        formTeacher: stream.formTeacher,
      },
      term: {
        id: term?.id,
        label: term?.termLabel,
        yearLabel: term?.academicYear?.yearLabel,
        isExamWindowOpen: term?.isExamWindowOpen ?? true,
        isTermLocked: term?.isTermLocked ?? false,
      },
      components,
      enrollments,
      grades: existingGrades,
      summary: {
        totalStudents: enrollments.length,
        missingEntriesCount: Math.max(0, missingEntriesCount),
        isComplete: missingEntriesCount <= 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/grades/ca-entry (Score Entry with Scoped Safeguards & Automatic Collation)
router.post(
  '/ca-entry',
  authenticateToken,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.FORM_TEACHER),
  async (req: AuthRequest, res: Response) => {
    try {
      const { streamId, subjectId, termId, entries } = req.body;
      const userRole = req.user!.role;
      const userId = req.user!.id;

      if (!streamId || !subjectId || !termId || !Array.isArray(entries)) {
        return res.status(400).json({ error: 'Invalid score payload structure' });
      }

      // SAFEGUARD 1: Check Teacher Scope Allocation
      if (userRole === Role.TEACHER || userRole === Role.FORM_TEACHER) {
        const isAllocated = await prisma.classSubjectTeacher.findFirst({
          where: { streamId, subjectId, teacherId: userId },
        });

        if (!isAllocated) {
          return res.status(403).json({
            error: 'Access Denied: You can only enter or edit scores for your own assigned subject and class.',
          });
        }
      }

      // SAFEGUARD 2: Term Lock Check
      const term = await prisma.term.findUnique({ where: { id: termId } });
      if (term?.isTermLocked && userRole !== Role.SUPER_ADMIN && userRole !== Role.ADMIN) {
        return res.status(423).json({
          error: 'Term assessment window is locked by Admin. Changes require an Admin unlock.',
        });
      }

      // SAFEGUARD 3: Raw Score Validation against Max Score
      const components = await prisma.assessmentComponent.findMany({
        where: { class: { streams: { some: { id: streamId } } } },
      });

      const compMap = new Map(components.map((c) => [c.id, c]));

      for (const item of entries) {
        const comp = compMap.get(item.componentId);
        const maxScore = comp?.maxScore || 100;
        if (item.score < 0 || item.score > maxScore) {
          return res.status(400).json({
            error: `Validation Error: Score ${item.score} exceeds maximum allowed score of ${maxScore} for component "${comp?.name}".`,
          });
        }
      }

      // Batch Upsert Raw Scores
      const upsertOps = entries.map((item: { studentId: string; componentId: string; score: number }) => {
        const comp = compMap.get(item.componentId);
        return prisma.grade.upsert({
          where: {
            studentId_termId_subjectId_componentId: {
              studentId: item.studentId,
              termId,
              subjectId,
              componentId: item.componentId,
            },
          },
          update: {
            score: Number(item.score),
            maxScore: comp?.maxScore || 100,
          },
          create: {
            studentId: item.studentId,
            streamId,
            termId,
            subjectId,
            componentId: item.componentId,
            score: Number(item.score),
            maxScore: comp?.maxScore || 100,
          },
        });
      });

      await prisma.$transaction(upsertOps);

      // AUTO-COLLATION & CLASS RE-RANKING: Recalculate Totals & Ranks for all students in stream
      await recomputeStreamRanks(streamId, termId);

      res.json({
        message: `Saved and auto-collated scores for ${entries.length} component entries. Report cards and class positions updated in real-time.`,
        savedEntriesCount: entries.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Helper function: Recalculate Totals, Averages, and Class Ranks for a stream
async function recomputeStreamRanks(streamId: string, termId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { streamId, termId },
    include: { student: true },
  });

  const studentAverages: { studentId: string; totalScore: number; averageScore: number; waecGrade: string }[] = [];

  for (const en of enrollments) {
    const studentGrades = await prisma.grade.findMany({
      where: { studentId: en.studentId, termId },
      include: { component: true },
    });

    const subjectTotals: Record<string, number> = {};
    studentGrades.forEach((g) => {
      const weight = g.component.weightPercentage || 10;
      const max = g.component.maxScore || 100;
      const weightedScore = (g.score / max) * weight;
      subjectTotals[g.subjectId] = (subjectTotals[g.subjectId] || 0) + weightedScore;
    });

    const totalsArray = Object.values(subjectTotals);
    const totalScore = totalsArray.reduce((acc, curr) => acc + curr, 0);
    const averageScore = totalsArray.length > 0 ? totalScore / totalsArray.length : 0;
    const waec = getWaecGrade(averageScore);

    studentAverages.push({
      studentId: en.studentId,
      totalScore: Math.round(totalScore * 10) / 10,
      averageScore: Math.round(averageScore * 10) / 10,
      waecGrade: waec.grade,
    });
  }

  // Sort descending by average score
  studentAverages.sort((a, b) => b.averageScore - a.averageScore);

  const ops = studentAverages.map((item, idx) => {
    const positionInClass = idx + 1;
    return prisma.termResult.upsert({
      where: {
        studentId_termId: {
          studentId: item.studentId,
          termId,
        },
      },
      update: {
        streamId,
        totalScore: item.totalScore,
        averageScore: item.averageScore,
        waecGrade: item.waecGrade,
        positionInClass,
        isUpdated: true,
      },
      create: {
        studentId: item.studentId,
        streamId,
        termId,
        totalScore: item.totalScore,
        averageScore: item.averageScore,
        waecGrade: item.waecGrade,
        positionInClass,
        formTeacherRemarks:
          positionInClass <= 3
            ? 'Exceptional academic excellence. Commendable work!'
            : 'Good effort and steady progress throughout the term.',
        headteacherRemarks: 'Promoted to next grade level with recommendation.',
        isUpdated: false,
      },
    });
  });

  await prisma.$transaction(ops);
}

// 4. POST /api/grades/compute-ranks (Manual or explicit re-ranking)
router.post(
  '/compute-ranks',
  authenticateToken,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.FORM_TEACHER),
  async (req: Request, res: Response) => {
    try {
      const { streamId, termId } = req.body;
      if (!streamId || !termId) {
        return res.status(400).json({ error: 'streamId and termId are required' });
      }

      await recomputeStreamRanks(streamId, termId);

      const results = await prisma.termResult.findMany({
        where: { streamId, termId },
        include: { student: { include: { user: { select: { fullName: true } } } } },
        orderBy: { positionInClass: 'asc' },
      });

      res.json({
        message: `Successfully computed and refreshed class positions for ${results.length} students.`,
        results,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// 5. POST /api/grades/term-lock (Admin Term Lock / Window Toggle)
router.post(
  '/term-lock',
  authenticateToken,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const { termId, isTermLocked, isExamWindowOpen } = req.body;
      if (!termId) {
        return res.status(400).json({ error: 'termId is required' });
      }

      const updateData: any = {};
      if (typeof isTermLocked === 'boolean') updateData.isTermLocked = isTermLocked;
      if (typeof isExamWindowOpen === 'boolean') updateData.isExamWindowOpen = isExamWindowOpen;

      const updatedTerm = await prisma.term.update({
        where: { id: termId },
        data: updateData,
      });

      res.json({
        message: `Term assessment settings updated: ${
          updatedTerm.isTermLocked ? 'LOCKED' : 'UNLOCKED'
        }`,
        term: updatedTerm,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// 6. POST /api/grades/remarks (Update Pupil Remarks)
router.post(
  '/remarks',
  authenticateToken,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.FORM_TEACHER),
  async (req: Request, res: Response) => {
    try {
      const { studentId, termId, formTeacherRemarks, headteacherRemarks } = req.body;
      if (!studentId || !termId) {
        return res.status(400).json({ error: 'studentId and termId are required' });
      }

      const enrollment = await prisma.enrollment.findFirst({
        where: { studentId, termId },
      });
      const streamId = enrollment?.streamId || (await prisma.stream.findFirst())?.id || '';

      const termResult = await prisma.termResult.upsert({
        where: {
          studentId_termId: { studentId, termId },
        },
        update: {
          formTeacherRemarks,
          headteacherRemarks,
        },
        create: {
          studentId,
          streamId,
          termId,
          totalScore: 0,
          averageScore: 0,
          waecGrade: 'F9',
          formTeacherRemarks,
          headteacherRemarks,
        },
      });

      res.json({ message: 'Teacher and Headteacher remarks saved successfully', termResult });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Helper function to build a complete report card payload for a student
async function buildStudentReportCard(studentId: string, targetTermId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      enrollments: {
        where: { termId: targetTermId },
        include: {
          stream: {
            include: {
              class: true,
              formTeacher: { select: { id: true, fullName: true, email: true } },
            },
          },
          term: { include: { academicYear: true } },
        },
      },
      attendances: true,
    },
  });

  if (!student) return null;

  const enrollment = student.enrollments[0];
  const streamId = enrollment?.streamId;

  // School profile
  const schoolProfile = await prisma.schoolProfile.findFirst();

  // Term
  const term = await prisma.term.findUnique({
    where: { id: targetTermId },
    include: { academicYear: true },
  });

  // Calculate Attendance Stats for the Term
  const totalSchoolDays = 60; // Standard term school days
  const studentAttendanceRecords = await prisma.attendance.findMany({
    where: { studentId },
  });

  const presentDays = studentAttendanceRecords.filter((a) => a.status === AttendanceStatus.PRESENT).length;
  const lateDays = studentAttendanceRecords.filter((a) => a.status === AttendanceStatus.LATE).length;
  const absentDays = studentAttendanceRecords.filter((a) => a.status === AttendanceStatus.ABSENT).length;
  const excusedDays = studentAttendanceRecords.filter((a) => a.status === AttendanceStatus.EXCUSED).length;

  const effectivePresent = presentDays + lateDays;
  const attendancePercentage =
    totalSchoolDays > 0 ? Math.min(100, Math.round((effectivePresent / Math.max(effectivePresent + absentDays, totalSchoolDays)) * 100)) : 100;

  // Fetch all grades recorded for this student in this term
  const grades = await prisma.grade.findMany({
    where: { studentId, termId: targetTermId },
    include: { subject: true, component: true },
  });

  // Also fetch all subjects taught in this stream
  const streamSubjectTeachers = streamId
    ? await prisma.classSubjectTeacher.findMany({
        where: { streamId },
        include: {
          subject: true,
          teacher: { select: { fullName: true } },
        },
      })
    : [];

  // Group grades by subject
  const subjectMap: Record<
    string,
    {
      subject: any;
      teacherName: string;
      classScore: number;
      examScore: number;
      totalScore: number;
      components: any[];
    }
  > = {};

  // Initialize with all allocated subjects
  streamSubjectTeachers.forEach((st) => {
    subjectMap[st.subjectId] = {
      subject: st.subject,
      teacherName: st.teacher.fullName,
      classScore: 0,
      examScore: 0,
      totalScore: 0,
      components: [],
    };
  });

  grades.forEach((g) => {
    if (!subjectMap[g.subjectId]) {
      subjectMap[g.subjectId] = {
        subject: g.subject,
        teacherName: 'Subject Teacher',
        classScore: 0,
        examScore: 0,
        totalScore: 0,
        components: [],
      };
    }

    const weight = g.component.weightPercentage || 10;
    const max = g.component.maxScore || 100;
    const weightedScore = (g.score / max) * weight;

    const isExam = g.component.name.toLowerCase().includes('exam');
    if (isExam) {
      subjectMap[g.subjectId].examScore += weightedScore;
    } else {
      subjectMap[g.subjectId].classScore += weightedScore;
    }

    subjectMap[g.subjectId].totalScore += weightedScore;
    subjectMap[g.subjectId].components.push({
      name: g.component.name,
      score: g.score,
      maxScore: max,
      weight,
      weightedScore: Math.round(weightedScore * 10) / 10,
    });
  });

  const subjectResults = Object.values(subjectMap).map((item) => {
    const totalRounded = Math.round(item.totalScore * 10) / 10;
    const classScoreRounded = Math.round(item.classScore * 10) / 10;
    const examScoreRounded = Math.round(item.examScore * 10) / 10;
    const waec = getWaecGrade(totalRounded);

    return {
      subjectName: item.subject.name,
      subjectCode: item.subject.code,
      teacherName: item.teacherName,
      classScore: classScoreRounded,
      examScore: examScoreRounded,
      totalScore: totalRounded,
      waecGrade: waec.grade,
      remark: waec.remark,
      gpa: waec.gpa,
      components: item.components,
    };
  });

  const overallTotal = Math.round(subjectResults.reduce((sum, s) => sum + s.totalScore, 0) * 10) / 10;
  const overallAverage =
    subjectResults.length > 0 ? Math.round((overallTotal / subjectResults.length) * 10) / 10 : 0;
  const overallWaec = getWaecGrade(overallAverage);

  // Total Students in Stream for rank representation (e.g. 1st out of 35)
  const totalStudentsInStream = streamId
    ? await prisma.enrollment.count({ where: { streamId, termId: targetTermId } })
    : 1;

  // Term Result record
  const termResult = await prisma.termResult.findUnique({
    where: {
      studentId_termId: { studentId, termId: targetTermId },
    },
  });

  return {
    schoolProfile,
    student: {
      id: student.id,
      studentId: student.studentId,
      fullName: student.user.fullName,
      photoUrl: student.user.avatarUrl,
      class: enrollment?.stream.class.name || 'Basic Class',
      stream: enrollment?.stream.name || 'A',
      streamId,
      formTeacher: enrollment?.stream.formTeacher?.fullName || 'Ms. Abena Mensah',
      rollNumber: enrollment?.rollNumber || 1,
      gender: student.gender,
    },
    term: {
      id: term?.id,
      label: term?.termLabel || 'Term 1',
      academicYear: term?.academicYear?.yearLabel || '2025/2026',
      startDate: term?.startDate,
      endDate: term?.endDate,
    },
    attendance: {
      totalSchoolDays,
      presentDays: effectivePresent,
      absentDays,
      lateDays,
      excusedDays,
      attendancePercentage,
    },
    subjectResults,
    summary: {
      overallTotal,
      overallAverage,
      waecGrade: overallWaec.grade,
      overallRemark: overallWaec.remark,
      positionInClass: termResult?.positionInClass || 1,
      totalStudentsInStream: totalStudentsInStream || 1,
      formTeacherRemarks:
        termResult?.formTeacherRemarks ||
        (overallAverage >= 75
          ? 'An outstanding academic performance. Recommended for promotion.'
          : 'Good effort and regular class participation.'),
      headteacherRemarks:
        termResult?.headteacherRemarks || 'Promoted to next class level with honors.',
      isUpdated: termResult?.isUpdated || false,
    },
  };
}

// 7. GET /api/grades/report-card/:studentId (Full Single Student Report Card)
router.get('/report-card/:studentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { termId } = req.query;

    const activeTermId = termId
      ? String(termId)
      : (await prisma.term.findFirst({ where: { isCurrent: true } }))?.id ||
        (await prisma.term.findFirst())?.id;

    if (!activeTermId) {
      return res.status(400).json({ error: 'No active academic term found' });
    }

    const reportCard = await buildStudentReportCard(studentId, activeTermId);

    if (!reportCard) {
      return res.status(404).json({ error: 'Student report card not found' });
    }

    res.json(reportCard);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. GET /api/grades/class-report-cards (Batch Report Cards for an entire stream)
router.get(
  '/class-report-cards',
  authenticateToken,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.FORM_TEACHER, Role.TEACHER),
  async (req: Request, res: Response) => {
    try {
      const { streamId, termId } = req.query;

      if (!streamId) {
        return res.status(400).json({ error: 'streamId is required' });
      }

      const activeTermId = termId
        ? String(termId)
        : (await prisma.term.findFirst({ where: { isCurrent: true } }))?.id ||
          (await prisma.term.findFirst())?.id;

      if (!activeTermId) {
        return res.status(400).json({ error: 'No active academic term found' });
      }

      const enrollments = await prisma.enrollment.findMany({
        where: { streamId: String(streamId), termId: activeTermId },
        select: { studentId: true },
        orderBy: { rollNumber: 'asc' },
      });

      const reportCards = [];
      for (const en of enrollments) {
        const rc = await buildStudentReportCard(en.studentId, activeTermId);
        if (rc) reportCards.push(rc);
      }

      res.json({ reportCards, count: reportCards.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
