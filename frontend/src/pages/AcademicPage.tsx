import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Building2, Calendar, BookOpen, Layers, Plus, CheckCircle2, Award } from 'lucide-react';

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
          <h2 className="text-xl font-bold text-slate-900">Ghana Basic Education Setup (KG 1 – Basic 9)</h2>
          <p className="text-xs text-slate-500">Supported sequential levels: Kindergarten (KG 1, KG 2), Primary (Basic 1–6), and JHS (Basic 7–9 Terminal BECE)</p>
        </div>
        <button className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs">
          <Plus className="w-4 h-4" /> Add Stream Section
        </button>
      </div>

      {/* Academic Year & Terms */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm border-b border-slate-100 pb-3">
          <Calendar className="w-4 h-4 text-emerald-600" />
          Active 3-Term Academic Structure (Ghana Basic Education)
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

      {/* Pre-seeded Ghanaian Basic Education Classes & Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Classes & Streams list */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Pre-seeded Basic Education Class Sequence
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
              KG 1 to Basic 9
            </span>
          </div>

          <div className="space-y-3">
            {(classesData?.classes || [
              { name: 'KG 1', code: 'KG1', level: 'KINDERGARTEN', streams: [{ name: 'A' }] },
              { name: 'KG 2', code: 'KG2', level: 'KINDERGARTEN', streams: [{ name: 'A' }] },
              { name: 'Basic 1', code: 'B1', level: 'PRIMARY', streams: [{ name: 'A' }] },
              { name: 'Basic 2', code: 'B2', level: 'PRIMARY', streams: [{ name: 'A' }] },
              { name: 'Basic 3', code: 'B3', level: 'PRIMARY', streams: [{ name: 'A' }] },
              { name: 'Basic 4', code: 'B4', level: 'PRIMARY', streams: [{ name: 'A' }] },
              { name: 'Basic 5', code: 'B5', level: 'PRIMARY', streams: [{ name: 'A' }] },
              { name: 'Basic 6', code: 'B6', level: 'PRIMARY', streams: [{ name: 'A' }] },
              { name: 'Basic 7', code: 'B7', level: 'JHS', streams: [{ name: 'A' }, { name: 'B' }] },
              { name: 'Basic 8', code: 'B8', level: 'JHS', streams: [{ name: 'A' }] },
              { name: 'Basic 9', code: 'B9', level: 'JHS', streams: [{ name: 'A (BECE Candidate Class)' }] },
            ]).map((c: any) => (
              <div key={c.code} className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 space-y-2 bg-slate-50/40">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    {c.name}
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
                      {c.level}
                    </span>
                    {c.code === 'B9' && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-600" /> Terminal BECE Level
                      </span>
                    )}
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

        {/* Basic Curriculum Subjects */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Ghana Basic Education Curriculum Subjects
          </div>
          <div className="space-y-2.5">
            {(subjectsData?.subjects || [
              { name: 'Mathematics', code: 'MATH-BASIC', category: 'CORE' },
              { name: 'English Language', code: 'ENG-BASIC', category: 'CORE' },
              { name: 'Integrated Science', code: 'SCI-BASIC', category: 'CORE' },
              { name: 'Social Studies', code: 'SOC-BASIC', category: 'CORE' },
              { name: 'Computing / ICT', code: 'ICT-BASIC', category: 'CORE' },
              { name: 'Religious & Moral Education (RME)', code: 'RME-BASIC', category: 'CORE' },
              { name: 'Ghanaian Language & Culture', code: 'GHL-BASIC', category: 'CORE' },
              { name: 'Creative Arts & Design', code: 'CAD-BASIC', category: 'CORE' },
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
