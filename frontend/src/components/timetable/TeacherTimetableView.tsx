import React, { useState } from 'react';
import {
  User,
  Clock,
  Building2,
  Calendar,
  Sparkles,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import {
  TimetableSlot,
  Teacher,
  TeacherWorkload,
  DayOfWeek,
  DAYS,
  getSubjectTheme,
  ConflictItem,
} from './types';

interface TeacherTimetableViewProps {
  teachers: Teacher[];
  selectedTeacherId: string;
  onSelectTeacher: (teacherId: string) => void;
  allSlots: TimetableSlot[];
  workloads: TeacherWorkload[];
  conflicts: ConflictItem[];
  canEdit: boolean;
  onSlotClick?: (slot: TimetableSlot) => void;
}

const PERIODS = [
  { period: 1, name: 'Period 1', startTime: '08:00', endTime: '08:45' },
  { period: 2, name: 'Period 2', startTime: '08:45', endTime: '09:30' },
  { period: 3, name: 'Period 3', startTime: '09:30', endTime: '10:15' },
  { period: 4, name: 'Period 4', startTime: '10:45', endTime: '11:30' },
  { period: 5, name: 'Period 5', startTime: '11:30', endTime: '12:15' },
  { period: 6, name: 'Period 6', startTime: '13:00', endTime: '13:45' },
  { period: 7, name: 'Period 7', startTime: '13:45', endTime: '14:30' },
  { period: 8, name: 'Period 8', startTime: '14:30', endTime: '15:15' },
];

export const TeacherTimetableView: React.FC<TeacherTimetableViewProps> = ({
  teachers,
  selectedTeacherId,
  onSelectTeacher,
  allSlots,
  workloads,
  conflicts,
  canEdit,
  onSlotClick,
}) => {
  const currentTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];
  const teacherSlots = allSlots.filter((s) => s.teacherId === currentTeacher?.id);
  const currentWorkload = workloads.find((w) => w.teacher.id === currentTeacher?.id);

  // Map slots: `${day}_${period}` -> array of slots (array to handle if teacher has a double booking!)
  const slotMap = React.useMemo(() => {
    const map = new Map<string, TimetableSlot[]>();
    teacherSlots.forEach((s) => {
      const key = `${s.dayOfWeek}_${s.period}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [teacherSlots]);

  const teacherConflicts = conflicts.filter(
    (c) => c.teacherId === currentTeacher?.id || c.conflictingSlots?.some((cs) => cs.teacherName === currentTeacher?.fullName)
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card: Teacher Selector & Workload Metrics */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Teacher Profile & Dropdown */}
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <img
            src={currentTeacher?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'}
            alt={currentTeacher?.fullName}
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/30 shrink-0"
          />
          <div className="space-y-1 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Active Teacher Schedule:
              </label>
              {teacherConflicts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                  {teacherConflicts.length} Conflict{teacherConflicts.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <select
              value={currentTeacher?.id || ''}
              onChange={(e) => onSelectTeacher(e.target.value)}
              className="p-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 max-w-xs"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({allSlots.filter((s) => s.teacherId === t.id).length} periods/wk)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Workload Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
          {/* Total Teaching Periods */}
          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Teaching Load</span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {teacherSlots.length} <span className="text-xs font-semibold text-slate-400">/ 40</span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              {Math.round((teacherSlots.length / 40) * 100)}% Utilization
            </span>
          </div>

          {/* Free Planning Periods */}
          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Free / Prep</span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {40 - teacherSlots.length} <span className="text-xs font-semibold text-slate-400">periods</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Planning & Office</span>
          </div>

          {/* Classes Taught */}
          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Classes</span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {currentWorkload?.classesTaught.length || new Set(teacherSlots.map((s) => s.streamId)).size}
            </div>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold truncate block">
              {currentWorkload?.classesTaught.join(', ') || 'Streams'}
            </span>
          </div>

          {/* Subjects */}
          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Subjects</span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {currentWorkload?.subjectsTaught.length || new Set(teacherSlots.map((s) => s.subjectId)).size}
            </div>
            <span className="text-[10px] text-slate-500 font-medium truncate block">
              {currentWorkload?.subjectsTaught.join(', ') || 'Subjects'}
            </span>
          </div>
        </div>

      </div>

      {/* Teacher Weekly Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <th className="p-3 text-xs font-black uppercase tracking-wider w-36 border-r border-slate-200 dark:border-slate-800 text-center">
                  Period / Time
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="p-3 text-center text-xs font-extrabold uppercase tracking-wide border-r border-slate-200 dark:border-slate-800 last:border-r-0"
                  >
                    <span className="text-slate-900 dark:text-white">{day}</span>
                    <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 normal-case">
                      {teacherSlots.filter((s) => s.dayOfWeek === day).length} Teaching Periods
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {PERIODS.map((pDef, idx) => (
                <React.Fragment key={pDef.period}>
                  {/* Insert Snack Break after P3 */}
                  {idx === 3 && (
                    <tr className="bg-emerald-50/50 dark:bg-emerald-950/20 border-y border-emerald-200/50 dark:border-emerald-900/30 text-center">
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-[10px] font-bold text-emerald-800 dark:text-emerald-400">
                        10:15 - 10:45
                      </td>
                      <td colSpan={5} className="p-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">
                        ☕ Faculty & Staff Snack Recess (30 mins)
                      </td>
                    </tr>
                  )}

                  {/* Insert Lunch Break after P5 */}
                  {idx === 5 && (
                    <tr className="bg-sky-50/50 dark:bg-sky-950/20 border-y border-sky-200/50 dark:border-sky-900/30 text-center">
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-[10px] font-bold text-sky-800 dark:text-sky-400">
                        12:15 - 13:00
                      </td>
                      <td colSpan={5} className="p-1.5 font-bold text-sky-800 dark:text-sky-300 text-[11px]">
                        🍽️ Midday Lunch Break (45 mins)
                      </td>
                    </tr>
                  )}

                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Period Header */}
                    <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 align-middle">
                      <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                        {pDef.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {pDef.startTime} - {pDef.endTime}
                      </div>
                    </td>

                    {/* Day Cells */}
                    {DAYS.map((day) => {
                      const matched = slotMap.get(`${day}_${pDef.period}`) || [];
                      const isDoubleBooked = matched.length > 1;

                      return (
                        <td
                          key={`${day}_${pDef.period}`}
                          className="p-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0 align-top h-24 w-[17.5%]"
                        >
                          {matched.length === 0 ? (
                            <div className="h-full min-h-[80px] rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/60 flex flex-col items-center justify-center p-2 text-center">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                Free Period
                              </span>
                              <span className="text-[9px] text-slate-300 dark:text-slate-600">
                                Planning / Marking
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1.5 h-full">
                              {matched.map((s) => {
                                const theme = getSubjectTheme(s.subject?.name);
                                return (
                                  <div
                                    key={s.id}
                                    onClick={() => onSlotClick && onSlotClick(s)}
                                    className={`p-2 rounded-2xl border transition ${theme.bg} ${
                                      isDoubleBooked
                                        ? 'border-amber-400 ring-2 ring-amber-400/40 bg-amber-50'
                                        : `${theme.border}`
                                    } ${onSlotClick ? 'cursor-pointer hover:shadow-md' : ''}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-extrabold text-slate-900 dark:text-white text-xs truncate">
                                        {s.stream?.class?.name} {s.stream?.name}
                                      </span>
                                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${theme.pillBg}`}>
                                        {s.subject?.code}
                                      </span>
                                    </div>
                                    <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                                      {s.subject?.name}
                                    </div>
                                    {s.room && (
                                      <div className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400 mt-1">
                                        <Building2 className="w-2.5 h-2.5" />
                                        <span className="truncate">{s.room}</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
