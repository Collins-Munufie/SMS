import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { GraduationCap, Printer, Award, CheckCircle2, FileText, X } from 'lucide-react';

export const GradesPage: React.FC = () => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const { data: studentsData } = useQuery({
    queryKey: ['studentsGrades'],
    queryFn: async () => (await api.get('/students')).data,
  });

  const { data: reportCardData } = useQuery({
    queryKey: ['reportCard', selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return null;
      return (await api.get(`/grades/report-card/${selectedStudentId}`)).data;
    },
    enabled: !!selectedStudentId,
  });

  const students = studentsData?.students || [];

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Examinations, WAEC Grading & Report Cards</h2>
          <p className="text-xs text-slate-500">Continuous Assessment (30%) + Terminal Exam (70%) with WAEC Scale (A1–F9) and PDF generation</p>
        </div>
      </div>

      {/* Grade Entry Matrix Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="font-bold text-slate-900 text-sm">Class Score & Exam Marks Matrix (JHS 1 Gold - Core Mathematics)</span>
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
            Term 1 (2025/2026)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="p-3">Student Name</th>
                <th className="p-3">Index ID</th>
                <th className="p-3">Class Score (30%)</th>
                <th className="p-3">Exam Score (70%)</th>
                <th className="p-3">Total (100%)</th>
                <th className="p-3">WAEC Grade</th>
                <th className="p-3 text-right">Report Card</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((st: any) => {
                const total = 88.5;
                return (
                  <tr key={st.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-semibold text-slate-900">{st.user?.fullName}</td>
                    <td className="p-3 font-mono font-bold text-emerald-800">{st.studentId}</td>
                    <td className="p-3 font-semibold text-slate-700">26.5 / 30</td>
                    <td className="p-3 font-semibold text-slate-700">62.0 / 70</td>
                    <td className="p-3 font-bold text-slate-900">{total}%</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[11px]">
                        A1 (Excellent)
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedStudentId(st.id)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-xs flex items-center gap-1.5 ml-auto"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Report
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Report Card Modal */}
      {selectedStudentId && reportCardData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 my-8">
            
            {/* Header Actions */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Award className="w-5 h-5 text-amber-500" /> Terminal Academic Report Card Preview
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
                <button onClick={() => setSelectedStudentId(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Ghana School Branded PDF Report Layout */}
            <div className="border-4 border-emerald-800 p-6 rounded-xl space-y-5 bg-white text-slate-900">
              
              {/* School Header */}
              <div className="text-center space-y-1 border-b-2 border-emerald-800 pb-4">
                <h1 className="text-xl font-black text-emerald-900 uppercase tracking-wide">
                  {reportCardData.schoolProfile?.name || 'ACHIMOTA BASIC & SENIOR HIGH SCHOOL'}
                </h1>
                <p className="text-xs font-bold text-slate-600 italic">
                  "{reportCardData.schoolProfile?.motto || 'Ut Omnes Unum Sint'}"
                </p>
                <p className="text-[11px] text-slate-500">
                  {reportCardData.schoolProfile?.address || 'Achimota Mile 7, Accra, Ghana'} • Tel: {reportCardData.schoolProfile?.phone}
                </p>
                <div className="pt-2 inline-block px-4 py-1 bg-emerald-900 text-amber-300 font-bold text-xs uppercase tracking-wider rounded">
                  STUDENT TERMINAL REPORT — TERM 1 (2025/2026)
                </div>
              </div>

              {/* Student Metadata Table */}
              <div className="grid grid-cols-2 gap-4 text-xs font-medium border p-3 rounded-lg bg-slate-50/70 border-slate-200">
                <div>
                  <p>Student Name: <strong className="text-slate-900">{reportCardData.student.fullName}</strong></p>
                  <p>Index Number: <strong className="text-emerald-800 font-mono">{reportCardData.student.studentId}</strong></p>
                </div>
                <div>
                  <p>Class & Stream: <strong className="text-slate-900">{reportCardData.student.class} ({reportCardData.student.stream})</strong></p>
                  <p>Form Teacher: <strong>{reportCardData?.student?.formTeacher || 'Ms. Abena Mensah'}</strong></p>
                </div>
              </div>

              {/* Subject Results Table */}
              <div>
                <table className="w-full text-left border-collapse text-xs border border-slate-300">
                  <thead>
                    <tr className="bg-emerald-900 text-white font-bold">
                      <th className="p-2 border border-slate-300">Subject</th>
                      <th className="p-2 border border-slate-300">Class Score (30%)</th>
                      <th className="p-2 border border-slate-300">Exam (70%)</th>
                      <th className="p-2 border border-slate-300">Total (100%)</th>
                      <th className="p-2 border border-slate-300">WAEC Grade</th>
                      <th className="p-2 border border-slate-300">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold">Core Mathematics</td>
                      <td className="p-2">26.5</td>
                      <td className="p-2">62.0</td>
                      <td className="p-2 font-bold text-emerald-800">88.5</td>
                      <td className="p-2 font-black text-emerald-900">A1</td>
                      <td className="p-2">Excellent</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold">English Language</td>
                      <td className="p-2">24.0</td>
                      <td className="p-2">56.0</td>
                      <td className="p-2 font-bold text-emerald-800">80.0</td>
                      <td className="p-2 font-black text-emerald-900">A1</td>
                      <td className="p-2">Excellent</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-bold">Integrated Science</td>
                      <td className="p-2">22.5</td>
                      <td className="p-2">54.0</td>
                      <td className="p-2 font-bold text-emerald-800">76.5</td>
                      <td className="p-2 font-black text-emerald-900">B2</td>
                      <td className="p-2">Very Good</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Remarks Section */}
              <div className="space-y-2 text-xs border-t border-slate-200 pt-3">
                <div>
                  <strong className="text-slate-900">Form Teacher Remarks:</strong>
                  <p className="text-slate-700 italic">{reportCardData.summary.formTeacherRemarks}</p>
                </div>
                <div>
                  <strong className="text-slate-900">Headteacher Remarks:</strong>
                  <p className="text-slate-700 italic">{reportCardData.summary.headteacherRemarks}</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
