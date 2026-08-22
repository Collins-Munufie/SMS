import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import {
  HeartHandshake,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  User,
  ChevronRight,
  X,
  Loader2,
  Users,
} from 'lucide-react';

export const GuardiansPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Guardian Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '+233 24 999 8877',
    relationship: 'Parent',
    address: 'East Legon Hills, Accra, Ghana',
    occupation: 'Civil Servant',
    studentId: '',
  });

  const { data: guardiansData, refetch: refetchGuardians, isLoading: isGuardiansLoading } = useQuery({
    queryKey: ['guardiansList', searchTerm],
    queryFn: async () => (await api.get('/guardians', { params: { search: searchTerm || undefined } })).data,
  });

  const { data: studentsData } = useQuery({
    queryKey: ['studentsListForGuardians'],
    queryFn: async () => (await api.get('/students')).data,
  });

  const guardians = guardiansData?.guardians || [];
  const students = studentsData?.students || [];

  // Register Guardian Handler
  const handleAddGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast.warning('Please provide guardian name and email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/guardians', formData);
      toast.success(res.data.message || 'Parent / Guardian registered and linked successfully!');
      setShowAddModal(false);
      setFormData({
        fullName: '',
        email: '',
        phone: '+233 24 999 8877',
        relationship: 'Parent',
        address: 'East Legon Hills, Accra, Ghana',
        occupation: 'Civil Servant',
        studentId: '',
      });
      refetchGuardians();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to register guardian');
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
            Guardians & Parent Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Parent accounts linked to Kings & Queens Preparatory pupils for portal access and SMS broadcasts
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> Register & Link Guardian
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guardians by parent name, email or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Guardians Grid */}
      {isGuardiansLoading ? (
        <div className="p-12 text-center text-slate-500 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
          <p className="text-xs font-bold">Loading guardians directory...</p>
        </div>
      ) : guardians.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 max-w-md mx-auto space-y-3">
          <HeartHandshake className="w-12 h-12 text-slate-400 mx-auto" />
          <h4 className="font-extrabold text-slate-900 dark:text-white text-base">No Guardians Found</h4>
          <p className="text-xs text-slate-500">Register parent/guardian accounts to link them with enrolled pupils.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guardians.map((g: any) => (
            <div
              key={g.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-3">
                <img
                  src={g.user?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'}
                  alt={g.user?.fullName}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/20 shrink-0"
                />
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{g.user?.fullName}</h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                    {g.relationship || 'Parent'} • {g.occupation || 'Guardian'}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{g.user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{g.user?.phone || '+233 24 999 8877'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{g.address || 'East Legon Hills, Accra'}</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
                <div className="font-bold text-slate-700 dark:text-slate-300 text-[10px] uppercase tracking-wider mb-1">
                  Linked Wards
                </div>
                {g.wards && g.wards.length > 0 ? (
                  g.wards.map((w: any) => (
                    <div key={w.studentId || w.id} className="flex items-center justify-between text-slate-800 dark:text-slate-200 font-semibold py-0.5">
                      <span>{w.student?.user?.fullName}</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-mono">
                        {w.student?.studentId}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-[11px] italic">No wards linked yet</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Guardian Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-emerald-600" /> Register Parent / Guardian
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddGuardian} className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Parent Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mr. Samuel Osei"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Address:</label>
                <input
                  type="email"
                  required
                  placeholder="parent@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Phone Number:</label>
                  <input
                    type="tel"
                    required
                    placeholder="+233 24 000 0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Relationship:</label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Sponsor">Sponsor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Link Pupil / Ward:</label>
                <select
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                >
                  <option value="">Select Enrolled Pupil (Optional)</option>
                  {students.map((st: any) => (
                    <option key={st.id} value={st.id}>
                      {st.user?.fullName} ({st.studentId})
                    </option>
                  ))}
                </select>
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
                      <span>Register Guardian</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
