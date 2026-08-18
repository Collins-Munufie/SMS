import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { UserCheck, Search, Plus, Mail, Phone, BookOpen, Building2, X, Check } from 'lucide-react';

export const StaffPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState<any>(null);

  // New staff form
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'TEACHER',
    phone: '+233 24 000 0000',
  });

  // Allocation form
  const [allocStreamId, setAllocStreamId] = useState('');
  const [allocSubjectId, setAllocSubjectId] = useState('');

  const { data: staffData, refetch } = useQuery({
    queryKey: ['staffList', searchTerm],
    queryFn: async () => (await api.get('/staff', { params: { search: searchTerm } })).data,
  });

  const { data: streamsData } = useQuery({
    queryKey: ['streamsList'],
    queryFn: async () => (await api.get('/academic/streams')).data,
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjectsList'],
    queryFn: async () => (await api.get('/academic/subjects')).data,
  });

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/staff', formData);
      setShowAddModal(false);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to register staff member');
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAllocateModal) return;
    try {
      await api.post('/staff/allocations', {
        teacherId: showAllocateModal.id,
        streamId: allocStreamId,
        subjectId: allocSubjectId,
      });
      setShowAllocateModal(null);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to allocate subject/stream');
    }
  };

  const staff = staffData?.staff || [];
  const streams = streamsData?.streams || [];
  const subjects = subjectsData?.subjects || [];

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Staff & Faculty Management</h2>
          <p className="text-xs text-slate-500">Register teachers, form teachers, bursars & allocate subjects to class streams</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Register New Staff
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search staff by name, email or phone..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((st: any) => (
          <div key={st.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={st.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'}
                  alt=""
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/20"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{st.fullName}</h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {st.role}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {st.email}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {st.phone || 'N/A'}
                </div>
              </div>

              {/* Subject Allocations */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subject Allocations</div>
                {st.subjectTeachings?.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {st.subjectTeachings.map((t: any) => (
                      <span key={t.id} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-semibold">
                        {t.subject.name} ({t.stream?.class?.name} {t.stream?.name})
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">No subjects allocated yet</span>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setShowAllocateModal(st);
                if (streams[0]) setAllocStreamId(streams[0].id);
                if (subjects[0]) setAllocSubjectId(subjects[0].id);
              }}
              className="w-full mt-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" /> Allocate Subject & Class
            </button>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Register New Staff Member</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mr. Kwaku Browning"
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
                  placeholder="teacher@achimota.edu.gh"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Assigned System Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1 font-semibold"
                >
                  <option value="TEACHER">Subject Teacher</option>
                  <option value="FORM_TEACHER">Form / Homeroom Teacher</option>
                  <option value="BURSAR">Bursar / Accountant</option>
                  <option value="ADMIN">Registrar Admin</option>
                  <option value="LIBRARIAN">Librarian</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Ghana Phone Number</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1"
                />
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
                  Register Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Allocate Subject & Stream</h3>
                <p className="text-xs text-slate-500">Teacher: {showAllocateModal.fullName}</p>
              </div>
              <button onClick={() => setShowAllocateModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAllocate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Select Stream / Class</label>
                <select
                  value={allocStreamId}
                  onChange={(e) => setAllocStreamId(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1 font-semibold"
                >
                  {streams.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.class?.name} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Select Subject</label>
                <select
                  value={allocSubjectId}
                  onChange={(e) => setAllocSubjectId(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1 font-semibold"
                >
                  {subjects.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
