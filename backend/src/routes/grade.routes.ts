import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Helper to compute WAEC grade letter from total mark (0 - 100)
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

// GET /api/grades
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { streamId, termId, subjectId } = req.query;
    if (!streamId || !termId || !subjectId) {
      return res.status(400).json({ error: 'streamId, termId, and subjectId are required' });
    }

    const grades = await prisma.grade.findMany({
      where: {
        streamId: String(streamId),
        termId: String(termId),
        subjectId: String(subjectId),
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, fullName: true } },
          },
        },
        component: true,
      },
    });

    res.json({ grades });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/grades/batch (Teachers & Admins)
router.post('/batch', authenticateToken, authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.FORM_TEACHER), async (req: Request, res: Response) => {
  try {
    const { streamId, termId, subjectId, componentId, grades } = req.body;
    // grades: [{ studentId, score }]

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
        update: { score: g.score },
        create: {
          studentId: g.studentId,
          streamId,
          termId,
          subjectId,
          componentId,
          score: g.score,
        },
      });
    });

    await prisma.$transaction(operations);

    res.json({ message: `Batch updated ${grades.length} grades successfully` });
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
        formTeacher: student.enrollments[0]?.stream.formTeacher?.fullName || 'N/A',
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
