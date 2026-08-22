import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '../types';
import { getWaecGrade } from './grade.routes';

const router = Router();

// GET /api/reports/class-register (Printable Official Class Roster)
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
        formTeacher: { select: { fullName: true, email: true, phone: true } },
        enrollments: {
          include: {
            student: {
              include: {
                user: { select: { fullName: true, email: true, phone: true, avatarUrl: true } },
                guardians: {
                  include: {
                    guardian: {
                      include: { user: { select: { fullName: true, phone: true, email: true } } },
                    },
                  },
                },
              },
            },
          },
          orderBy: { rollNumber: 'asc' },
        },
      },
    });

    const schoolProfile = await prisma.schoolProfile.findFirst();

    res.json({ stream, schoolProfile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/broadsheet (Consolidated Class Broadsheet Matrix across all subjects)
router.get(
  '/broadsheet',
  authenticateToken,
  authorizeRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.FORM_TEACHER, Role.TEACHER),
  async (req: Request, res: Response) => {
    try {
      const { streamId, termId } = req.query;
      if (!streamId || !termId) {
        return res.status(400).json({ error: 'streamId and termId are required' });
      }

      const stream = await prisma.stream.findUnique({
        where: { id: String(streamId) },
        include: {
          class: true,
          formTeacher: { select: { fullName: true } },
        },
      });

      if (!stream) {
        return res.status(404).json({ error: 'Stream not found' });
      }

      const term = await prisma.term.findUnique({
        where: { id: String(termId) },
        include: { academicYear: true },
      });

      // Get all subjects taught in this stream
      const streamSubjectTeachers = await prisma.classSubjectTeacher.findMany({
        where: { streamId: String(streamId) },
        include: { subject: true, teacher: { select: { fullName: true } } },
        orderBy: { subject: { name: 'asc' } },
      });

      const subjects = streamSubjectTeachers.map((st) => ({
        id: st.subject.id,
        name: st.subject.name,
        code: st.subject.code,
        teacherName: st.teacher.fullName,
      }));

      // Get all enrolled students in the stream
      const enrollments = await prisma.enrollment.findMany({
        where: { streamId: String(streamId), termId: String(termId) },
        include: {
          student: {
            include: {
              user: { select: { fullName: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { rollNumber: 'asc' },
      });

      // Fetch all grades for this stream & term
      const grades = await prisma.grade.findMany({
        where: {
          streamId: String(streamId),
          termId: String(termId),
        },
        include: { component: true },
      });

      // Map raw grades to { [studentId]: { [subjectId]: weightedTotal } }
      const studentSubjectTotals: Record<string, Record<string, number>> = {};

      grades.forEach((g) => {
        if (!studentSubjectTotals[g.studentId]) {
          studentSubjectTotals[g.studentId] = {};
        }
        const weight = g.component.weightPercentage || 10;
        const max = g.component.maxScore || 100;
        const weightedScore = (g.score / max) * weight;

        studentSubjectTotals[g.studentId][g.subjectId] =
          (studentSubjectTotals[g.studentId][g.subjectId] || 0) + weightedScore;
      });

      // Fetch collated term results for positions
      const termResults = await prisma.termResult.findMany({
        where: { streamId: String(streamId), termId: String(termId) },
      });
      const termResultMap = new Map(termResults.map((tr) => [tr.studentId, tr]));

      // Build broadsheet student rows
      const studentRows = enrollments.map((en, idx) => {
        const studentId = en.studentId;
        const subjectScores: Record<string, { total: number; grade: string }> = {};

        let grandTotal = 0;
        let subjectsTakenCount = 0;

        subjects.forEach((sub) => {
          const rawTotal = studentSubjectTotals[studentId]?.[sub.id] || 0;
          const roundedTotal = Math.round(rawTotal * 10) / 10;
          const waec = getWaecGrade(roundedTotal);

          subjectScores[sub.id] = {
            total: roundedTotal,
            grade: roundedTotal > 0 ? waec.grade : '—',
          };

          if (roundedTotal > 0) {
            grandTotal += roundedTotal;
            subjectsTakenCount++;
          }
        });

        const overallAverage =
          subjectsTakenCount > 0 ? Math.round((grandTotal / subjectsTakenCount) * 10) / 10 : 0;
        const overallWaec = getWaecGrade(overallAverage);
        const termResult = termResultMap.get(studentId);

        return {
          rollNumber: en.rollNumber || idx + 1,
          studentId: en.student.studentId,
          fullName: en.student.user.fullName,
          subjectScores,
          grandTotal: Math.round(grandTotal * 10) / 10,
          average: overallAverage,
          overallGrade: overallWaec.grade,
          position: termResult?.positionInClass || idx + 1,
          remarks: termResult?.formTeacherRemarks || 'Good academic effort.',
        };
      });

      // Sort by position
      studentRows.sort((a, b) => a.position - b.position);

      const schoolProfile = await prisma.schoolProfile.findFirst();

      res.json({
        stream: {
          id: stream.id,
          name: stream.name,
          className: stream.class.name,
          formTeacher: stream.formTeacher?.fullName || 'Ms. Abena Mensah',
        },
        term: {
          id: term?.id,
          label: term?.termLabel,
          academicYear: term?.academicYear?.yearLabel,
        },
        subjects,
        studentRows,
        schoolProfile,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/reports/transcript/:studentId (Complete Student Cumulative Transcript)
router.get('/transcript/:studentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        termResults: {
          include: {
            term: { include: { academicYear: true } },
            stream: { include: { class: true } },
          },
          orderBy: { term: { startDate: 'asc' } },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const schoolProfile = await prisma.schoolProfile.findFirst();

    res.json({ student, schoolProfile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
