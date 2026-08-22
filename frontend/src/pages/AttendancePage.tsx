import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import {
  UserCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  Layers,
  Users,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'>>({});
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fetch Streams
  const { data: streamsData, isLoading: isStreamsLoading } = useQuery({
    queryKey: ['streamsListForAttendance'],
    queryFn: async () => {
      const res = (await api.get('/academic/streams')).data;
      if (res.streams?.[0] && !selectedStreamId) {
        setSelectedStreamId(res.streams[0].id);
      }
      return res;
    },
  });

  const streams = streamsData?.streams || [];
  const currentStream = streams.find((s: any) => s.id === selectedStreamId) || streams[0];

  // 2. Fetch Enrolled Pupils for Selected Stream
  const { data: studentsData, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['studentsAttendanceStream', selectedStreamId],
    queryFn: async () => {
      if (!selectedStreamId) return null;
      return (await api.get('/students', { params: { streamId: selectedStreamId } })).data;
    },
    enabled: !!selectedStreamId,
  });

  const students = studentsData?.students || [];

  // Initialize attendance map with PRESENT for all students when list loads
  useEffect(() => {
    if (students.length > 0) {
      const initial: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'> = {};
      students.forEach((st: any) => {
        initial[st.id] = attendanceMap[st.id] || 'PRESENT';
      });
      setAttendanceMap(initial);
    }
  }, [students]);

  const setStatus = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  // Bulk Actions
  const handleMarkAll = (status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    const updated: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'> = {};
    students.forEach((st: any) => {
      updated[st.id] = status;
    });
    setAttendanceMap(updated);
    toast.info(`Marked all pupils in stream as ${status}. Click "Save Register" to submit.`);
  };

  // Save Attendance Register
  const handleSaveAttendance = async () => {
    if (!selectedStreamId || students.length === 0) {
      toast.warning('No pupils available to record attendance');
      return;
    }

    setIsSaving(true);
    try {
      const records = students.map((st: any) => ({
        studentId: st.id,
        status: attendanceMap[st.id] || 'PRESENT',
      }));

      await api.post('/attendance/bulk', {
        streamId: selectedStreamId,
        date: selectedDate,
        records,
      });

      toast.success(
        `Attendance register saved for ${currentStream?.class?.name} ${currentStream?.name} on ${selectedDate}! Absence alerts triggered for parents.`
      );
      queryClient.invalidateQueries({ queryKey: ['attendanceAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['reportCard'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save attendance register');
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'ABSENT').length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === 'LATE').length;

  return (
    <div className="space-y-6 pb-10">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Daily Class Attendance Register
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Form Teacher register marking with automated absence parent notifications
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 font-bold"
          />

          <button
            onClick={handleSaveAttendance}
            disabled={isSaving || students.length === 0}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md transition"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Register</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stream Selector & Quick Stats */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Stream Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Class Stream:</span>
          <select
            value={selectedStreamId}
            onChange={(e) => setSelectedStreamId(e.target.value)}
            className="p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-extrabold"
          >
            {streams.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.class?.name} {s.name} {s.formTeacher ? `(FT: ${s.formTeacher.fullName})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Batch Buttons & Counters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => handleMarkAll('PRESENT')}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Mark All Present ({presentCount})
          </button>

          <button
            onClick={() => handleMarkAll('ABSENT')}
            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-800 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800 transition flex items-center gap-1"
          >
            <XCircle className="w-3.5 h-3.5" /> Mark All Absent ({absentCount})
          </button>
        </div>
      </div>

      {/* Class Register Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <span className="font-extrabold text-slate-800 dark:text-white text-xs flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Class: {currentStream?.class?.name} {currentStream?.name} • Daily Register ({selectedDate})
          </span>
          <span className="text-xs text-slate-500 font-bold">Total Enrolled: {students.length} Pupils</span>
        </div>

        {isStudentsLoading ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
            <p className="text-xs font-bold">Loading class roster...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-10 text-center text-slate-500 space-y-2">
            <Users className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-800 dark:text-white">No Pupils Enrolled in this Stream</p>
            <p className="text-xs text-slate-400">Enroll pupils to start taking daily attendance registers.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {students.map((st: any) => {
              const currentStatus = attendanceMap[st.id] || 'PRESENT';
              return (
                <div
                  key={st.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={st.photoUrl || st.user?.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150'}
                      alt={st.user?.fullName}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/20 shrink-0"
                    />
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-xs">{st.user?.fullName}</div>
                      <div className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">{st.studentId}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={() => setStatus(st.id, 'PRESENT')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 border transition ${
                        currentStatus === 'PRESENT'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Present
                    </button>

                    <button
                      onClick={() => setStatus(st.id, 'ABSENT')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 border transition ${
                        currentStatus === 'ABSENT'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Absent
                    </button>

                    <button
                      onClick={() => setStatus(st.id, 'LATE')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 border transition ${
                        currentStatus === 'LATE'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> Late
                    </button>

                    <button
                      onClick={() => setStatus(st.id, 'EXCUSED')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 border transition ${
                        currentStatus === 'EXCUSED'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> Excused
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
