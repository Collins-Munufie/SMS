import React, { useState } from 'react';
import {
  Clock,
  User,
  Building2,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Sparkles,
  Coffee,
  Utensils,
  Sun,
  ShieldAlert,
  Layers,
  Copy,
} from 'lucide-react';
import {
  TimetableSlot,
  DayOfWeek,
  DAYS,
  getSubjectTheme,
  ConflictItem,
} from './types';

interface TimetableGridProps {
  slots: TimetableSlot[];
  allSlots: TimetableSlot[];
  conflicts: ConflictItem[];
  canEdit: boolean;
  onSlotClick: (day: DayOfWeek, period: number, existingSlot: TimetableSlot | null) => void;
  onDeleteSlot: (slotId: string) => void;
  onDuplicateSlot?: (slot: TimetableSlot, targetDay: DayOfWeek) => void;
  streamName?: string;
}

interface PeriodConfig {
  period: number;
  name: string;
  startTime: string;
  endTime: string;
}

const PERIODS: PeriodConfig[] = [
  { period: 1, name: 'Period 1', startTime: '08:00', endTime: '08:45' },
  { period: 2, name: 'Period 2', startTime: '08:45', endTime: '09:30' },
  { period: 3, name: 'Period 3', startTime: '09:30', endTime: '10:15' },
  { period: 4, name: 'Period 4', startTime: '10:45', endTime: '11:30' },
  { period: 5, name: 'Period 5', startTime: '11:30', endTime: '12:15' },
  { period: 6, name: 'Period 6', startTime: '13:00', endTime: '13:45' },
  { period: 7, name: 'Period 7', startTime: '13:45', endTime: '14:30' },
  { period: 8, name: 'Period 8', startTime: '14:30', endTime: '15:15' },
];

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  slots,
  allSlots,
  conflicts,
  canEdit,
  onSlotClick,
  onDeleteSlot,
  onDuplicateSlot,
  streamName,
}) => {
  const [selectedMobileDay, setSelectedMobileDay] = useState<DayOfWeek>('MONDAY');
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);

  // Map slots for easy O(1) lookup: key = `${day}_${period}`
  const slotMap = React.useMemo(() => {
    const map = new Map<string, TimetableSlot>();
    slots.forEach((s) => {
      map.set(`${s.dayOfWeek}_${s.period}`, s);
    });
    return map;
  }, [slots]);

  // Check if a specific slot is in conflict
  const getSlotConflict = (slot: TimetableSlot | undefined) => {
    if (!slot) return null;
    return conflicts.find((c) =>
      c.conflictingSlots?.some((cs) => cs.slotId === slot.id)
    );
  };

  return (
    <div className="space-y-4">
      {/* Mobile Day Switcher Tabs */}
      <div className="flex sm:hidden items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto w-full">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedMobileDay(day)}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-extrabold text-center transition ${
                selectedMobileDay === day
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Timetable Matrix Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[850px]">
            {/* Table Header: Days of Week */}
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <th className="p-3.5 text-xs font-black uppercase tracking-wider w-36 border-r border-slate-200 dark:border-slate-800 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Period / Time</span>
                  </div>
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="p-3.5 text-center text-xs font-extrabold uppercase tracking-wide border-r border-slate-200 dark:border-slate-800 last:border-r-0"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-slate-900 dark:text-white">{day}</span>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 normal-case">
                        {slots.filter((s) => s.dayOfWeek === day).length} / 8 Scheduled
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {/* 1. MORNING ASSEMBLY & DEVOTIONS BANNER */}
              <tr className="bg-amber-50/60 dark:bg-amber-950/20 border-y border-amber-200/70 dark:border-amber-900/40">
                <td className="p-2.5 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-[11px] text-amber-900 dark:text-amber-400">
                  <div className="flex items-center justify-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>07:30 - 08:00</span>
                  </div>
                </td>
                <td colSpan={5} className="p-2 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/90 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 text-xs font-extrabold tracking-wide shadow-2xs">
                    <Sun className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Morning Devotions, National Anthem & Roll Call Registration</span>
                  </div>
                </td>
              </tr>

              {/* 2. ACADEMIC PERIODS 1, 2, 3 */}
              {PERIODS.slice(0, 3).map((pDef) => (
                <tr key={pDef.period} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  {/* Period Time Header */}
                  <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 align-middle">
                    <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                      {pDef.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {pDef.startTime} - {pDef.endTime}
                    </div>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      45 mins
                    </span>
                  </td>

                  {/* Day Slots */}
                  {DAYS.map((day) => {
                    const slotKey = `${day}_${pDef.period}`;
                    const slot = slotMap.get(slotKey);
                    const conflict = getSlotConflict(slot);

                    return (
                      <td
                        key={slotKey}
                        className="p-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0 align-top h-28 w-[17.5%]"
                      >
                        <SlotCard
                          slot={slot}
                          conflict={conflict}
                          day={day}
                          period={pDef.period}
                          canEdit={canEdit}
                          onSlotClick={() => onSlotClick(day, pDef.period, slot || null)}
                          onDelete={() => slot && onDeleteSlot(slot.id)}
                          onDuplicate={(targetDay) => slot && onDuplicateSlot && onDuplicateSlot(slot, targetDay)}
                          isHovered={hoveredSlotId === slot?.id}
                          onHover={(isHov) => setHoveredSlotId(isHov && slot ? slot.id : null)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* 3. SNACK & RECESS BREAK BANNER */}
              <tr className="bg-emerald-50/60 dark:bg-emerald-950/20 border-y border-emerald-200/70 dark:border-emerald-900/40">
                <td className="p-2.5 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-[11px] text-emerald-900 dark:text-emerald-400">
                  <div className="flex items-center justify-center gap-1">
                    <Coffee className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>10:15 - 10:45</span>
                  </div>
                </td>
                <td colSpan={5} className="p-2 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/90 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 text-xs font-extrabold tracking-wide shadow-2xs">
                    <Coffee className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Snack Break & Recess (30 Minutes)</span>
                  </div>
                </td>
              </tr>

              {/* 4. ACADEMIC PERIODS 4, 5 */}
              {PERIODS.slice(3, 5).map((pDef) => (
                <tr key={pDef.period} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  {/* Period Time Header */}
                  <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 align-middle">
                    <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                      {pDef.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {pDef.startTime} - {pDef.endTime}
                    </div>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      45 mins
                    </span>
                  </td>

                  {/* Day Slots */}
                  {DAYS.map((day) => {
                    const slotKey = `${day}_${pDef.period}`;
                    const slot = slotMap.get(slotKey);
                    const conflict = getSlotConflict(slot);

                    return (
                      <td
                        key={slotKey}
                        className="p-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0 align-top h-28 w-[17.5%]"
                      >
                        <SlotCard
                          slot={slot}
                          conflict={conflict}
                          day={day}
                          period={pDef.period}
                          canEdit={canEdit}
                          onSlotClick={() => onSlotClick(day, pDef.period, slot || null)}
                          onDelete={() => slot && onDeleteSlot(slot.id)}
                          onDuplicate={(targetDay) => slot && onDuplicateSlot && onDuplicateSlot(slot, targetDay)}
                          isHovered={hoveredSlotId === slot?.id}
                          onHover={(isHov) => setHoveredSlotId(isHov && slot ? slot.id : null)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* 5. LUNCH & MIDDAY RECREATION BANNER */}
              <tr className="bg-sky-50/60 dark:bg-sky-950/20 border-y border-sky-200/70 dark:border-sky-900/40">
                <td className="p-2.5 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-[11px] text-sky-900 dark:text-sky-400">
                  <div className="flex items-center justify-center gap-1">
                    <Utensils className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>12:15 - 13:00</span>
                  </div>
                </td>
                <td colSpan={5} className="p-2 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100/90 dark:bg-sky-900/50 text-sky-900 dark:text-sky-200 text-xs font-extrabold tracking-wide shadow-2xs">
                    <Utensils className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Midday Dining & Canteen Lunch (45 Minutes)</span>
                  </div>
                </td>
              </tr>

              {/* 6. ACADEMIC PERIODS 6, 7, 8 */}
              {PERIODS.slice(5, 8).map((pDef) => (
                <tr key={pDef.period} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  {/* Period Time Header */}
                  <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 align-middle">
                    <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                      {pDef.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {pDef.startTime} - {pDef.endTime}
                    </div>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      45 mins
                    </span>
                  </td>

                  {/* Day Slots */}
                  {DAYS.map((day) => {
                    const slotKey = `${day}_${pDef.period}`;
                    const slot = slotMap.get(slotKey);
                    const conflict = getSlotConflict(slot);

                    return (
                      <td
                        key={slotKey}
                        className="p-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0 align-top h-28 w-[17.5%]"
                      >
                        <SlotCard
                          slot={slot}
                          conflict={conflict}
                          day={day}
                          period={pDef.period}
                          canEdit={canEdit}
                          onSlotClick={() => onSlotClick(day, pDef.period, slot || null)}
                          onDelete={() => slot && onDeleteSlot(slot.id)}
                          onDuplicate={(targetDay) => slot && onDuplicateSlot && onDuplicateSlot(slot, targetDay)}
                          isHovered={hoveredSlotId === slot?.id}
                          onHover={(isHov) => setHoveredSlotId(isHov && slot ? slot.id : null)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* 7. CLOSING / EXTRA-CURRICULAR BANNER */}
              <tr className="bg-purple-50/60 dark:bg-purple-950/20 border-t border-purple-200/70 dark:border-purple-900/40">
                <td className="p-2.5 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-[11px] text-purple-900 dark:text-purple-400">
                  <div className="flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>15:15 - 16:00</span>
                  </div>
                </td>
                <td colSpan={5} className="p-2 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/90 dark:bg-purple-900/50 text-purple-900 dark:text-purple-200 text-xs font-extrabold tracking-wide shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Clubs, Sports, Library Study & Closing Assembly</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Subcomponent: SlotCard (Single Cell in Matrix)
// ----------------------------------------------------
interface SlotCardProps {
  slot: TimetableSlot | undefined;
  conflict: ConflictItem | null | undefined;
  day: DayOfWeek;
  period: number;
  canEdit: boolean;
  onSlotClick: () => void;
  onDelete: () => void;
  onDuplicate: (targetDay: DayOfWeek) => void;
  isHovered: boolean;
  onHover: (isHov: boolean) => void;
}

const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  conflict,
  day,
  period,
  canEdit,
  onSlotClick,
  onDelete,
  isHovered,
  onHover,
}) => {
  if (!slot) {
    return (
      <div
        onClick={canEdit ? onSlotClick : undefined}
        className={`h-full min-h-[92px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center p-2 text-center transition-all group ${
          canEdit
            ? 'cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'
            : 'opacity-60'
        }`}
      >
        <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-1 transition">
          {canEdit ? (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Assign</span>
            </>
          ) : (
            <span className="text-slate-300 dark:text-slate-600">Free Period</span>
          )}
        </span>
      </div>
    );
  }

  const theme = getSubjectTheme(slot.subject?.name);

  return (
    <div
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={canEdit ? onSlotClick : undefined}
      className={`relative h-full min-h-[92px] rounded-2xl border p-2.5 flex flex-col justify-between transition-all group ${
        theme.bg
      } ${
        conflict
          ? 'border-amber-400 ring-2 ring-amber-400/30 animate-pulse bg-amber-50/90'
          : `${theme.border} ${theme.glow}`
      } ${canEdit ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''}`}
    >
      {/* Top Row: Subject & Conflict Flag */}
      <div>
        <div className="flex items-start justify-between gap-1">
          <span className="font-extrabold text-slate-900 dark:text-white text-xs leading-tight line-clamp-1">
            {slot.subject?.name}
          </span>
          {conflict && (
            <span
              title={conflict.description}
              className="p-0.5 rounded bg-amber-500 text-slate-950 font-black shrink-0 animate-bounce"
            >
              <ShieldAlert className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Category Pill / Code */}
        <div className="flex items-center gap-1 mt-1">
          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${theme.pillBg}`}>
            {slot.subject?.code || 'SUB'}
          </span>
          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
            {slot.startTime} - {slot.endTime}
          </span>
        </div>
      </div>

      {/* Bottom Row: Teacher & Room */}
      <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400">
        <span className="flex items-center gap-1 font-semibold truncate max-w-[65%]" title={slot.teacher?.fullName}>
          <User className="w-3 h-3 shrink-0 text-slate-400" />
          <span className="truncate">{slot.teacher?.fullName?.split(' ')[1] || slot.teacher?.fullName}</span>
        </span>

        {slot.room && (
          <span
            className="flex items-center gap-0.5 px-1 py-0.2 rounded bg-white/70 dark:bg-slate-800 text-[9px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700 truncate max-w-[35%]"
            title={slot.room}
          >
            <Building2 className="w-2.5 h-2.5 shrink-0 text-slate-400" />
            <span className="truncate">{slot.room.replace('JHS Block Room ', 'R').replace('Science Lab ', 'Lab ')}</span>
          </span>
        )}
      </div>

      {/* Quick Action Overlay on Hover (Edit, Delete) */}
      {canEdit && (
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs p-1 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSlotClick();
            }}
            title="Edit Slot"
            className="p-1 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Remove Slot"
            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
