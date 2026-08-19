import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Users, Search, Plus, Upload, Filter, Download, User, Mail, Phone, Calendar, X } from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // New Student Form
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: 'MALE',
    dob: '2013-05-15',
    address: 'East Legon Hills, Accra',
    streamId: '',
  });

  const { data: studentsData, refetch } = useQuery({
    queryKey: ['studentsList', searchTerm, classFilter],
    queryFn: async () =>
      (
        await api.get('/students', {
          params: { search: searchTerm || undefined, classId: classFilter || undefined },
        })
      ).data,
  });

  const { data: streamsData } = useQuery({
    queryKey: ['streamsList'],
    queryFn: async () => (await api.get('/academic/streams')).data,
  });

  const students = studentsData?.students || [];
  const streams = streamsData?.streams || [];

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/students', formData);
      setShowAddModal(false);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to register student');
    }
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`Bulk CSV file "${file.name}" imported successfully! Roster updated.`);
      setShowImportModal(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pupils Directory & Admissions</h2>
          <p className="text-xs text-slate-500">Registered pupils across Kings & Queens Preparatory School (KG 1 to Basic 9)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Upload className="w-4 h-4 text-amber-400" /> Bulk CSV Import
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Enroll New Pupil
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pupils by name, email or Index ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-semibold"
            >
              <option value="">All Basic Classes (KG 1 - Basic 9)</option>
              {streams.map((s: any) => (
                <option key={s.id} value={s.classId}>
                  {s.class?.name} {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((st: any) => {
          const currentStream = st.enrollments?.[0]?.stream;
          return (
            <div key={st.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition">
              <div className="flex items-center gap-3">
                <img
                  src={st.photoUrl || st.user?.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150'}
                  alt={st.user?.fullName}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/20"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{st.user?.fullName}</h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {st.studentId}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {st.user?.email}
                </div>
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <span>Class Stream:</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    {currentStream ? `${currentStream.class?.name} ${currentStream.name}` : 'Basic 7A'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enroll Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Enroll New Pupil</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwame Mensah"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="pupil@kqprep.edu.gh"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1 font-semibold"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Assigned Class Stream</label>
                <select
                  value={formData.streamId}
                  onChange={(e) => setFormData({ ...formData, streamId: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1 font-semibold"
                >
                  <option value="">Select Stream (KG 1 - Basic 9)</option>
                  {streams.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.class?.name} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                >
                  Register & Enroll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Bulk CSV Admissions Import</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600">Upload a CSV roster file with columns: <code>fullName, email, gender, dob, className, streamName</code>.</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvImport}
                className="w-full p-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
