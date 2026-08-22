export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export type ViewMode = 'CLASS' | 'TEACHER' | 'ROOM' | 'MASTER' | 'PRINT';

export interface Subject {
  id: string;
  name: string;
  code: string;
  category: 'CORE' | 'ELECTIVE';
  description?: string | null;
}

export interface Teacher {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role?: string;
}

export interface Stream {
  id: string;
  name: string;
  classId: string;
  class: {
    id: string;
    name: string;
    code: string;
    level: string;
  };
  formTeacher?: Teacher | null;
  _count?: {
    enrollments: number;
  };
}

export interface TimetableSlot {
  id: string;
  streamId: string;
  stream: Stream;
  subjectId: string;
  subject: Subject;
  teacherId: string;
  teacher: Teacher;
  dayOfWeek: DayOfWeek;
  period: number;
  startTime: string;
  endTime: string;
  room?: string | null;
}

export interface PeriodDefinition {
  period: number;
  name: string;
  startTime: string;
  endTime: string;
  type: 'ACADEMIC' | 'BREAK' | 'ASSEMBLY';
}

export interface BreakDefinition {
  name: string;
  startTime: string;
  endTime: string;
  placement: 'BEFORE_P1' | 'AFTER_P3' | 'AFTER_P5' | 'AFTER_P8';
  type: 'DEVOTIONS' | 'SNACK' | 'LUNCH' | 'CLOSING';
}

export interface ConflictItem {
  id: string;
  type: 'TEACHER_COLLISION' | 'ROOM_COLLISION' | 'WORKLOAD_FATIGUE';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  teacherId?: string;
  teacherName?: string;
  room?: string;
  dayOfWeek: string;
  period?: number;
  timeRange?: string;
  conflictingSlots?: {
    slotId: string;
    streamId: string;
    streamName: string;
    subjectName: string;
    teacherName?: string;
    room?: string;
  }[];
  description: string;
}

export interface TeacherWorkload {
  teacher: Teacher;
  totalPeriods: number;
  freePeriods: number;
  utilizationPercentage: number;
  dailyDistribution: Record<string, number>;
  classesTaught: string[];
  subjectsTaught: string[];
  status: 'LIGHT' | 'OPTIMAL' | 'HEAVY';
}

export interface RoomUtilization {
  name: string;
  totalBookedPeriods: number;
  slots: {
    id: string;
    dayOfWeek: string;
    period: number;
    startTime: string;
    endTime: string;
    streamName: string;
    subjectName: string;
    teacherName: string;
  }[];
}

// Subject Theme Palette (Rich Ghana K-12 Styling)
export const SUBJECT_THEMES: Record<
  string,
  {
    bg: string;
    border: string;
    text: string;
    pillBg: string;
    pillText: string;
    iconColor: string;
    glow: string;
  }
> = {
  mathematics: {
    bg: 'bg-indigo-50/90 hover:bg-indigo-100/90 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800/60',
    text: 'text-indigo-950 dark:text-indigo-200',
    pillBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
    pillText: 'text-indigo-700 dark:text-indigo-300',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    glow: 'shadow-indigo-500/10',
  },
  english: {
    bg: 'bg-emerald-50/90 hover:bg-emerald-100/90 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    text: 'text-emerald-950 dark:text-emerald-200',
    pillBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
    pillText: 'text-emerald-700 dark:text-emerald-300',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    glow: 'shadow-emerald-500/10',
  },
  science: {
    bg: 'bg-cyan-50/90 hover:bg-cyan-100/90 dark:bg-cyan-950/40',
    border: 'border-cyan-200 dark:border-cyan-800/60',
    text: 'text-cyan-950 dark:text-cyan-200',
    pillBg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300',
    pillText: 'text-cyan-700 dark:text-cyan-300',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    glow: 'shadow-cyan-500/10',
  },
  social: {
    bg: 'bg-amber-50/90 hover:bg-amber-100/90 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800/60',
    text: 'text-amber-950 dark:text-amber-200',
    pillBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
    pillText: 'text-amber-800 dark:text-amber-300',
    iconColor: 'text-amber-600 dark:text-amber-400',
    glow: 'shadow-amber-500/10',
  },
  computing: {
    bg: 'bg-sky-50/90 hover:bg-sky-100/90 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800/60',
    text: 'text-sky-950 dark:text-sky-200',
    pillBg: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300',
    pillText: 'text-sky-700 dark:text-sky-300',
    iconColor: 'text-sky-600 dark:text-sky-400',
    glow: 'shadow-sky-500/10',
  },
  french: {
    bg: 'bg-rose-50/90 hover:bg-rose-100/90 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800/60',
    text: 'text-rose-950 dark:text-rose-200',
    pillBg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
    pillText: 'text-rose-700 dark:text-rose-300',
    iconColor: 'text-rose-600 dark:text-rose-400',
    glow: 'shadow-rose-500/10',
  },
  creative: {
    bg: 'bg-purple-50/90 hover:bg-purple-100/90 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800/60',
    text: 'text-purple-950 dark:text-purple-200',
    pillBg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
    pillText: 'text-purple-700 dark:text-purple-300',
    iconColor: 'text-purple-600 dark:text-purple-400',
    glow: 'shadow-purple-500/10',
  },
  rme: {
    bg: 'bg-teal-50/90 hover:bg-teal-100/90 dark:bg-teal-950/40',
    border: 'border-teal-200 dark:border-teal-800/60',
    text: 'text-teal-950 dark:text-teal-200',
    pillBg: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300',
    pillText: 'text-teal-700 dark:text-teal-300',
    iconColor: 'text-teal-600 dark:text-teal-400',
    glow: 'shadow-teal-500/10',
  },
  pe: {
    bg: 'bg-lime-50/90 hover:bg-lime-100/90 dark:bg-lime-950/40',
    border: 'border-lime-200 dark:border-lime-800/60',
    text: 'text-lime-950 dark:text-lime-200',
    pillBg: 'bg-lime-100 text-lime-800 dark:bg-lime-900/60 dark:text-lime-300',
    pillText: 'text-lime-800 dark:text-lime-300',
    iconColor: 'text-lime-600 dark:text-lime-400',
    glow: 'shadow-lime-500/10',
  },
  default: {
    bg: 'bg-slate-50/90 hover:bg-slate-100/90 dark:bg-slate-800/50',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'text-slate-900 dark:text-slate-200',
    pillBg: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    pillText: 'text-slate-700 dark:text-slate-300',
    iconColor: 'text-slate-500 dark:text-slate-400',
    glow: 'shadow-slate-500/10',
  },
};

export const getSubjectTheme = (subjectName: string = '') => {
  const norm = subjectName.toLowerCase();
  if (norm.includes('math')) return SUBJECT_THEMES.mathematics;
  if (norm.includes('english') || norm.includes('literature')) return SUBJECT_THEMES.english;
  if (norm.includes('science') || norm.includes('biology') || norm.includes('chemistry') || norm.includes('physics'))
    return SUBJECT_THEMES.science;
  if (norm.includes('social') || norm.includes('history') || norm.includes('geography'))
    return SUBJECT_THEMES.social;
  if (norm.includes('ict') || norm.includes('comput') || norm.includes('tech'))
    return SUBJECT_THEMES.computing;
  if (norm.includes('french') || norm.includes('twi') || norm.includes('ga') || norm.includes('language'))
    return SUBJECT_THEMES.french;
  if (norm.includes('art') || norm.includes('design') || norm.includes('music') || norm.includes('drama'))
    return SUBJECT_THEMES.creative;
  if (norm.includes('rme') || norm.includes('relig') || norm.includes('moral'))
    return SUBJECT_THEMES.rme;
  if (norm.includes('pe') || norm.includes('physic') || norm.includes('sport') || norm.includes('health'))
    return SUBJECT_THEMES.pe;
  return SUBJECT_THEMES.default;
};

export const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
