import React, { useState } from 'react';
import {
  Building2,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  TimetableSlot,
  RoomUtilization,
  DayOfWeek,
  DAYS,
  getSubjectTheme,
  ConflictItem,
} from './types';

interface RoomTimetableViewProps {
  rooms: RoomUtilization[];
  selectedRoom: string;
  onSelectRoom: (roomName: string) => void;
  allSlots: TimetableSlot[];
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

export const RoomTimetableView: React.FC<RoomTimetableViewProps> = ({
  rooms,
  selectedRoom,
  onSelectRoom,
  allSlots,
  conflicts,
  onSlotClick,
}) => {
  const currentRoomName = selectedRoom || rooms[0]?.name || 'Science Lab 1';

  // Find all slots booked in this room (case-insensitive trim match)
  const roomSlots = allSlots.filter(
    (s) => s.room && s.room.trim().toLowerCase() === currentRoomName.trim().toLowerCase()
  );

  const slotMap = React.useMemo(() => {
    const map = new Map<string, TimetableSlot[]>();
    roomSlots.forEach((s) => {
      const key = `${s.dayOfWeek}_${s.period}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [roomSlots]);

  const roomConflicts = conflicts.filter(
    (c) => c.type === 'ROOM_COLLISION' && c.room?.toLowerCase() === currentRoomName.toLowerCase()
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card: Room Selector & Utilization Metrics */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Facility / Shared Lab View:
            </label>
            <select
              value={currentRoomName}
              onChange={(e) => onSelectRoom(e.target.value)}
              className="p-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 min-w-[220px]"
            >
              {rooms.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name} ({allSlots.filter((s) => s.room === r.name).length} periods booked)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Booked Periods</span>
            <div className="text-sm font-black text-slate-900 dark:text-white">
              {roomSlots.length} / 40 ({Math.round((roomSlots.length / 40) * 100)}%)
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">Available Slots</span>
            <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">
              {40 - roomSlots.length} Periods Free
            </div>
          </div>
        </div>
      </div>

      {/* Room Weekly Grid */}
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
                      {roomSlots.filter((s) => s.dayOfWeek === day).length} Classes Scheduled
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {PERIODS.map((pDef) => (
                <tr key={pDef.period} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 align-middle">
                    <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                      {pDef.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {pDef.startTime} - {pDef.endTime}
                    </div>
                  </td>

                  {DAYS.map((day) => {
                    const matched = slotMap.get(`${day}_${pDef.period}`) || [];
                    const isDoubleBooked = matched.length > 1;

                    return (
                      <td
                        key={`${day}_${pDef.period}`}
                        className="p-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0 align-top h-24 w-[17.5%]"
                      >
                        {matched.length === 0 ? (
                          <div className="h-full min-h-[76px] rounded-2xl bg-emerald-50/20 dark:bg-emerald-950/10 border border-dashed border-emerald-200/50 dark:border-emerald-800/40 flex flex-col items-center justify-center p-2 text-center">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              Facility Vacant
                            </span>
                            <span className="text-[9px] text-slate-400">Open for booking</span>
                          </div>
                        ) : (
                          <div className="space-y-1.5 h-full">
                            {matched.map((s) => {
                              const theme = getSubjectTheme(s.subject?.name);
                              return (
                                <div
                                  key={s.id}
                                  onClick={() => onSlotClick && onSlotClick(s)}
                                  className={`p-2.5 rounded-2xl border transition ${theme.bg} ${
                                    isDoubleBooked
                                      ? 'border-rose-400 ring-2 ring-rose-400/40 bg-rose-50'
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
                                  <div className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400 mt-1">
                                    <User className="w-2.5 h-2.5" />
                                    <span className="truncate">{s.teacher?.fullName}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
