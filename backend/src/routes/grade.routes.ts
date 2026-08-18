import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
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

// POST /api/grades/components (Configure assessment components)
router.post('/components', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN), async (req: Request, res: Response) => {
  try {
    const { classId, name, weightPercentage } = req.body;
    if (!classId || !name || weightPercentage === undefined) {
      return res.status(400).json({ error: 'classId, name, and weightPercentage are required' });
    }

    const component = await prisma.assessmentComponent.create({
      data: {
        classId,
        name,
        weightPercentage: Number(weightPercentage),
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
      where: {
        streamId: String(streamId),
        termId: String(termId),
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, fullName: true } },
          },
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

// POST /api/grades/batch (Batch Grade Entry)
router.post('/batch', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.FORM_TEACHER), async (req: Request, res: Response) => {
  try {
    const { streamId, termId, subjectId, componentId, grades } = req.body;

    if (!streamId || !termId || !subjectId || !componentId || !Array.isArray(grades)) {
      return res.status(400).json({ error: 'Invalid batch grade input payload' });
    }

    const operations = grades.map((g: { studentId: string; score: number }) => {
      return prisma.grade.upsert({
        where: {
          studentId_termId_subjectId_componentId: {
            studentId: g.studentId,
            termId,
            subjectId,
            componentId,
          },
        },
        update: { score: Number(g.score) },
        create: {
          studentId: g.studentId,
          streamId,
          termId,
          subjectId,
          componentId,
          score: Number(g.score),
        },
      });
    });

    await prisma.$transaction(operations);

    res.json({ message: `Successfully saved ${grades.length} student scores` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/grades/compute-ranks (Compute Position in Class & Term Summaries)
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

      // Group by subject
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

    // Rank students by averageScore descending
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
        },
        create: {
          studentId: item.studentId,
          streamId,
          termId,
          totalScore: item.totalScore,
          averageScore: item.averageScore,
          waecGrade: item.waecGrade,
          positionInClass,
          formTeacherRemarks: 'Satisfactory academic performance and good conduct.',
          headteacherRemarks: 'Promoted to next grade.',
        },
      });
    });

    await prisma.$transaction(upsertOps);

    res.json({
      message: `Computed position ranks for ${studentScores.length} students in stream`,
      ranks: studentScores,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/grades/remarks (Save Form Teacher / Headteacher Remarks)
router.post('/remarks', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.FORM_TEACHER), async (req: Request, res: Response) => {
  try {
    const { studentId, termId, formTeacherRemarks, headteacherRemarks } = req.body;

    const termResult = await prisma.termResult.update({
      where: {
        studentId_termId: {
          studentId,
          termId,
        },
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

// GET /api/grades/report-card/:studentId (Branded Report Card Generator Data)
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

    // Group grades by subject
    const subjectMap: Record<string, { subject: any; totalScore: number; components: any[] }> = {};

    grades.forEach((g) => {
      if (!subjectMap[g.subjectId]) {
        subjectMap[g.subjectId] = {
          subject: g.subject,
          totalScore: 0,
          components: [],
        };
      }
      subjectMap[g.subjectId].components.push({
        name: g.component.name,
        score: g.score,
        weight: g.component.weightPercentage,
      });
      subjectMap[g.subjectId].totalScore += g.score;
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
        formTeacherRemarks: termResult?.formTeacherRemarks || 'Exemplary academic effort and character.',
        headteacherRemarks: termResult?.headteacherRemarks || 'Promoted to next class.',
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
