import React, { useState } from 'react';
import {
  LayoutGrid,
  Calendar,
  Clock,
  User,
  Building2,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  TimetableSlot,
  Stream,
  DayOfWeek,
  DAYS,
  getSubjectTheme,
  ConflictItem,
} from './types';

interface MasterMatrixViewProps {
  streams: Stream[];
  allSlots: TimetableSlot[];
  conflicts: ConflictItem[];
  canEdit: boolean;
  onSlotClick?: (streamId: string, day: DayOfWeek, period: number, slot: TimetableSlot | null) => void;
}

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export const MasterMatrixView: React.FC<MasterMatrixViewProps> = ({
  streams,
  allSlots,
  conflicts,
  canEdit,
  onSlotClick,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY');

  // Filter slots for selected day
  const daySlots = allSlots.filter((s) => s.dayOfWeek === selectedDay);

  // Map: `${streamId}_P${period}` -> slot
  const slotMap = React.useMemo(() => {
    const map = new Map<string, TimetableSlot>();
    daySlots.forEach((s) => {
      map.set(`${s.streamId}_P${s.period}`, s);
    });
    return map;
  }, [daySlots]);

  return (
    <div className="space-y-4">
      {/* Day Selector Ribbon & Legend */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
              School Master Board (All Streams)
            </h3>
            <p className="text-[11px] text-slate-400">
              Real-time multi-class schedule matrix for {selectedDay}
            </p>
          </div>
        </div>

        {/* Day Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedDay === day
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <th className="p-3 text-xs font-black uppercase tracking-wider w-40 border-r border-slate-200 dark:border-slate-800 text-left">
                  Class & Stream
                </th>
                {PERIODS.map((p) => (
                  <th
                    key={p}
                    className="p-3 text-center text-xs font-extrabold uppercase tracking-wide border-r border-slate-200 dark:border-slate-800 last:border-r-0"
                  >
                    <div>Period {p}</div>
                    <div className="text-[9px] font-medium text-slate-400 normal-case">
                      {p === 1
                        ? '08:00'
                        : p === 2
                        ? '08:45'
                        : p === 3
                        ? '09:30'
                        : p === 4
                        ? '10:45'
                        : p === 5
                        ? '11:30'
                        : p === 6
                        ? '13:00'
                        : p === 7
                        ? '13:45'
                        : '14:30'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {streams.map((stream) => {
                const streamLabel = `${stream.class?.name} ${stream.name}`;

                return (
                  <tr key={stream.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition">
                    {/* Stream Row Header */}
                    <td className="p-3 border-r border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/30 font-bold text-slate-900 dark:text-white">
                      <div className="text-xs font-black">{streamLabel}</div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {stream.formTeacher?.fullName || 'No Form Teacher'}
                      </div>
                    </td>

                    {/* Periods for this Stream */}
                    {PERIODS.map((period) => {
                      const slot = slotMap.get(`${stream.id}_P${period}`);
                      const theme = getSubjectTheme(slot?.subject?.name);

                      return (
                        <td
                          key={period}
                          className="p-1.5 border-r border-slate-200 dark:border-slate-800 last:border-r-0 align-top h-16 w-[10.5%]"
                        >
                          {slot ? (
                            <div
                              onClick={() => onSlotClick && onSlotClick(stream.id, selectedDay, period, slot)}
                              className={`h-full p-1.5 rounded-xl border text-[10px] transition flex flex-col justify-between ${
                                theme.bg
                              } ${theme.border} ${onSlotClick ? 'cursor-pointer hover:shadow-sm' : ''}`}
                            >
                              <div className="font-extrabold text-slate-900 dark:text-white truncate">
                                {slot.subject?.name}
                              </div>
                              <div className="flex items-center justify-between text-[9px] text-slate-600 dark:text-slate-400 mt-0.5">
                                <span className="truncate max-w-[60%]">
                                  {slot.teacher?.fullName?.split(' ')[1] || slot.teacher?.fullName}
                                </span>
                                {slot.room && (
                                  <span className="text-[8px] font-bold px-1 rounded bg-white/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    {slot.room.replace('JHS Block Room ', 'R').replace('Science Lab ', 'Lab ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() =>
                                canEdit && onSlotClick && onSlotClick(stream.id, selectedDay, period, null)
                              }
                              className={`h-full min-h-[52px] rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-[9px] text-slate-300 dark:text-slate-600 ${
                                canEdit ? 'cursor-pointer hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20' : ''
                              }`}
                            >
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
