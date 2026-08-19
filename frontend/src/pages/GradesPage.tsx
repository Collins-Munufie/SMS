import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { GraduationCap, Printer, Award, CheckCircle2, FileText, X, Settings, RefreshCw, MessageSquare, Save } from 'lucide-react';

export const GradesPage: React.FC = () => {
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showRemarksModal, setShowRemarksModal] = useState<any>(null);

  // Remarks state
  const [formTeacherRemarks, setFormTeacherRemarks] = useState('An outstanding academic performance. Recommended for promotion.');
  const [headteacherRemarks, setHeadteacherRemarks] = useState('Promoted to next class level.');

  // Assessment Component Form state
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [compName, setCompName] = useState('Mid-Term Test');
  const [compWeight, setCompWeight] = useState('10');

  const { data: streamsData } = useQuery({
    queryKey: ['gradesStreams'],
    queryFn: async () => {
      const res = (await api.get('/academic/streams')).data;
      if (res.streams?.[0] && !selectedStreamId) {
        setSelectedStreamId(res.streams[0].id);
      }
      return res;
    },
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['gradesSubjects'],
    queryFn: async () => {
      const res = (await api.get('/academic/subjects')).data;
      if (res.subjects?.[0] && !selectedSubjectId) {
        setSelectedSubjectId(res.subjects[0].id);
      }
      return res;
    },
  });

  const { data: termsData } = useQuery({
    queryKey: ['gradesTerms'],
    queryFn: async () => (await api.get('/academic/terms')).data,
  });

  const activeTermId = termsData?.terms?.find((t: any) => t.isCurrent)?.id || termsData?.terms?.[0]?.id;

  const { data: matrixData, refetch: refetchMatrix } = useQuery({
    queryKey: ['gradesMatrix', selectedStreamId, activeTermId, selectedSubjectId],
    queryFn: async () => {
      if (!selectedStreamId || !activeTermId || !selectedSubjectId) return null;
      return (await api.get('/grades/matrix', {
        params: { streamId: selectedStreamId, termId: activeTermId, subjectId: selectedSubjectId },
      })).data;
    },
    enabled: !!selectedStreamId && !!activeTermId && !!selectedSubjectId,
  });

  const { data: reportCardData } = useQuery({
    queryKey: ['reportCard', selectedStudentId, activeTermId],
    queryFn: async () => {
      if (!selectedStudentId) return null;
      return (await api.get(`/grades/report-card/${selectedStudentId}`, { params: { termId: activeTermId } })).data;
    },
    enabled: !!selectedStudentId,
  });

  const streams = streamsData?.streams || [];
  const subjects = subjectsData?.subjects || [];
  const enrollments = matrixData?.enrollments || [];

  const handleComputeRanks = async () => {
    try {
      const res = await api.post('/grades/compute-ranks', {
        streamId: selectedStreamId,
        termId: activeTermId,
      });
      alert(res.data.message);
      refetchMatrix();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to compute ranks');
    }
  };

  const handleSaveRemarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRemarksModal) return;
    try {
      await api.post('/grades/remarks', {
        studentId: showRemarksModal.student.id,
        termId: activeTermId,
        formTeacherRemarks,
        headteacherRemarks,
      });
      setShowRemarksModal(null);
      alert('Remarks updated successfully');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save remarks');
    }
  };

  const handleCreateComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const classId = streams.find((s: any) => s.id === selectedStreamId)?.classId || 'class-1';
      await api.post('/grades/components', {
        classId,
        name: compName,
        weightPercentage: Number(compWeight),
      });
      setShowComponentModal(false);
      alert('Assessment Component added');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add component');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Examinations, WAEC Grading & Report Cards</h2>
          <p className="text-xs text-slate-500">Continuous Assessment (30%) + Terminal Exam (70%), Class Ranking (1st, 2nd) and Branded PDF Generation</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowComponentModal(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs flex items-center gap-1"
          >
            <Settings className="w-4 h-4 text-slate-600" /> Weightings
          </button>
          <button
            onClick={handleComputeRanks}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-4 h-4" /> Compute Class Ranks
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-600">Class Stream:</label>
          <select
            value={selectedStreamId}
            onChange={(e) => setSelectedStreamId(e.target.value)}
            className="p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-900 flex-1"
          >
            {streams.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.class?.name} ({s.name})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-600">Subject:</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-900 flex-1"
          >
            {subjects.map((sub: any) => (
              <option key={sub.id} value={sub.id}>
                {sub.name} ({sub.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grade Entry Matrix Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="font-bold text-slate-900 text-sm">Class Marks Entry & WAEC Assessment Matrix</span>
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
            Term 1 (2025/2026)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase">
                <th className="p-3">Student Name</th>
                <th className="p-3">Index ID</th>
                <th className="p-3">Class Score (30%)</th>
                <th className="p-3">Exam Score (70%)</th>
                <th className="p-3">Total (100%)</th>
                <th className="p-3">WAEC Grade</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrollments.map((en: any) => {
                const total = 88.5;
                return (
                  <tr key={en.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-semibold text-slate-900">{en.student?.user?.fullName}</td>
                    <td className="p-3 font-mono font-bold text-emerald-800">{en.student?.studentId}</td>
                    <td className="p-3 font-semibold text-slate-700">26.5 / 30</td>
                    <td className="p-3 font-semibold text-slate-700">62.0 / 70</td>
                    <td className="p-3 font-bold text-slate-900">{total}%</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[11px]">
                        A1 (Excellent)
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => setShowRemarksModal(en)}
                        className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg"
                      >
                        Remarks
                      </button>
                      <button
                        onClick={() => setSelectedStudentId(en.student.id)}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-xs inline-flex items-center gap-1"
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

      {/* Assessment Component Weighting Modal */}
      {showComponentModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Assessment Weightings Setup</h3>
              <button onClick={() => setShowComponentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateComponent} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Component Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Continuous Assessment"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Weight Percentage (%)</label>
                <input
                  type="number"
                  required
                  value={compWeight}
                  onChange={(e) => setCompWeight(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1 font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowComponentModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
                >
                  Save Weighting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remarks Modal */}
      {showRemarksModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Teacher Remarks</h3>
                <p className="text-xs text-slate-500">Student: {showRemarksModal.student?.user?.fullName}</p>
              </div>
              <button onClick={() => setShowRemarksModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRemarks} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Form Teacher Remarks</label>
                <textarea
                  rows={3}
                  value={formTeacherRemarks}
                  onChange={(e) => setFormTeacherRemarks(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Headteacher Remarks & Promotion Decision</label>
                <textarea
                  rows={2}
                  value={headteacherRemarks}
                  onChange={(e) => setHeadteacherRemarks(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRemarksModal(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                >
                  Save Remarks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  {reportCardData.schoolProfile?.name || 'KINGS & QUEENS PREPARATORY SCHOOL'}
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
                  <p>Class Position: <strong className="text-amber-800 font-bold">{reportCardData.summary.positionInClass} st Out of 35</strong></p>
                </div>
                <div>
                  <p>Class & Stream: <strong className="text-slate-900">{reportCardData.student.class} ({reportCardData.student.stream})</strong></p>
                  <p>Form Teacher: <strong>{reportCardData.student.formTeacher}</strong></p>
                  <p>Attendance Record: <strong className="text-slate-900">{reportCardData.student.attendanceCount || 48} Days Present</strong></p>
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
