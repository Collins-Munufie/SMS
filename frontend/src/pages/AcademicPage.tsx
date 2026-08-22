import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/common/ConfirmModal';
import {
  Building2,
  Calendar,
  BookOpen,
  Layers,
  Plus,
  CheckCircle2,
  Award,
  Trash2,
  X,
  Loader2,
  GraduationCap,
  Printer,
  FileSpreadsheet,
  Users,
} from 'lucide-react';

export const AcademicPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Modals state
  const [showAddStreamModal, setShowAddStreamModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showBroadsheetModal, setShowBroadsheetModal] = useState(false);
  const [broadsheetStreamId, setBroadsheetStreamId] = useState('');
  const [itemToDelete, setItemToDelete] = useState<{ type: 'STREAM' | 'SUBJECT'; id: string; name: string } | null>(null);

  // Form states
  const [streamForm, setStreamForm] = useState({ classId: '', name: '', formTeacherId: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', category: 'CORE', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: yearsData } = useQuery({
    queryKey: ['academicYears'],
    queryFn: async () => (await api.get('/academic/years')).data,
  });

  const { data: termsData } = useQuery({
    queryKey: ['academicTerms'],
    queryFn: async () => (await api.get('/academic/terms')).data,
  });

  const { data: classesData, refetch: refetchClasses } = useQuery({
    queryKey: ['academicClasses'],
    queryFn: async () => (await api.get('/academic/classes')).data,
  });

  const { data: streamsData } = useQuery({
    queryKey: ['academicStreams'],
    queryFn: async () => {
      const res = (await api.get('/academic/streams')).data;
      if (res.streams?.[0] && !broadsheetStreamId) {
        setBroadsheetStreamId(res.streams[0].id);
      }
      return res;
    },
  });

  const { data: subjectsData, refetch: refetchSubjects } = useQuery({
    queryKey: ['academicSubjects'],
    queryFn: async () => (await api.get('/academic/subjects')).data,
  });

  const { data: staffData } = useQuery({
    queryKey: ['staffListForAcademic'],
    queryFn: async () => (await api.get('/staff')).data,
  });

  const activeTerm = termsData?.terms?.find((t: any) => t.isCurrent) || termsData?.terms?.[0];

  // Broadsheet query
  const { data: broadsheetData, isLoading: isBroadsheetLoading } = useQuery({
    queryKey: ['broadsheetData', broadsheetStreamId, activeTerm?.id],
    queryFn: async () => {
      if (!broadsheetStreamId || !activeTerm?.id) return null;
      return (
        await api.get('/reports/broadsheet', {
          params: { streamId: broadsheetStreamId, termId: activeTerm.id },
        })
      ).data;
    },
    enabled: showBroadsheetModal && !!broadsheetStreamId && !!activeTerm?.id,
  });

  const classes = classesData?.classes || [];
  const streams = streamsData?.streams || [];
  const subjects = subjectsData?.subjects || [];
  const teachers = staffData?.staff?.filter((s: any) => s.role === 'TEACHER' || s.role === 'FORM_TEACHER') || [];

  // 1. Create Stream Handler
  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamForm.classId || !streamForm.name.trim()) {
      toast.warning('Please select a class and provide a stream section name');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/academic/streams', streamForm);
      toast.success(res.data.message || 'Stream section added successfully!');
      setShowAddStreamModal(false);
      setStreamForm({ classId: '', name: '', formTeacherId: '' });
      refetchClasses();
      queryClient.invalidateQueries({ queryKey: ['academicStreams'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create stream');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Create Subject Handler
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name.trim() || !subjectForm.code.trim()) {
      toast.warning('Please provide subject name and code');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/academic/subjects', subjectForm);
      toast.success(res.data.message || 'Curriculum subject added successfully!');
      setShowAddSubjectModal(false);
      setSubjectForm({ name: '', code: '', category: 'CORE', description: '' });
      refetchSubjects();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsSubmitting(true);
    try {
      if (itemToDelete.type === 'STREAM') {
        await api.delete(`/academic/streams/${itemToDelete.id}`);
        toast.success(`Stream "${itemToDelete.name}" deleted successfully.`);
        refetchClasses();
        queryClient.invalidateQueries({ queryKey: ['academicStreams'] });
      } else {
        await api.delete(`/academic/subjects/${itemToDelete.id}`);
        toast.success(`Subject "${itemToDelete.name}" deleted successfully.`);
        refetchSubjects();
      }
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintBroadsheet = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Academic Structure & Curriculum Setup
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kings & Queens Basic Curriculum (KG 1 to Basic 9 BECE), stream sections, and master academic broadsheets
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowBroadsheetModal(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" /> Academic Broadsheet Matrix
          </button>
          <button
            onClick={() => setShowAddStreamModal(true)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Add Stream Section
          </button>
          <button
            onClick={() => setShowAddSubjectModal(true)}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>
      </div>

      {/* Grid: Academic Years & Terms Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Active Academic Year</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">2025 / 2026 Session</div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-block">
            Current Academic Calendar
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Active School Term</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">Term 1 (Michaelmas)</div>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold inline-block">
            Assessment Window Open
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Curriculum Standard</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">Ghana GES / NaCCA</div>
          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold inline-block">
            KG 1 – Basic 9 BECE Standards
          </span>
        </div>
      </div>

      {/* Classes & Streams Directory */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Basic Education Classes & Stream Sections (KG 1 to Basic 9)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-bold">{classes.length} Class Levels Configured</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c: any) => (
            <div
              key={c.id}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <strong className="text-slate-900 dark:text-white font-extrabold text-sm">{c.name}</strong>
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold">
                  {c.level}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Streams:</span>
                {c.streams && c.streams.length > 0 ? (
                  c.streams.map((s: any) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Stream {s.name}</div>
                        <div className="text-[10px] text-slate-400">
                          Form Teacher: {s.formTeacher?.fullName || 'Not assigned'}
                        </div>
                      </div>
                      <button
                        onClick={() => setItemToDelete({ type: 'STREAM', id: s.id, name: `${c.name} Stream ${s.name}` })}
                        title="Delete Stream"
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-xs italic">No streams created yet.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Curriculum Subjects */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Curriculum Subjects (NaCCA Basic Education)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-bold">{subjects.length} Subjects Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub: any) => (
            <div
              key={sub.id}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-slate-900 dark:text-white font-extrabold text-sm">{sub.name}</strong>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                    {sub.code}
                  </span>
                </div>
                <span className="text-xs text-slate-500 block mt-0.5">Category: {sub.category || 'CORE'}</span>
              </div>

              <button
                onClick={() => setItemToDelete({ type: 'SUBJECT', id: sub.id, name: sub.name })}
                title="Delete Subject"
                className="text-slate-400 hover:text-rose-600 p-1.5 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 1. Add Stream Modal */}
      {showAddStreamModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" /> Add Stream Section
              </h3>
              <button onClick={() => setShowAddStreamModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStream} className="space-y-3.5 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Class Level:</label>
                <select
                  required
                  value={streamForm.classId}
                  onChange={(e) => setStreamForm({ ...streamForm, classId: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                >
                  <option value="">Select Basic Class</option>
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Stream Section Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A, B, Gold, Diamond"
                  value={streamForm.name}
                  onChange={(e) => setStreamForm({ ...streamForm, name: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Assigned Form Teacher:
                </label>
                <select
                  value={streamForm.formTeacherId}
                  onChange={(e) => setStreamForm({ ...streamForm, formTeacherId: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                >
                  <option value="">Select Form Teacher (Optional)</option>
                  {teachers.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStreamModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-extrabold flex items-center gap-1.5 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Save Stream</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" /> Add Curriculum Subject
              </h3>
              <button onClick={() => setShowAddSubjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-3.5 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Subject Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. French Language, Career Technology"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Subject Code:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FRN-BASIC, CT-BASIC"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-mono font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category:</label>
                <select
                  value={subjectForm.category}
                  onChange={(e) => setSubjectForm({ ...subjectForm, category: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-semibold"
                >
                  <option value="CORE">CORE (Compulsory)</option>
                  <option value="ELECTIVE">ELECTIVE (Specialized)</option>
                  <option value="CO_CURRICULAR">CO-CURRICULAR / CLUB</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-extrabold flex items-center gap-1.5 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Save Subject</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Academic Broadsheet Modal */}
      {showBroadsheetModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Consolidated Academic Broadsheet Matrix
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintBroadsheet}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-500" /> Print Broadsheet
                </button>
                <button onClick={() => setShowBroadsheetModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stream Selector */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Select Stream Broadsheet:</span>
              <select
                value={broadsheetStreamId}
                onChange={(e) => setBroadsheetStreamId(e.target.value)}
                className="p-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white font-bold"
              >
                {streams.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.class?.name} Stream {s.name}
                  </option>
                ))}
              </select>
            </div>

            {isBroadsheetLoading ? (
              <div className="p-12 text-center text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
                <span>Generating broadsheet collation matrix...</span>
              </div>
            ) : broadsheetData ? (
              <div className="space-y-4 text-xs">
                {/* Header preview */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-1">
                  <h4 className="font-black text-slate-900 dark:text-white text-sm">
                    KINGS & QUEENS PREPARATORY SCHOOL
                  </h4>
                  <p className="text-slate-500 text-[11px]">
                    Official Broadsheet • {broadsheetData.stream?.className} {broadsheetData.stream?.name} •{' '}
                    {broadsheetData.term?.label} ({broadsheetData.term?.academicYear})
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                    Form Teacher: {broadsheetData.stream?.formTeacher}
                  </p>
                </div>

                {/* Broadsheet Table */}
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <th className="p-2.5">Roll</th>
                        <th className="p-2.5">Pupil Name</th>
                        <th className="p-2.5 font-mono">Index ID</th>
                        {broadsheetData.subjects?.map((sub: any) => (
                          <th key={sub.id} className="p-2.5 text-center">
                            {sub.code}
                          </th>
                        ))}
                        <th className="p-2.5 text-center font-bold">Grand Total</th>
                        <th className="p-2.5 text-center font-bold">Average</th>
                        <th className="p-2.5 text-center font-bold">WAEC</th>
                        <th className="p-2.5 text-center font-bold">Position</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {broadsheetData.studentRows?.map((row: any) => (
                        <tr key={row.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 font-bold">{row.rollNumber}</td>
                          <td className="p-2.5 font-extrabold text-slate-900 dark:text-white">{row.fullName}</td>
                          <td className="p-2.5 font-mono text-slate-400">{row.studentId}</td>
                          {broadsheetData.subjects?.map((sub: any) => {
                            const sc = row.subjectScores[sub.id];
                            return (
                              <td key={sub.id} className="p-2.5 text-center">
                                <span className="font-bold">{sc?.total || 0}</span>
                                {sc?.grade && sc.grade !== '—' && (
                                  <span className="text-[9px] text-emerald-600 font-extrabold ml-1">({sc.grade})</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="p-2.5 text-center font-bold text-slate-900 dark:text-white">{row.grandTotal}</td>
                          <td className="p-2.5 text-center font-black text-amber-500">{row.average}%</td>
                          <td className="p-2.5 text-center font-extrabold text-emerald-600">{row.overallGrade}</td>
                          <td className="p-2.5 text-center font-black text-slate-900 dark:text-white">#{row.position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">No broadsheet records available.</div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <ConfirmModal
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={handleConfirmDelete}
          isLoading={isSubmitting}
          title={`Delete ${itemToDelete.type === 'STREAM' ? 'Stream Section' : 'Subject'}`}
          message={`Are you sure you want to delete "${itemToDelete.name}"? This action will permanently remove all associated configurations.`}
          confirmText="Confirm & Delete"
        />
      )}

    </div>
  );
};
