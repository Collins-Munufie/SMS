import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken, AuthRequest, authorizeRoles } from '../middleware/auth';
import { Role } from '../types';

const router = Router();

// Helper: WAEC Grade Scale
export function getWaecGrade(score: number): { grade: string; remark: string } {
  if (score >= 80) return { grade: 'A1', remark: 'Excellent' };
  if (score >= 75) return { grade: 'B2', remark: 'Very Good' };
  if (score >= 70) return { grade: 'B3', remark: 'Good' };
  if (score >= 65) return { grade: 'C4', remark: 'Credit' };
  if (score >= 60) return { grade: 'C5', remark: 'Credit' };
  if (score >= 55) return { grade: 'C6', remark: 'Credit' };
  if (score >= 50) return { grade: 'D7', remark: 'Pass' };
  if (score >= 45) return { grade: 'E8', remark: 'Pass' };
  return { grade: 'F9', remark: 'Fail' };
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
          teacher: { select: { fullName: true, email: true } },
        },
      });
    } else {
      allocations = await prisma.classSubjectTeacher.findMany({
        where: { teacherId: userId },
        include: {
          stream: { include: { class: true } },
          subject: true,
          teacher: { select: { fullName: true, email: true } },
        },
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
      include: { class: true },
    });

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Get Active Term Window Locks
    const term = await prisma.term.findUnique({
      where: { id: String(termId) },
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
          include: { user: { select: { fullName: true } } },
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
      },
      term: {
        id: term?.id,
        label: term?.termLabel,
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

// 3. POST /api/grades/ca-entry (Score Entry with Safeguards & Auto-Collation)
router.post('/ca-entry', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.FORM_TEACHER), async (req: AuthRequest, res: Response) => {
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
        return res.status(403).json({ error: 'Access Denied: You can only enter scores for your own assigned subject and class.' });
      }
    }

    // SAFEGUARD 2: Term Lock Check
    const term = await prisma.term.findUnique({ where: { id: termId } });
    if (term?.isTermLocked && userRole !== Role.SUPER_ADMIN) {
      return res.status(423).json({ error: 'Term edit window is locked by Admin. Changes require Admin override.' });
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

    // AUTO-COLLATION LOGIC: Recalculate Weighted Total Score for Students
    const affectedStudentIds = Array.from(new Set(entries.map((e: any) => e.studentId)));

    for (const studentId of affectedStudentIds) {
      const studentGrades = await prisma.grade.findMany({
        where: { studentId, termId },
        include: { component: true },
      });

      // Group by subject to calculate total score
      const subjectTotals: Record<string, number> = {};
      studentGrades.forEach((g) => {
        const weight = g.component.weightPercentage || 10;
        const max = g.component.maxScore || 100;
        const weightedScore = (g.score / max) * weight;
        subjectTotals[g.subjectId] = (subjectTotals[g.subjectId] || 0) + weightedScore;
      });

      const totalsArray = Object.values(subjectTotals);
      const totalScore = totalsArray.reduce((sum, val) => sum + val, 0);
      const averageScore = totalsArray.length > 0 ? totalScore / totalsArray.length : 0;
      const waec = getWaecGrade(averageScore);

      await prisma.termResult.upsert({
        where: {
          studentId_termId: { studentId, termId },
        },
        update: {
          totalScore: Math.round(totalScore * 10) / 10,
          averageScore: Math.round(averageScore * 10) / 10,
          waecGrade: waec.grade,
          isUpdated: true, // Flag for Admin Review
        },
        create: {
          studentId,
          streamId,
          termId,
          totalScore: Math.round(totalScore * 10) / 10,
          averageScore: Math.round(averageScore * 10) / 10,
          waecGrade: waec.grade,
          isUpdated: false,
          formTeacherRemarks: 'Satisfactory basic education effort.',
          headteacherRemarks: 'Promoted.',
        },
      });
    }

    res.json({
      message: `Saved and auto-collated scores for ${affectedStudentIds.length} students. Report card updated.`,
      collatedCount: affectedStudentIds.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET /api/grades/pending-summary (Teacher Dashboard Widget Data)
router.get('/pending-summary', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Get current active term
    const activeTerm = await prisma.term.findFirst({ where: { isCurrent: true } });
    if (!activeTerm) return res.json({ pendingList: [] });

    let allocations;
    if (userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN) {
      allocations = await prisma.classSubjectTeacher.findMany({
        take: 5,
        include: { stream: { include: { class: true } }, subject: true },
      });
    } else {
      allocations = await prisma.classSubjectTeacher.findMany({
        where: { teacherId: userId },
        include: { stream: { include: { class: true } }, subject: true },
      });
    }

    const pendingList = [];

    for (const alloc of allocations) {
      const enrollmentsCount = await prisma.enrollment.count({
        where: { streamId: alloc.streamId, termId: activeTerm.id },
      });

      const recordedGradesCount = await prisma.grade.count({
        where: {
          streamId: alloc.streamId,
          subjectId: alloc.subjectId,
          termId: activeTerm.id,
        },
      });

      const componentsCount = await prisma.assessmentComponent.count({
        where: { classId: alloc.stream.classId },
      }) || 5;

      const requiredCount = enrollmentsCount * componentsCount;
      const isComplete = recordedGradesCount >= requiredCount && requiredCount > 0;

      pendingList.push({
        allocationId: alloc.id,
        className: alloc.stream.class.name,
        streamName: alloc.stream.name,
        subjectName: alloc.subject.name,
        streamId: alloc.streamId,
        subjectId: alloc.subjectId,
        termId: activeTerm.id,
        completionPercentage: requiredCount > 0 ? Math.min(100, Math.round((recordedGradesCount / requiredCount) * 100)) : 0,
        isComplete,
      });
    }

    res.json({ pendingList });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/grades/components
router.get('/components', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { classId } = req.query;
    const whereCondition = classId ? { classId: String(classId) } : {};
    const components = await prisma.assessmentComponent.findMany({
      where: whereCondition,
      include: { class: true },
    });
    res.json({ components });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/grades/components
router.post('/components', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const { classId, name, weightPercentage, maxScore } = req.body;
    if (!classId || !name || weightPercentage === undefined) {
      return res.status(400).json({ error: 'classId, name, and weightPercentage are required' });
    }

    const component = await prisma.assessmentComponent.create({
      data: {
        classId,
        name,
        weightPercentage: Number(weightPercentage),
        maxScore: Number(maxScore || 100),
      },
    });

    res.status(201).json({ component });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/grades/matrix
router.get('/matrix', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { streamId, termId, subjectId } = req.query;
    if (!streamId || !termId || !subjectId) {
      return res.status(400).json({ error: 'streamId, termId, and subjectId are required' });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { streamId: String(streamId), termId: String(termId) },
      include: {
        student: {
          include: { user: { select: { id: true, fullName: true } } },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });

    const grades = await prisma.grade.findMany({
      where: {
        streamId: String(streamId),
        termId: String(termId),
        subjectId: String(subjectId),
      },
      include: { component: true },
    });

    res.json({ enrollments, grades });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/grades/compute-ranks
router.post('/compute-ranks', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.FORM_TEACHER), async (req: Request, res: Response) => {
  try {
    const { streamId, termId } = req.body;
    if (!streamId || !termId) {
      return res.status(400).json({ error: 'streamId and termId are required' });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { streamId, termId },
      include: { student: true },
    });

    const studentScores: { studentId: string; totalScore: number; averageScore: number; waecGrade: string }[] = [];

    for (const en of enrollments) {
      const studentGrades = await prisma.grade.findMany({
        where: { studentId: en.studentId, termId },
      });

      const subjectTotals: Record<string, number> = {};
      studentGrades.forEach((g) => {
        subjectTotals[g.subjectId] = (subjectTotals[g.subjectId] || 0) + g.score;
      });

      const totalsArray = Object.values(subjectTotals);
      const totalScore = totalsArray.reduce((acc, curr) => acc + curr, 0);
      const averageScore = totalsArray.length > 0 ? totalScore / totalsArray.length : 0;
      const waec = getWaecGrade(averageScore);

      studentScores.push({
        studentId: en.studentId,
        totalScore,
        averageScore: Math.round(averageScore * 10) / 10,
        waecGrade: waec.grade,
      });
    }

    studentScores.sort((a, b) => b.averageScore - a.averageScore);

    const upsertOps = studentScores.map((item, index) => {
      const positionInClass = index + 1;
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
          isUpdated: false,
        },
        create: {
          studentId: item.studentId,
          streamId,
          termId,
          totalScore: item.totalScore,
          averageScore: item.averageScore,
          waecGrade: item.waecGrade,
          positionInClass,
          formTeacherRemarks: 'Satisfactory basic education effort.',
          headteacherRemarks: 'Promoted.',
          isUpdated: false,
        },
      });
    });

    await prisma.$transaction(upsertOps);

    res.json({
      message: `Computed position ranks for ${studentScores.length} students`,
      ranks: studentScores,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/grades/remarks
router.post('/remarks', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.FORM_TEACHER), async (req: Request, res: Response) => {
  try {
    const { studentId, termId, formTeacherRemarks, headteacherRemarks } = req.body;

    const termResult = await prisma.termResult.update({
      where: {
        studentId_termId: { studentId, termId },
      },
      data: {
        formTeacherRemarks,
        headteacherRemarks,
      },
    });

    res.json({ message: 'Remarks saved successfully', termResult });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/grades/report-card/:studentId
router.get('/report-card/:studentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { termId } = req.query;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        enrollments: {
          include: {
            stream: { include: { class: true, formTeacher: true } },
            term: { include: { academicYear: true } },
          },
        },
        attendances: { take: 30 },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const schoolProfile = await prisma.schoolProfile.findFirst();
    const activeTermId = termId
      ? String(termId)
      : (await prisma.term.findFirst({ where: { isCurrent: true } }))?.id || student.enrollments[0]?.termId;

    const grades = await prisma.grade.findMany({
      where: {
        studentId,
        termId: activeTermId,
      },
      include: {
        subject: true,
        component: true,
      },
    });

    const subjectMap: Record<string, { subject: any; totalScore: number; components: any[] }> = {};

    grades.forEach((g) => {
      if (!subjectMap[g.subjectId]) {
        subjectMap[g.subjectId] = {
          subject: g.subject,
          totalScore: 0,
          components: [],
        };
      }
      const weight = g.component.weightPercentage || 10;
      const max = g.component.maxScore || 100;
      const weightedScore = (g.score / max) * weight;

      subjectMap[g.subjectId].components.push({
        name: g.component.name,
        score: g.score,
        maxScore: max,
        weight,
        weightedScore: Math.round(weightedScore * 10) / 10,
      });
      subjectMap[g.subjectId].totalScore += weightedScore;
    });

    const subjectResults = Object.values(subjectMap).map((item) => {
      const waec = getWaecGrade(item.totalScore);
      return {
        subjectName: item.subject.name,
        subjectCode: item.subject.code,
        totalScore: Math.round(item.totalScore * 10) / 10,
        waecGrade: waec.grade,
        remark: waec.remark,
        components: item.components,
      };
    });

    const overallTotal = subjectResults.reduce((acc, curr) => acc + curr.totalScore, 0);
    const overallAverage = subjectResults.length > 0 ? Math.round((overallTotal / subjectResults.length) * 10) / 10 : 0;
    const overallWaec = getWaecGrade(overallAverage);

    const termResult = await prisma.termResult.findUnique({
      where: {
        studentId_termId: {
          studentId,
          termId: activeTermId,
        },
      },
    });

    res.json({
      schoolProfile,
      student: {
        id: student.id,
        studentId: student.studentId,
        fullName: student.user.fullName,
        photoUrl: student.user.avatarUrl,
        class: student.enrollments[0]?.stream.class.name,
        stream: student.enrollments[0]?.stream.name,
        formTeacher: student.enrollments[0]?.stream.formTeacher?.fullName || 'Ms. Abena Mensah',
        attendanceCount: student.attendances.length,
      },
      subjectResults,
      summary: {
        overallTotal,
        overallAverage,
        waecGrade: overallWaec.grade,
        positionInClass: termResult?.positionInClass || 1,
        formTeacherRemarks: termResult?.formTeacherRemarks || 'Exemplary basic education pupil.',
        headteacherRemarks: termResult?.headteacherRemarks || 'Promoted.',
        isUpdated: termResult?.isUpdated || false,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
