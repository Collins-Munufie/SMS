import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  User,
  Building2,
  BookOpen,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { TimetableSlot, Subject, Teacher, DayOfWeek, DAYS } from './types';

interface SlotEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: TimetableSlot | null;
  streamId: string;
  streamName?: string;
  initialDay?: DayOfWeek;
  initialPeriod?: number;
  subjects: Subject[];
  teachers: Teacher[];
  allSlots: TimetableSlot[];
  onSave: (slotData: {
    streamId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: DayOfWeek;
    period: number;
    startTime: string;
    endTime: string;
    room?: string;
    forceOverride?: boolean;
  }) => Promise<void>;
  onDelete?: (slotId: string) => Promise<void>;
  canEdit: boolean;
}

const DEFAULT_BELL_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '08:00', end: '08:45' },
  2: { start: '08:45', end: '09:30' },
  3: { start: '09:30', end: '10:15' },
  4: { start: '10:45', end: '11:30' },
  5: { start: '11:30', end: '12:15' },
  6: { start: '13:00', end: '13:45' },
  7: { start: '13:45', end: '14:30' },
  8: { start: '14:30', end: '15:15' },
};

const COMMON_ROOMS = [
  'JHS Block Room 7A',
  'JHS Block Room 7B',
  'JHS Block Room 8A',
  'JHS Block Room 9A',
  'Science Lab 1',
  'Science Lab 2',
  'ICT Computer Lab',
  'Library Media Room',
  'Creative Arts Studio',
  'Primary Block B1',
  'Primary Block B4',
  'Primary Block B6',
  'Sports & Football Pitch',
];

export const SlotEditModal: React.FC<SlotEditModalProps> = ({
  isOpen,
  onClose,
  slot,
  streamId,
  streamName,
  initialDay = 'MONDAY',
  initialPeriod = 1,
  subjects,
  teachers,
  allSlots,
  onSave,
  onDelete,
  canEdit,
}) => {
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(initialDay);
  const [period, setPeriod] = useState<number>(initialPeriod);
  const [subjectId, setSubjectId] = useState<string>('');
  const [teacherId, setTeacherId] = useState<string>('');
  const [room, setRoom] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('08:45');
  const [forceOverride, setForceOverride] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state on slot/initial props change
  useEffect(() => {
    if (slot) {
      setDayOfWeek(slot.dayOfWeek);
      setPeriod(slot.period);
      setSubjectId(slot.subjectId);
      setTeacherId(slot.teacherId);
      setRoom(slot.room || '');
      setStartTime(slot.startTime);
      setEndTime(slot.endTime);
      setForceOverride(false);
      setErrorMessage(null);
    } else {
      const p = initialPeriod || 1;
      const d = initialDay || 'MONDAY';
      setDayOfWeek(d);
      setPeriod(p);
      setSubjectId(subjects[0]?.id || '');
      setTeacherId(teachers[0]?.id || '');
      setRoom(streamName ? `${streamName} Room` : 'Classroom');
      setStartTime(DEFAULT_BELL_TIMES[p]?.start || '08:00');
      setEndTime(DEFAULT_BELL_TIMES[p]?.end || '08:45');
      setForceOverride(false);
      setErrorMessage(null);
    }
  }, [slot, initialDay, initialPeriod, isOpen, subjects, teachers, streamName]);

  // Update bell times when period changes
  const handlePeriodChange = (newPeriod: number) => {
    setPeriod(newPeriod);
    if (DEFAULT_BELL_TIMES[newPeriod]) {
      setStartTime(DEFAULT_BELL_TIMES[newPeriod].start);
      setEndTime(DEFAULT_BELL_TIMES[newPeriod].end);
    }
  };

  // Real-time Teacher Conflict Check
  const teacherConflict = React.useMemo(() => {
    if (!teacherId || !dayOfWeek || !period) return null;
    return allSlots.find(
      (s) =>
        s.teacherId === teacherId &&
        s.dayOfWeek === dayOfWeek &&
        s.period === Number(period) &&
        s.streamId !== streamId &&
        s.id !== slot?.id
    );
  }, [teacherId, dayOfWeek, period, allSlots, streamId, slot]);

  // Real-time Room Conflict Check
  const roomConflict = React.useMemo(() => {
    if (!room || !room.trim() || !dayOfWeek || !period) return null;
    const cleanRoom = room.trim().toLowerCase();
    return allSlots.find(
      (s) =>
        s.room &&
        s.room.trim().toLowerCase() === cleanRoom &&
        s.dayOfWeek === dayOfWeek &&
        s.period === Number(period) &&
        s.streamId !== streamId &&
        s.id !== slot?.id
    );
  }, [room, dayOfWeek, period, allSlots, streamId, slot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !teacherId) {
      setErrorMessage('Please select both a Subject and a Teacher.');
      return;
    }

    if ((teacherConflict || roomConflict) && !forceOverride) {
      setErrorMessage('A schedule conflict exists. Please resolve or check "Authorize Conflict Override".');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await onSave({
        streamId,
        subjectId,
        teacherId,
        dayOfWeek,
        period: Number(period),
        startTime,
        endTime,
        room: room.trim() || undefined,
        forceOverride,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to save timetable slot');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!slot || !onDelete) return;
    if (!window.confirm('Are you sure you want to remove this timetable slot?')) return;
    setIsDeleting(true);
    try {
      await onDelete(slot.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to delete slot');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const selectedTeacherObj = teachers.find((t) => t.id === teacherId);
  const selectedSubjectObj = subjects.find((s) => s.id === subjectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {slot ? 'Edit Timetable Slot' : 'Assign Timetable Period'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {streamName ? `Class: ${streamName}` : 'Manage weekly schedule slot'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="font-semibold">{errorMessage}</div>
            </div>
          )}

          {/* Teacher Conflict Alert */}
          {teacherConflict && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-400">
                <ShieldAlert className="w-4 h-4 text-amber-600 animate-pulse" />
                Teacher Schedule Conflict Detected!
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900 dark:text-amber-300">
                <strong className="font-extrabold">{selectedTeacherObj?.fullName}</strong> is already teaching{' '}
                <strong className="font-extrabold">{teacherConflict.subject?.name}</strong> in{' '}
                <strong className="font-extrabold">
                  {teacherConflict.stream?.class?.name} {teacherConflict.stream?.name}
                </strong>{' '}
                on {dayOfWeek} during Period {period} ({teacherConflict.startTime} - {teacherConflict.endTime}).
              </p>
              <label className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={forceOverride}
                  onChange={(e) => setForceOverride(e.target.checked)}
                  className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                />
                <span>Authorize Double-Booking / Shared Period Override</span>
              </label>
            </div>
          )}

          {/* Room Conflict Alert */}
          {roomConflict && (
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-700/60 text-sky-950 dark:text-sky-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sky-800 dark:text-sky-400">
                <Building2 className="w-4 h-4 text-sky-600" />
                Room Collision Alert
              </div>
              <p className="text-[11px] text-sky-900 dark:text-sky-300">
                Room <strong className="font-bold">{room}</strong> is already booked by{' '}
                <strong>
                  {roomConflict.stream?.class?.name} {roomConflict.stream?.name}
                </strong>{' '}
                ({roomConflict.subject?.name}) during Period {period}.
              </p>
            </div>
          )}

          {/* Day & Period Pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                Day of Week
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                disabled={!canEdit}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                Period Slot
              </label>
              <select
                value={period}
                onChange={(e) => handlePeriodChange(Number(e.target.value))}
                disabled={!canEdit}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                  <option key={p} value={p}>
                    Period {p} ({DEFAULT_BELL_TIMES[p]?.start} - {DEFAULT_BELL_TIMES[p]?.end})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject Picker */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Subject
              </span>
              {selectedSubjectObj && (
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {selectedSubjectObj.code} • {selectedSubjectObj.category}
                </span>
              )}
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={!canEdit}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Select Subject --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) [{s.category}]
                </option>
              ))}
            </select>
          </div>

          {/* Teacher Picker with Live Availability */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Assigned Teacher / Instructor
              </span>
              {selectedTeacherObj && !teacherConflict && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Free & Available
                </span>
              )}
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              disabled={!canEdit}
              className={`w-full p-2.5 rounded-xl border font-semibold focus:ring-2 ${
                teacherConflict
                  ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 focus:ring-amber-500'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-emerald-500'
              }`}
            >
              <option value="">-- Select Teacher --</option>
              {teachers.map((t) => {
                const busySlot = allSlots.find(
                  (s) =>
                    s.teacherId === t.id &&
                    s.dayOfWeek === dayOfWeek &&
                    s.period === Number(period) &&
                    s.streamId !== streamId
                );
                return (
                  <option key={t.id} value={t.id}>
                    {t.fullName} {busySlot ? `⚠️ (Busy with ${busySlot.stream?.class?.name || 'Class'})` : '✓ Available'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Room / Facility Picker */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> Classroom / Laboratory / Venue
            </label>
            <div className="relative">
              <input
                type="text"
                list="common-rooms-list"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. Science Lab 1, JHS Block Room 7A"
                disabled={!canEdit}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
              />
              <datalist id="common-rooms-list">
                {COMMON_ROOMS.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Time range (start & end) */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={!canEdit}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={!canEdit}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-semibold"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div>
            {slot && canEdit && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Removing...' : 'Delete Slot'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-950/30 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : slot ? 'Update Slot' : 'Assign Slot'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
