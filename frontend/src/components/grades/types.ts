export interface AssessmentComponent {
  id: string;
  classId: string;
  name: string;
  weightPercentage: number;
  maxScore: number;
}

export interface TeacherAllocation {
  id: string;
  streamId: string;
  subjectId: string;
  teacherId: string;
  stream: {
    id: string;
    name: string;
    classId: string;
    class: {
      id: string;
      name: string;
      code: string;
      level: string;
    };
  };
  subject: {
    id: string;
    name: string;
    code: string;
    category: string;
    description?: string | null;
  };
  teacher: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface StudentEnrollment {
  id: string;
  studentId: string;
  streamId: string;
  termId: string;
  rollNumber: number;
  student: {
    id: string;
    studentId: string;
    gender?: string;
    user: {
      id: string;
      fullName: string;
      avatarUrl?: string | null;
    };
  };
}

export interface RawGradeEntry {
  id?: string;
  studentId: string;
  streamId: string;
  termId: string;
  subjectId: string;
  componentId: string;
  score: number;
  maxScore: number;
}

export interface SubjectResultComponent {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  weightedScore: number;
}

export interface SubjectReportResult {
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  classScore: number; // 40%
  examScore: number;  // 60%
  totalScore: number; // 100%
  waecGrade: string;  // A1 to F9
  remark: string;
  gpa: number;
  components: SubjectResultComponent[];
}

export interface AttendanceSummary {
  totalSchoolDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
}

export interface ReportCardPayload {
  schoolProfile: {
    name: string;
    motto?: string;
    logoUrl?: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    region: string;
    city: string;
    currency: string;
  };
  student: {
    id: string;
    studentId: string;
    fullName: string;
    photoUrl?: string | null;
    class: string;
    stream: string;
    streamId?: string;
    formTeacher: string;
    rollNumber: number;
    gender?: string;
  };
  term: {
    id: string;
    label: string;
    academicYear: string;
    startDate?: string;
    endDate?: string;
  };
  attendance: AttendanceSummary;
  subjectResults: SubjectReportResult[];
  summary: {
    overallTotal: number;
    overallAverage: number;
    waecGrade: string;
    overallRemark: string;
    positionInClass: number;
    totalStudentsInStream: number;
    formTeacherRemarks: string;
    headteacherRemarks: string;
    isUpdated: boolean;
  };
}

// Ghana WAEC / GES 9-Point Grading Scale Reference
export const WAEC_GRADING_SCALE = [
  { grade: 'A1', min: 80, max: 100, remark: 'Excellent', color: 'bg-emerald-600 text-white', border: 'border-emerald-500' },
  { grade: 'B2', min: 75, max: 79, remark: 'Very Good', color: 'bg-teal-600 text-white', border: 'border-teal-500' },
  { grade: 'B3', min: 70, max: 74, remark: 'Good', color: 'bg-cyan-600 text-white', border: 'border-cyan-500' },
  { grade: 'C4', min: 65, max: 69, remark: 'Credit', color: 'bg-sky-600 text-white', border: 'border-sky-500' },
  { grade: 'C5', min: 60, max: 64, remark: 'Credit', color: 'bg-blue-600 text-white', border: 'border-blue-500' },
  { grade: 'C6', min: 55, max: 59, remark: 'Credit', color: 'bg-indigo-600 text-white', border: 'border-indigo-500' },
  { grade: 'D7', min: 50, max: 54, remark: 'Pass', color: 'bg-amber-600 text-white', border: 'border-amber-500' },
  { grade: 'E8', min: 45, max: 49, remark: 'Pass', color: 'bg-orange-600 text-white', border: 'border-orange-500' },
  { grade: 'F9', min: 0, max: 44, remark: 'Fail', color: 'bg-rose-600 text-white', border: 'border-rose-500' },
];

export const getWaecGrade = (score: number) => {
  const rounded = Math.round(score * 10) / 10;
  for (const item of WAEC_GRADING_SCALE) {
    if (rounded >= item.min) {
      return item;
    }
  }
  return WAEC_GRADING_SCALE[WAEC_GRADING_SCALE.length - 1];
};
