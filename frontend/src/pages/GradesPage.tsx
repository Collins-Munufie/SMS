import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Printer,
  Award,
  AlertTriangle,
  FileText,
  X,
  Settings,
  RefreshCw,
  Save,
  Lock,
  Unlock,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Search,
  Check,
} from 'lucide-react';

export const GradesPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedAllocId, setSelectedAllocId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showRemarksModal, setShowRemarksModal] = useState<any>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // Remarks state
  const [formTeacherRemarks, setFormTeacherRemarks] = useState('An outstanding academic performance. Recommended for promotion.');
  const [headteacherRemarks, setHeadteacherRemarks] = useState('Promoted to next class level.');

  // Live Score Grid Inputs Matrix state: { `${studentId}_${componentId}`: rawScore }
  const [scoreMatrix, setScoreMatrix] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Teacher Allocations (Scope teacher's assigned subjects & classes)
  const { data: allocData } = useQuery({
    queryKey: ['teacherAllocations', user?.id, user?.role],
    queryFn: async () => {
      const res = (await api.get('/grades/teacher/allocations')).data;
      if (res.allocations?.[0] && !selectedAllocId) {
        setSelectedAllocId(res.allocations[0].id);
      }
      return res;
    },
  });

  const allocations = allocData?.allocations || [];
  const currentAlloc = allocations.find((a: any) => a.id === selectedAllocId) || allocations[0];

  const { data: termsData } = useQuery({
    queryKey: ['gradesTerms'],
    queryFn: async () => (await api.get('/academic/terms')).data,
  });

  const activeTermId = termsData?.terms?.find((t: any) => t.isCurrent)?.id || termsData?.terms?.[0]?.id;

  // Fetch CA Grid Payload for selected Allocation & Term
  const { data: gridData, refetch: refetchGrid } = useQuery({
    queryKey: ['caGrid', currentAlloc?.streamId, currentAlloc?.subjectId, activeTermId],
    queryFn: async () => {
      if (!currentAlloc?.streamId || !currentAlloc?.subjectId || !activeTermId) return null;
      return (
        await api.get('/grades/ca-grid', {
          params: {
            streamId: currentAlloc.streamId,
            subjectId: currentAlloc.subjectId,
            termId: activeTermId,
          },
        })
      ).data;
    },
    enabled: !!currentAlloc?.streamId && !!currentAlloc?.subjectId && !!activeTermId,
  });

  const { data: reportCardData } = useQuery({
    queryKey: ['reportCard', selectedStudentId, activeTermId],
    queryFn: async () => {
      if (!selectedStudentId) return null;
      return (await api.get(`/grades/report-card/${selectedStudentId}`, { params: { termId: activeTermId } })).data;
    },
    enabled: !!selectedStudentId,
  });

  // Populate initial scores from backend into live score matrix
  useEffect(() => {
    if (gridData?.grades) {
      const initial: Record<string, number> = {};
      gridData.grades.forEach((g: any) => {
        initial[`${g.studentId}_${g.componentId}`] = g.score;
      });
      setScoreMatrix(initial);
    }
  }, [gridData]);

  const components = gridData?.components || [];
  const enrollments = gridData?.enrollments || [];
  const summary = gridData?.summary;
  const isExamWindowOpen = gridData?.term?.isExamWindowOpen ?? true;
  const isTermLocked = gridData?.term?.isTermLocked ?? false;

  // Handle live Score input change
  const handleScoreChange = (studentId: string, componentId: string, val: string) => {
    const numeric = parseFloat(val);
    setScoreMatrix((prev) => ({
      ...prev,
      [`${studentId}_${componentId}`]: isNaN(numeric) ? 0 : numeric,
    }));
  };

  // Helper: Compute weighted total for a student row
  const computeRowTotal = (studentId: string) => {
    let total = 0;
    components.forEach((c: any) => {
      const score = scoreMatrix[`${studentId}_${c.id}`] || 0;
      const weight = c.weightPercentage || 10;
      const max = c.maxScore || 100;
      total += (score / max) * weight;
    });
    return Math.round(total * 10) / 10;
  };

  // Helper: Compute WAEC Grade for row
  const getWaecGrade = (score: number) => {
    if (score >= 80) return 'A1';
    if (score >= 75) return 'B2';
    if (score >= 70) return 'B3';
    if (score >= 65) return 'C4';
    if (score >= 60) return 'C5';
    if (score >= 55) return 'C6';
    if (score >= 50) return 'D7';
    if (score >= 45) return 'E8';
    return 'F9';
  };

  // Batch Save & Auto-Collate
  const handleSaveAll = async () => {
    if (!currentAlloc) return;
    setIsSaving(true);
    try {
      const entries: any[] = [];
      enrollments.forEach((en: any) => {
        components.forEach((c: any) => {
          const score = scoreMatrix[`${en.student.id}_${c.id}`];
          if (score !== undefined) {
            entries.push({
              studentId: en.student.id,
              componentId: c.id,
              score,
            });
          }
        });
      });

      const res = await api.post('/grades/ca-entry', {
        streamId: currentAlloc.streamId,
        subjectId: currentAlloc.subjectId,
        termId: activeTermId,
        entries,
      });

      alert(res.data.message || 'Scores saved and auto-collated successfully!');
      refetchGrid();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save scores');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Bulk Paste from CSV / Excel
  const handleBulkPaste = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.trim().split('\n');
    const newMatrix = { ...scoreMatrix };

    lines.forEach((line, index) => {
      if (enrollments[index]) {
        const studentId = enrollments[index].student.id;
        const values = line.split(/[\t,]/).map((v) => parseFloat(v.trim()));
        components.forEach((comp: any, compIdx: number) => {
          if (!isNaN(values[compIdx])) {
            newMatrix[`${studentId}_${comp.id}`] = values[compIdx];
          }
        });
      }
    });

    setScoreMatrix(newMatrix);
    setShowPasteModal(false);
    setPasteText('');
    alert('Scores imported from clipboard successfully!');
  };

  const handleComputeRanks = async () => {
    if (!currentAlloc) return;
    try {
      const res = await api.post('/grades/compute-ranks', {
        streamId: currentAlloc.streamId,
        termId: activeTermId,
      });
      alert(res.data.message);
      refetchGrid();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to compute ranks');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Title & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Subject & Continuous Assessment (CA) Score Entry</h2>
          <p className="text-xs text-slate-500">
            Spreadsheet score entry grid, automatic weighted collation & instant report card update
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPasteModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Paste from Excel
          </button>
          <button
            onClick={handleComputeRanks}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" /> Compute Class Ranks
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving || isTermLocked}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Collating...' : 'Save & Collate Scores'}
          </button>
        </div>
      </div>

      {/* Scope Safeguard Banner & Allocation Selector Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Layers className="w-4 h-4 text-emerald-600" /> Your Assigned Class & Subject Allocations
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300">
            Strict Teacher Scope Active
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {allocations.map((alloc: any) => (
            <button
              key={alloc.id}
              onClick={() => setSelectedAllocId(alloc.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
                selectedAllocId === alloc.id
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>
                {alloc.stream?.class?.name} ({alloc.stream?.name}) — {alloc.subject?.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Admin Assessment Weightings & Lock Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1">
          <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
            <span>Admin-Configured Assessment Component Weightings</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              Sum = 100%
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300">
            {components.map((c: any) => (
              <div key={c.id} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{c.name}:</span>
                <strong className="text-white font-mono">{c.weightPercentage}%</strong>
                <span className="text-slate-400 text-[10px]">(Max: {c.maxScore})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isTermLocked ? (
            <div className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-rose-400" /> Term Edit Window Locked
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
              <Unlock className="w-4 h-4 text-emerald-400" /> Assessment Window Open
            </div>
          )}
        </div>
      </div>

      {/* Missing Scores Warning Bar */}
      {summary && !summary.isComplete && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Missing Score Warning: There are <strong>{summary.missingEntriesCount} missing component entries</strong> in this class sheet.
            </span>
          </div>
          <span className="text-[11px] text-amber-700 underline font-semibold">Complete all cells before final collation</span>
        </div>
      )}

      {/* Spreadsheet Score Entry Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3 border-r border-slate-200 w-12 text-center">#</th>
                <th className="p-3 border-r border-slate-200 min-w-[180px]">Student Name</th>
                <th className="p-3 border-r border-slate-200 min-w-[110px]">Index ID</th>
                
                {components.map((c: any) => (
                  <th key={c.id} className="p-3 border-r border-slate-200 min-w-[130px] text-center">
                    <div>{c.name}</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      Weight: {c.weightPercentage}% • Max: {c.maxScore}
                    </div>
                  </th>
                ))}

                <th className="p-3 border-r border-slate-200 text-center bg-emerald-50 text-emerald-950 font-extrabold min-w-[100px]">
                  Total (100%)
                </th>
                <th className="p-3 border-r border-slate-200 text-center bg-emerald-50 text-emerald-950 font-extrabold min-w-[90px]">
                  WAEC Grade
                </th>
                <th className="p-3 text-right min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrollments.map((en: any, idx: number) => {
                const studentId = en.student.id;
                const total = computeRowTotal(studentId);
                const grade = getWaecGrade(total);

                return (
                  <tr key={en.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 text-center border-r border-slate-200 font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="p-3 border-r border-slate-200 font-bold text-slate-900">
                      {en.student?.user?.fullName}
                    </td>
                    <td className="p-3 border-r border-slate-200 font-mono font-bold text-emerald-800">
                      {en.student?.studentId}
                    </td>

                    {/* Cell Editors for Each Assessment Component */}
                    {components.map((c: any) => {
                      const scoreKey = `${studentId}_${c.id}`;
                      const currentVal = scoreMatrix[scoreKey];
                      const maxAllowed = c.maxScore || 100;
                      const isExceeding = currentVal !== undefined && currentVal > maxAllowed;

                      const isExam = c.name.toLowerCase().includes('exam');
                      const isLockedCell = isExam && !isExamWindowOpen;

                      return (
                        <td key={c.id} className="p-2 border-r border-slate-200 text-center">
                          <input
                            type="number"
                            step="0.5"
                            disabled={isLockedCell || isTermLocked}
                            placeholder="0"
                            value={currentVal !== undefined ? currentVal : ''}
                            onChange={(e) => handleScoreChange(studentId, c.id, e.target.value)}
                            className={`w-full p-2 text-center text-xs font-bold rounded-lg border transition ${
                              isExceeding
                                ? 'border-rose-500 bg-rose-100 text-rose-900 focus:ring-2 focus:ring-rose-500'
                                : currentVal !== undefined && currentVal > 0
                                ? 'border-slate-300 bg-emerald-50/30 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                                : 'border-slate-200 bg-slate-50 text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                            } ${isLockedCell ? 'bg-slate-100 cursor-not-allowed text-slate-400' : ''}`}
                          />
                        </td>
                      );
                    })}

                    {/* Auto-Collated Total & WAEC Grade */}
                    <td className="p-3 border-r border-slate-200 text-center font-extrabold text-slate-900 bg-emerald-50/40 text-sm">
                      {total}%
                    </td>
                    <td className="p-3 border-r border-slate-200 text-center bg-emerald-50/40">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white font-extrabold text-xs">
                        {grade}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedStudentId(studentId)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px] inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> Report Card
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paste from Excel / CSV Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Paste Raw Scores from Excel
              </h3>
              <button onClick={() => setShowPasteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Copy raw score rows from Microsoft Excel or Google Sheets and paste below. Scores will populate matching columns in student row order.
              </p>
              <textarea
                rows={6}
                placeholder="Paste tab-separated or comma-separated rows here (e.g. 18, 17, 19, 16, 88)"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="w-full p-3 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkPaste}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Check className="w-4 h-4" /> Import Scores
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Report Card Modal */}
      {selectedStudentId && reportCardData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 my-8">
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

            {/* School Branded PDF Layout */}
            <div className="border-4 border-emerald-800 p-6 rounded-xl space-y-5 bg-white text-slate-900">
              <div className="text-center space-y-1 border-b-2 border-emerald-800 pb-4">
                <h1 className="text-xl font-black text-emerald-900 uppercase tracking-wide">
                  {reportCardData.schoolProfile?.name || 'KINGS & QUEENS PREPARATORY SCHOOL'}
                </h1>
                <p className="text-xs font-bold text-slate-600 italic">
                  "{reportCardData.schoolProfile?.motto || 'Excellence, Royalty & Moral Leadership'}"
                </p>
                <p className="text-[11px] text-slate-500">
                  {reportCardData.schoolProfile?.address || 'Accra, Ghana'} • Tel: {reportCardData.schoolProfile?.phone}
                </p>
                <div className="pt-2 inline-block px-4 py-1 bg-emerald-900 text-amber-300 font-bold text-xs uppercase tracking-wider rounded">
                  PUPIL TERMINAL REPORT — TERM 1 (2025/2026)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-medium border p-3 rounded-lg bg-slate-50/70 border-slate-200">
                <div>
                  <p>Pupil Name: <strong className="text-slate-900">{reportCardData.student.fullName}</strong></p>
                  <p>Index Number: <strong className="text-emerald-800 font-mono">{reportCardData.student.studentId}</strong></p>
                  <p>Class Position: <strong className="text-amber-800 font-bold">{reportCardData.summary.positionInClass} st Out of 35</strong></p>
                </div>
                <div>
                  <p>Class & Stream: <strong className="text-slate-900">{reportCardData.student.class} ({reportCardData.student.stream})</strong></p>
                  <p>Form Teacher: <strong>{reportCardData.student.formTeacher}</strong></p>
                </div>
              </div>

              <div>
                <table className="w-full text-left border-collapse text-xs border border-slate-300">
                  <thead>
                    <tr className="bg-emerald-900 text-white font-bold">
                      <th className="p-2 border border-slate-300">Subject</th>
                      <th className="p-2 border border-slate-300">Class Score (40%)</th>
                      <th className="p-2 border border-slate-300">Exam (60%)</th>
                      <th className="p-2 border border-slate-300">Total (100%)</th>
                      <th className="p-2 border border-slate-300">WAEC Grade</th>
                      <th className="p-2 border border-slate-300">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportCardData.subjectResults?.map((res: any) => (
                      <tr key={res.subjectCode} className="border-b border-slate-200">
                        <td className="p-2 font-bold">{res.subjectName}</td>
                        <td className="p-2">36.0</td>
                        <td className="p-2">52.8</td>
                        <td className="p-2 font-bold text-emerald-800">{res.totalScore}%</td>
                        <td className="p-2 font-black text-emerald-900">{res.waecGrade}</td>
                        <td className="p-2">{res.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
