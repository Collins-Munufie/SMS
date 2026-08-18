import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { CalendarDays, Clock, Plus, AlertTriangle, Printer, CheckCircle2, User, Building2, X } from 'lucide-react';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const PERIODS = [
  { num: 1, time: '08:00 - 08:45', label: 'Period 1' },
  { num: 2, time: '08:45 - 09:30', label: 'Period 2' },
  { num: 3, time: '09:30 - 10:15', label: 'Period 3' },
  { num: 4, time: '10:15 - 10:45', label: 'Snack Break' },
  { num: 5, time: '10:45 - 11:30', label: 'Period 4' },
  { num: 6, time: '11:30 - 12:15', label: 'Period 5' },
  { num: 7, time: '12:15 - 01:00', label: 'Lunch Break' },
  { num: 8, time: '01:00 - 02:00', label: 'Period 6 (Electives)' },
];

export const TimetablePage: React.FC = () => {
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');
  const [showSlotModal, setShowSlotModal] = useState<any>(null); // { day, period }
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Form states for modal
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [room, setRoom] = useState('Room 4B');

  const { data: streamsData } = useQuery({
    queryKey: ['timetableStreams'],
    queryFn: async () => {
      const res = (await api.get('/academic/streams')).data;
      if (res.streams?.[0] && !selectedStreamId) {
        setSelectedStreamId(res.streams[0].id);
      }
      return res;
    },
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['timetableSubjects'],
    queryFn: async () => (await api.get('/academic/subjects')).data,
  });

  const { data: staffData } = useQuery({
    queryKey: ['timetableTeachers'],
    queryFn: async () => (await api.get('/staff?role=TEACHER')).data,
  });

  const { data: timetableData, refetch } = useQuery({
    queryKey: ['timetableSlots', selectedStreamId],
    queryFn: async () => {
      if (!selectedStreamId) return { slots: [] };
      return (await api.get('/timetable', { params: { streamId: selectedStreamId } })).data;
    },
    enabled: !!selectedStreamId,
  });

  const streams = streamsData?.streams || [];
  const subjects = subjectsData?.subjects || [];
  const teachers = staffData?.staff || [];
  const slots = timetableData?.slots || [];

  // Helper to find slot in timetable matrix
  const getSlot = (day: string, periodNum: number) => {
    return slots.find((s: any) => s.dayOfWeek === day && s.period === periodNum);
  };

  const handleAssignSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);
    try {
      await api.post('/timetable/slot', {
        streamId: selectedStreamId,
        subjectId,
        teacherId,
        dayOfWeek: showSlotModal.day,
        period: showSlotModal.period,
        room,
      });
      setShowSlotModal(null);
      refetch();
    } catch (err: any) {
      setConflictError(err.response?.data?.error || 'Failed to assign timetable slot');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Class & Teacher Timetable Builder</h2>
          <p className="text-xs text-slate-500">Weekly scheduling grid with automatic teacher double-booking & room conflict checks</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedStreamId}
            onChange={(e) => setSelectedStreamId(e.target.value)}
            className="p-2 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-800"
          >
            {streams.map((s: any) => (
              <option key={s.id} value={s.id}>
                Class: {s.class?.name} ({s.name})
              </option>
            ))}
          </select>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" /> Print Timetable
          </button>
        </div>
      </div>

      {/* Timetable Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <CalendarDays className="w-4 h-4 text-emerald-600" />
            Weekly Schedule Matrix (Achimota Basic & SHS)
          </div>
          <span className="text-xs text-slate-500">Monday - Friday • 8 Periods</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3 border-r border-slate-200 w-28">Period / Time</th>
                {DAYS.map((day) => (
                  <th key={day} className="p-3 border-r border-slate-200">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {PERIODS.map((p) => {
                const isBreak = p.num === 4 || p.num === 7;
                return (
                  <tr key={p.num} className={isBreak ? 'bg-amber-50/60 font-semibold' : ''}>
                    <td className="p-3 border-r border-slate-200 font-bold text-slate-700 bg-slate-50/50 text-[11px]">
                      <div>{p.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{p.time}</div>
                    </td>

                    {isBreak ? (
                      <td colSpan={5} className="p-3 text-amber-800 font-bold text-xs tracking-wider uppercase">
                        ☕ {p.label} ({p.time})
                      </td>
                    ) : (
                      DAYS.map((day) => {
                        const slot = getSlot(day, p.num);
                        return (
                          <td
                            key={day}
                            onClick={() => {
                              setShowSlotModal({ day, period: p.num });
                              if (subjects[0]) setSubjectId(subjects[0].id);
                              if (teachers[0]) setTeacherId(teachers[0].id);
                              setConflictError(null);
                            }}
                            className="p-2 border-r border-slate-200 hover:bg-emerald-50/40 cursor-pointer transition h-20 align-top text-left"
                          >
                            {slot ? (
                              <div className="p-2 rounded-xl bg-emerald-100/70 border border-emerald-300/60 space-y-1 h-full shadow-2xs">
                                <div className="font-bold text-emerald-950 text-xs flex items-center justify-between">
                                  <span>{slot.subject?.name}</span>
                                </div>
                                <div className="text-[10px] text-emerald-800 flex items-center gap-1 font-medium">
                                  <User className="w-3 h-3 text-emerald-700" /> {slot.teacher?.fullName}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {slot.room || 'Room 4B'}
                                </div>
                              </div>
                            ) : (
                              <div className="h-full border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:border-emerald-400 hover:text-emerald-600 text-[10px] font-semibold">
                                + Assign
                              </div>
                            )}
                          </td>
                        );
                      })
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Timetable Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Assign Timetable Slot</h3>
                <p className="text-xs text-slate-500">
                  {showSlotModal.day} • Period {showSlotModal.period}
                </p>
              </div>
              <button onClick={() => setShowSlotModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {conflictError && (
              <div className="p-3 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <span>{conflictError}</span>
              </div>
            )}

            <form onSubmit={handleAssignSlot} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Select Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1 font-semibold"
                >
                  {subjects.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Assigned Teacher</label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1 font-semibold"
                >
                  {teachers.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Classroom / Science Lab</label>
                <input
                  type="text"
                  required
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSlotModal(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                >
                  Save Timetable Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
