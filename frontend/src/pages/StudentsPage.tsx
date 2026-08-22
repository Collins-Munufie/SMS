import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/common/ConfirmModal';
import {
  Users,
  Search,
  Plus,
  Upload,
  Filter,
  Download,
  User,
  Mail,
  Phone,
  Calendar,
  X,
  Trash2,
  Eye,
  Loader2,
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
  MapPin,
} from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [streamFilter, setStreamFilter] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<any>(null);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Student Form
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: 'MALE',
    dob: '2014-05-15',
    address: 'East Legon Hills, Accra, Ghana',
    classId: '',
    streamId: '',
  });

  // CSV Import State
  const [csvText, setCsvText] = useState('');

  // 1. Fetch Students
  const { data: studentsData, refetch: refetchStudents, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['studentsList', searchTerm, classFilter, streamFilter],
    queryFn: async () =>
      (
        await api.get('/students', {
          params: {
            search: searchTerm || undefined,
            classId: classFilter || undefined,
            streamId: streamFilter || undefined,
          },
        })
      ).data,
  });

  // 2. Fetch Streams & Classes
  const { data: streamsData } = useQuery({
    queryKey: ['streamsList'],
    queryFn: async () => (await api.get('/academic/streams')).data,
  });

  const { data: classesData } = useQuery({
    queryKey: ['academicClasses'],
    queryFn: async () => (await api.get('/academic/classes')).data,
  });

  const students = studentsData?.students || [];
  const streams = streamsData?.streams || [];
  const classes = classesData?.classes || [];

  // Filter streams by selected class for dependent dropdown
  const filteredStreamsForModal = formData.classId
    ? streams.filter((s: any) => s.classId === formData.classId)
    : streams;

  const filteredStreamsForFilter = classFilter
    ? streams.filter((s: any) => s.classId === classFilter)
    : streams;

  // 3. Register New Pupil Handler
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.warning('Please enter pupil full name');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/students', {
        fullName: formData.fullName,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        gender: formData.gender,
        dob: formData.dob,
        address: formData.address,
        streamId: formData.streamId || undefined,
      });

      toast.success(res.data.message || 'Pupil enrolled successfully!');
      setShowAddModal(false);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        gender: 'MALE',
        dob: '2014-05-15',
        address: 'East Legon Hills, Accra, Ghana',
        classId: '',
        streamId: '',
      });
      refetchStudents();
      queryClient.invalidateQueries({ queryKey: ['caGrid'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to register pupil');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Bulk CSV Import Handler
  const handleBulkImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) {
      toast.warning('Please paste CSV roster text');
      return;
    }

    setIsSubmitting(true);
    try {
      const lines = csvText.trim().split('\n');
      const studentsList = lines
        .map((line) => {
          const parts = line.split(/[\t,]/).map((p) => p.trim());
          if (parts[0]) {
            return {
              fullName: parts[0],
              email: parts[1] || undefined,
              gender: parts[2]?.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE',
              dob: parts[3] || '2014-01-01',
              address: parts[4] || 'East Legon Hills, Accra',
            };
          }
          return null;
        })
        .filter(Boolean);

      if (studentsList.length === 0) {
        toast.error('No valid student rows detected in CSV input');
        setIsSubmitting(false);
        return;
      }

      const res = await api.post('/students/bulk-import', {
        studentsList,
        streamId: formData.streamId || streams[0]?.id,
      });

      toast.success(res.data.message || `Imported ${studentsList.length} pupils successfully!`);
      setShowImportModal(false);
      setCsvText('');
      refetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Bulk admission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Delete Pupil Handler
  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/students/${studentToDelete.id}`);
      toast.success(`Pupil "${studentToDelete.user?.fullName}" deleted successfully.`);
      setStudentToDelete(null);
      refetchStudents();
      queryClient.invalidateQueries({ queryKey: ['caGrid'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete pupil');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Pupils Directory & Admissions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registered pupils across Kings & Queens Preparatory School (KG 1 to Basic 9)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <Upload className="w-4 h-4 text-amber-400" /> Bulk CSV Import
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Enroll New Pupil
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pupils by name, email or Index ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Dependent Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setStreamFilter('');
              }}
              className="p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
            >
              <option value="">All Basic Classes</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.level})
                </option>
              ))}
            </select>
          </div>

          {/* Stream Filter */}
          <select
            value={streamFilter}
            onChange={(e) => setStreamFilter(e.target.value)}
            disabled={filteredStreamsForFilter.length === 0}
            className="p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold disabled:opacity-50"
          >
            <option value="">All Streams</option>
            {filteredStreamsForFilter.map((s: any) => (
              <option key={s.id} value={s.id}>
                Stream: {s.class?.name} {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pupils Grid */}
      {isStudentsLoading ? (
        <div className="p-12 text-center text-slate-500 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
          <p className="text-xs font-bold">Loading pupil admissions directory...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 max-w-md mx-auto space-y-3">
          <Users className="w-12 h-12 text-slate-400 mx-auto" />
          <h4 className="font-extrabold text-slate-900 dark:text-white text-base">No Pupils Found</h4>
          <p className="text-xs text-slate-500">No pupils match your search or class filter.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setClassFilter('');
              setStreamFilter('');
            }}
            className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((st: any) => {
            const currentStream = st.enrollments?.[0]?.stream;
            return (
              <div
                key={st.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={st.photoUrl || st.user?.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150'}
                        alt={st.user?.fullName}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/20 shrink-0"
                      />
                      <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{st.user?.fullName}</h3>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold">
                          {st.studentId}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setStudentToDelete(st)}
                      title="Delete pupil record"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 mt-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{st.user?.email}</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                      <span>Class Stream:</span>
                      <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
                        {currentStream ? `${currentStream.class?.name} ${currentStream.name}` : 'Basic 7A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setViewingStudent(st)}
                    className="w-full py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>View Profile</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Enroll New Pupil Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" /> Enroll New Pupil
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Pupil Full Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwame Mensah"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Gender:</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Date of Birth:</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address (Optional):
                </label>
                <input
                  type="email"
                  placeholder="e.g. kwame@kqprep.edu.gh"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Dependent Class & Stream selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Class Level:</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value, streamId: '' })}
                    className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Assigned Stream:</label>
                  <select
                    required
                    value={formData.streamId}
                    onChange={(e) => setFormData({ ...formData, streamId: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                  >
                    <option value="">Select Stream</option>
                    {filteredStreamsForModal.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.class?.name} {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Register & Enroll</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Bulk CSV Admissions Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Bulk CSV Admissions Import
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkImportSubmit} className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                Paste tabular rows from Excel (Columns: <code>FullName, Email, Gender, DOB, Address</code>) or upload CSV:
              </p>

              <textarea
                rows={6}
                required
                placeholder="e.g. Kwame Mensah, kwame@kqprep.edu.gh, MALE, 2014-03-20, Accra&#10;Ama Tutu, ama@kqprep.edu.gh, FEMALE, 2014-06-11, Accra"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full p-3 font-mono text-xs border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
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
                      <span>Importing Pupils...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Import Pupils</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. View Student Profile Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Pupil Academic Profile</h3>
              <button onClick={() => setViewingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <img
                  src={viewingStudent.photoUrl || viewingStudent.user?.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150'}
                  alt={viewingStudent.user?.fullName}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/30 shrink-0"
                />
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-base">{viewingStudent.user?.fullName}</h4>
                  <p className="font-mono text-emerald-700 dark:text-emerald-400 font-extrabold">{viewingStudent.studentId}</p>
                  <p className="text-slate-500">{viewingStudent.user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Gender</span>
                  <strong className="text-slate-900 dark:text-white">{viewingStudent.gender || 'MALE'}</strong>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Class Stream</span>
                  <strong className="text-slate-900 dark:text-white">
                    {viewingStudent.enrollments?.[0]?.stream?.class?.name} {viewingStudent.enrollments?.[0]?.stream?.name || 'A'}
                  </strong>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewingStudent(null);
                    navigate('/grades');
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Open Report Card & Scores</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Delete Confirmation Modal */}
      {studentToDelete && (
        <ConfirmModal
          isOpen={!!studentToDelete}
          onClose={() => setStudentToDelete(null)}
          onConfirm={handleConfirmDelete}
          isLoading={isSubmitting}
          title="Delete Pupil Record"
          message={`Are you sure you want to permanently delete pupil "${studentToDelete.user?.fullName}" (${studentToDelete.studentId})? All associated grades, attendance records, and invoices will be removed.`}
          confirmText="Confirm & Delete Pupil"
        />
      )}

    </div>
  );
};
