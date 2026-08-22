import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Edit3,
  BookOpen,
  Sparkles,
  UserCheck,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { ReportCardPayload, WAEC_GRADING_SCALE, getWaecGrade } from '../components/grades/types';
import { ReportCardView } from '../components/grades/ReportCardView';
import { BatchReportCardModal } from '../components/grades/BatchReportCardModal';
import { RemarksEditorModal } from '../components/grades/RemarksEditorModal';
import { useToast } from '../context/ToastContext';

export const GradesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // Selection state
  const [selectedAllocId, setSelectedAllocId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [remarksPupil, setRemarksPupil] = useState<{ id: string; name: string; formRemarks: string; headRemarks: string } | null>(null);
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pasteText, setPasteText] = useState<string>('');

  // Live Score Grid Inputs Matrix state: { `${studentId}_${componentId}`: rawScore }
  const [scoreMatrix, setScoreMatrix] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 1. Fetch Teacher Allocations (Scoped by backend to assigned subjects & classes)
  const { data: allocData, isLoading: isAllocLoading } = useQuery({
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

  // 2. Fetch Terms
  const { data: termsData } = useQuery({
    queryKey: ['gradesTerms'],
    queryFn: async () => (await api.get('/academic/terms')).data,
  });

  const activeTerm = termsData?.terms?.find((t: any) => t.isCurrent) || termsData?.terms?.[0];
  const activeTermId = activeTerm?.id;

  // 3. Fetch CA Grid Payload for selected Allocation & Term
  const { data: gridData, refetch: refetchGrid, isLoading: isGridLoading } = useQuery({
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

  // 4. Fetch Single Student Report Card (when viewing report card)
  const { data: reportCardData, refetch: refetchReportCard } = useQuery({
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

  // Live Score input change handler
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

  // Batch Save & Auto-Collate Scores
  const handleSaveAll = async () => {
    if (!currentAlloc || !activeTermId) return;
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

      toast.success(res.data.message || 'Scores saved and auto-collated successfully!');
      queryClient.invalidateQueries({ queryKey: ['caGrid'] });
      queryClient.invalidateQueries({ queryKey: ['reportCard'] });
      queryClient.invalidateQueries({ queryKey: ['batchClassReportCards'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save scores');
    } finally {
      setIsSaving(false);
    }
  };

  // Bulk Paste from Excel / CSV
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
    toast.success('Scores imported from clipboard successfully! Click "Save & Collate" to persist.');
  };

  // Compute Class Ranks explicitly
  const handleComputeRanks = async () => {
    if (!currentAlloc || !activeTermId) return;
    try {
      const res = await api.post('/grades/compute-ranks', {
        streamId: currentAlloc.streamId,
        termId: activeTermId,
      });
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ['caGrid'] });
      queryClient.invalidateQueries({ queryKey: ['reportCard'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to compute ranks');
    }
  };

  // Toggle Term Lock (Admin only)
  const handleToggleTermLock = async () => {
    if (!activeTermId) return;
    try {
      const res = await api.post('/grades/term-lock', {
        termId: activeTermId,
        isTermLocked: !isTermLocked,
      });
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ['caGrid'] });
      queryClient.invalidateQueries({ queryKey: ['gradesTerms'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to toggle term lock');
    }
  };

  // Save Student Remarks
  const handleSaveRemarks = async (payload: any) => {
    try {
      await api.post('/grades/remarks', payload);
      toast.success('Student report card remarks saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['reportCard'] });
      queryClient.invalidateQueries({ queryKey: ['batchClassReportCards'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save remarks');
    }
  };

  // If a single report card is active, render full-screen report card view
  if (selectedStudentId && reportCardData) {
    return (
      <div className="space-y-6">
        <ReportCardView
          reportCard={reportCardData}
          onClose={() => setSelectedStudentId(null)}
          onEditRemarks={() =>
            setRemarksPupil({
              id: reportCardData.student.id,
              name: reportCardData.student.fullName,
              formRemarks: reportCardData.summary.formTeacherRemarks,
              headRemarks: reportCardData.summary.headteacherRemarks,
            })
          }
        />

        {remarksPupil && (
          <RemarksEditorModal
            isOpen={!!remarksPupil}
            onClose={() => setRemarksPupil(null)}
            studentName={remarksPupil.name}
            studentId={remarksPupil.id}
            termId={activeTermId}
            initialFormTeacherRemarks={remarksPupil.formRemarks}
            initialHeadteacherRemarks={remarksPupil.headRemarks}
            onSave={handleSaveRemarks}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Continuous Assessment & Terminal Score Entry
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Teacher Score Entry • Auto-Collation into WAEC Grades & Printable Official Report Cards
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowPasteModal(true)}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Paste from Excel</span>
          </button>

          {currentAlloc && (
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-md transition"
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Print Class Report Booklet</span>
            </button>
          )}

          <button
            onClick={handleSaveAll}
            disabled={isSaving || isTermLocked}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-2xl font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/20 transition"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Collating...' : 'Save & Collate Scores'}</span>
          </button>
        </div>
      </div>

      {/* 2. Teacher Scoped Allocations Selector */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Your Assigned Class & Subject Allocations</span>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            {isAdmin ? 'Admin Full Access' : 'Teacher Scoped Access'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {allocations.map((alloc: any) => (
            <button
              key={alloc.id}
              onClick={() => setSelectedAllocId(alloc.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition flex items-center gap-2 ${
                selectedAllocId === alloc.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
              }`}
            >
              <span>
                {alloc.stream?.class?.name} {alloc.stream?.name} — {alloc.subject?.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Assessment Component Weights & Term Lock Status Ribbon */}
      <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1.5 w-full md:w-auto">
          <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
            <span>Assessment Component Weightings</span>
            <span className="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              Total = 100% (40% CA + 60% Exam)
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300">
            {components.map((c: any) => (
              <div key={c.id} className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold">{c.name}:</span>
                <strong className="text-white font-mono">{c.weightPercentage}%</strong>
                <span className="text-slate-400 text-[10px]">(Max: {c.maxScore})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lock Controls */}
        <div className="flex items-center gap-2">
          {isTermLocked ? (
            <div className="px-3.5 py-1.5 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Term Assessment Locked</span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Assessment Window Open</span>
            </div>
          )}

          {isAdmin && (
            <button
              onClick={handleToggleTermLock}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition"
            >
              {isTermLocked ? 'Admin Unlock' : 'Admin Lock'}
            </button>
          )}
        </div>
      </div>

      {/* 4. Missing Scores Alert */}
      {summary && !summary.isComplete && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-2xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Incomplete Sheet Notice: <strong>{summary.missingEntriesCount} component score(s)</strong> are currently unentered in this class list.
            </span>
          </div>
          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
            Auto-collation recalculates dynamically
          </span>
        </div>
      )}

      {/* 5. Spreadsheet Score Entry Grid Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[850px]">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 w-12 text-center">#</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 min-w-[190px]">Pupil Name</th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 min-w-[120px]">Index ID</th>
                
                {components.map((c: any) => (
                  <th key={c.id} className="p-3.5 border-r border-slate-200 dark:border-slate-800 min-w-[130px] text-center">
                    <div>{c.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Weight: {c.weightPercentage}% • Max: {c.maxScore}
                    </div>
                  </th>
                ))}

                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 text-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-extrabold min-w-[110px]">
                  Total (100%)
                </th>
                <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 text-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-extrabold min-w-[90px]">
                  WAEC Grade
                </th>
                <th className="p-3.5 text-right min-w-[140px]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {enrollments.map((en: any, idx: number) => {
                const studentId = en.student.id;
                const total = computeRowTotal(studentId);
                const waecObj = getWaecGrade(total);

                return (
                  <tr key={en.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="p-3.5 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                      {en.student?.user?.fullName}
                    </td>
                    <td className="p-3.5 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {en.student?.studentId}
                    </td>

                    {/* Cell Inputs for Each Assessment Component */}
                    {components.map((c: any) => {
                      const scoreKey = `${studentId}_${c.id}`;
                      const currentVal = scoreMatrix[scoreKey];
                      const maxAllowed = c.maxScore || 100;
                      const isExceeding = currentVal !== undefined && currentVal > maxAllowed;

                      return (
                        <td key={c.id} className="p-2 border-r border-slate-200 dark:border-slate-800 text-center">
                          <input
                            type="number"
                            step="0.5"
                            disabled={isTermLocked}
                            placeholder="0"
                            value={currentVal !== undefined ? currentVal : ''}
                            onChange={(e) => handleScoreChange(studentId, c.id, e.target.value)}
                            className={`w-full p-2 text-center text-xs font-bold rounded-xl border transition ${
                              isExceeding
                                ? 'border-rose-500 bg-rose-100 text-rose-900'
                                : currentVal !== undefined && currentVal > 0
                                ? 'border-slate-300 dark:border-slate-600 bg-emerald-50/30 dark:bg-emerald-950/20 text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500'
                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                            }`}
                          />
                        </td>
                      );
                    })}

                    {/* Auto-Calculated Weighted Total & WAEC Grade */}
                    <td className="p-3.5 border-r border-slate-200 dark:border-slate-800 text-center font-black text-slate-900 dark:text-white bg-emerald-50/40 dark:bg-emerald-950/20 text-sm">
                      {total}%
                    </td>
                    <td className="p-3.5 border-r border-slate-200 dark:border-slate-800 text-center bg-emerald-50/40 dark:bg-emerald-950/20">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black ${waecObj.color}`}>
                        {waecObj.grade}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedStudentId(studentId)}
                        className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 rounded-xl font-bold text-[11px] inline-flex items-center gap-1.5 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Report Card</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Modals */}
      {/* Batch Class Report Card Modal */}
      {isBatchModalOpen && currentAlloc && (
        <BatchReportCardModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          streamId={currentAlloc.streamId}
          streamName={`${currentAlloc.stream?.class?.name} ${currentAlloc.stream?.name}`}
          termId={activeTermId}
        />
      )}

      {/* Paste from Excel Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Paste Raw Scores from Excel
              </h3>
              <button onClick={() => setShowPasteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                Copy raw score rows from Microsoft Excel or Google Sheets and paste below. Scores will populate matching assessment columns in student row order.
              </p>
              <textarea
                rows={6}
                placeholder="Paste tab-separated or comma-separated rows here (e.g. 18	17	19	16	88)"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="w-full p-3 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkPaste}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Import Scores
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
