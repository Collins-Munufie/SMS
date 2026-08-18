import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Building2, Calendar, BookOpen, Layers, Plus, CheckCircle2 } from 'lucide-react';

export const AcademicPage: React.FC = () => {
  const { data: yearsData } = useQuery({
    queryKey: ['academicYears'],
    queryFn: async () => (await api.get('/academic/years')).data,
  });

  const { data: classesData } = useQuery({
    queryKey: ['academicClasses'],
    queryFn: async () => (await api.get('/academic/classes')).data,
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['academicSubjects'],
    queryFn: async () => (await api.get('/academic/subjects')).data,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Academic Structure & Setup</h2>
          <p className="text-xs text-slate-500">Configure Academic Years, 3-Term structures, Classes, Streams and GES Core Subjects</p>
        </div>
        <button className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs">
          <Plus className="w-4 h-4" /> Add New Class / Stream
        </button>
      </div>

      {/* Academic Year & Terms */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm border-b border-slate-100 pb-3">
          <Calendar className="w-4 h-4 text-emerald-600" />
          Active Academic Year & Term Configuration (GES Ghana)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(yearsData?.years?.[0]?.terms || [
            { termNumber: 1, termLabel: 'Term 1', isCurrent: true, startDate: '2025-09-01', endDate: '2025-12-15' },
            { termNumber: 2, termLabel: 'Term 2', isCurrent: false, startDate: '2026-01-08', endDate: '2026-04-10' },
            { termNumber: 3, termLabel: 'Term 3', isCurrent: false, startDate: '2026-05-04', endDate: '2026-07-31' },
          ]).map((t: any) => (
            <div
              key={t.termLabel}
              className={`p-4 rounded-xl border ${
                t.isCurrent
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500/30'
                  : 'border-slate-200 bg-slate-50'
              } space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">{t.termLabel}</span>
                {t.isCurrent && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active Term
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Academic Year: <strong>2025/2026</strong>
              </p>
              <p className="text-xs text-slate-500">
                Period: {new Date(t.startDate).toLocaleDateString()} — {new Date(t.endDate).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Classes & Streams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Classes & Streams list */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Registered Classes & Streams
          </div>
          <div className="space-y-3">
            {(classesData?.classes || [
              { name: 'JHS 1', code: 'JHS1', level: 'JHS', streams: [{ name: 'Gold', formTeacher: { fullName: 'Ms. Abena Mensah' } }, { name: 'Green' }] },
              { name: 'JHS 2', code: 'JHS2', level: 'JHS', streams: [{ name: 'Gold' }] },
              { name: 'SHS 1', code: 'SHS1-ARTS', level: 'SHS', streams: [{ name: 'General Arts 1' }] },
            ]).map((c: any) => (
              <div key={c.code} className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    {c.name}
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
                      {c.level}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{c.streams?.length || 1} Streams</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {c.streams?.map((s: any) => (
                    <span key={s.name} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                      Stream: {s.name} {s.formTeacher ? `(FT: ${s.formTeacher.fullName})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subjects list */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Curriculum Subjects
          </div>
          <div className="space-y-2.5">
            {(subjectsData?.subjects || [
              { name: 'Core Mathematics', code: 'MATH101', category: 'CORE' },
              { name: 'English Language', code: 'ENG101', category: 'CORE' },
              { name: 'Integrated Science', code: 'SCI101', category: 'CORE' },
              { name: 'Social Studies', code: 'SOC101', category: 'CORE' },
              { name: 'Information & Communication Technology', code: 'ICT101', category: 'CORE' },
            ]).map((sub: any) => (
              <div key={sub.code} className="p-3 rounded-xl border border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <div className="font-semibold text-slate-900 text-xs">{sub.name}</div>
                  <div className="text-[10px] text-slate-500">Code: {sub.code}</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {sub.category}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
