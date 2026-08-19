import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { CalendarDays, Clock, Building2, BookOpen, User, Plus, Filter, AlertTriangle } from 'lucide-react';

export const TimetablePage: React.FC = () => {
  const [selectedStreamId, setSelectedStreamId] = useState('');
  const [selectedDay, setSelectedDay] = useState('MONDAY');

  const { data: streamsData } = useQuery({
    queryKey: ['streamsList'],
    queryFn: async () => (await api.get('/academic/streams')).data,
  });

  const { data: timetableData } = useQuery({
    queryKey: ['timetableList', selectedStreamId, selectedDay],
    queryFn: async () =>
      (
        await api.get('/timetable', {
          params: { streamId: selectedStreamId || undefined, dayOfWeek: selectedDay },
        })
      ).data,
  });

  const streams = streamsData?.streams || [];
  const slots = timetableData?.slots || [
    {
      id: 's1',
      dayOfWeek: 'MONDAY',
      periodNumber: 1,
      startTime: '08:00',
      endTime: '08:45',
      subject: { name: 'Mathematics', code: 'MATH-BASIC' },
      teacher: { fullName: 'Mr. Kwaku Browning' },
      classroom: 'JHS Block Room 7A',
    },
    {
      id: 's2',
      dayOfWeek: 'MONDAY',
      periodNumber: 2,
      startTime: '08:45',
      endTime: '09:30',
      subject: { name: 'English Language', code: 'ENG-BASIC' },
      teacher: { fullName: 'Ms. Abena Mensah' },
      classroom: 'JHS Block Room 7A',
    },
    {
      id: 's3',
      dayOfWeek: 'MONDAY',
      periodNumber: 3,
      startTime: '09:30',
      endTime: '10:15',
      subject: { name: 'Integrated Science', code: 'SCI-BASIC' },
      teacher: { fullName: 'Mr. Kwaku Browning' },
      classroom: 'Science Lab 1',
    },
  ];

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Class Timetable & Schedule Builder</h2>
          <p className="text-xs text-slate-500">Weekly period schedules for Kings & Queens Preparatory (KG 1 to Basic 9)</p>
        </div>
      </div>

      {/* Stream Selector & Day Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStreamId}
            onChange={(e) => setSelectedStreamId(e.target.value)}
            className="p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold"
          >
            <option value="">Select Stream (Basic 7A Default)</option>
            {streams.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.class?.name} {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedDay === day
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Period Schedule List */}
      <div className="space-y-3">
        {slots.map((slot: any) => (
          <div
            key={slot.id}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-sm flex items-center justify-center">
                P{slot.periodNumber}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{slot.subject?.name}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> {slot.teacher?.fullName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> {slot.classroom || 'Classroom'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" /> {slot.startTime} - {slot.endTime}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">45 Minutes Period</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
