import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/common/ConfirmModal';
import {
  UserCheck,
  Search,
  Plus,
  Mail,
  Phone,
  BookOpen,
  Building2,
  X,
  Check,
  ShieldAlert,
  ShieldCheck,
  UserX,
  RotateCcw,
  History,
  AlertTriangle,
  Lock,
  Filter,
  Trash2,
  Layers,
  Loader2,
} from 'lucide-react';

export const StaffPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'staff' | 'access'>('staff');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [allocatingTeacher, setAllocatingTeacher] = useState<any>(null);
  const [staffToDelete, setStaffToDelete] = useState<any>(null);
  const [revokeUserModal, setRevokeUserModal] = useState<any>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New staff form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'TEACHER',
    phone: '+233 24 555 6677',
  });

  // Allocation form state
  const [allocForm, setAllocForm] = useState({
    classId: '',
    streamId: '',
    subjectId: '',
  });

  // 1. Fetch Staff
  const { data: staffData, refetch: refetchStaff, isLoading: isStaffLoading } = useQuery({
    queryKey: ['staffList'],
    queryFn: async () => (await api.get('/staff')).data,
  });

  // 2. Fetch Users Directory & Audit
  const { data: usersData, refetch: refetchUsers } = useQuery({
    queryKey: ['allUsersDirectory', roleFilter, statusFilter, searchTerm],
    queryFn: async () =>
      (
        await api.get('/auth/users', {
          params: { role: roleFilter || undefined, search: searchTerm || undefined, status: statusFilter || undefined },
        })
      ).data,
  });

  const { data: auditData, refetch: refetchAudit } = useQuery({
    queryKey: ['userAuditLogs'],
    queryFn: async () => (await api.get('/auth/audit-logs')).data,
  });

  // 3. Fetch Classes, Streams, Subjects for Allocation modal
  const { data: classesData } = useQuery({
    queryKey: ['academicClasses'],
    queryFn: async () => (await api.get('/academic/classes')).data,
  });

  const { data: streamsData } = useQuery({
    queryKey: ['streamsList'],
    queryFn: async () => (await api.get('/academic/streams')).data,
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['academicSubjects'],
    queryFn: async () => (await api.get('/academic/subjects')).data,
  });

  const staff = staffData?.staff || [];
  const usersList = usersData?.users || [];
  const auditLogs = auditData?.logs || [];
  const classes = classesData?.classes || [];
  const streams = streamsData?.streams || [];
  const subjects = subjectsData?.subjects || [];

  const filteredStreamsForAlloc = allocForm.classId
    ? streams.filter((s: any) => s.classId === allocForm.classId)
    : streams;

  // 1. Register Staff Handler
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast.warning('Please provide staff name and email');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/staff', formData);
      toast.success(res.data.message || 'Staff member registered successfully!');
      setShowAddModal(false);
      setFormData({
        fullName: '',
        email: '',
        role: 'TEACHER',
        phone: '+233 24 555 6677',
      });
      refetchStaff();
      refetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add staff');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Allocate Subject & Stream Handler
  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocForm.streamId || !allocForm.subjectId || !allocatingTeacher) {
      toast.warning('Please select a class stream and a subject');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/staff/allocations', {
        teacherId: allocatingTeacher.id,
        streamId: allocForm.streamId,
        subjectId: allocForm.subjectId,
      });

      toast.success(res.data.message || 'Subject allocated to teacher successfully!');
      setAllocatingTeacher(null);
      setAllocForm({ classId: '', streamId: '', subjectId: '' });
      refetchStaff();
      queryClient.invalidateQueries({ queryKey: ['teacherAllocations'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to allocate subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Delete Staff Handler
  const handleConfirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/staff/${staffToDelete.id}`);
      toast.success(`Staff member "${staffToDelete.fullName}" deleted successfully.`);
      setStaffToDelete(null);
      refetchStaff();
      refetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Revoke / Reinstate Handler
  const handleConfirmRevokeOrReinstate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeUserModal) return;

    setIsSubmitting(true);
    try {
      const isRevoking = revokeUserModal.action === 'REVOKE';
      const endpoint = isRevoking ? '/auth/revoke-role' : '/auth/reinstate-role';

      const res = await api.post(endpoint, {
        targetUserId: revokeUserModal.user.id,
        reason: revokeReason || (isRevoking ? 'Administrative revocation' : 'Restored by Admin'),
      });

      toast.success(res.data.message);
      setRevokeUserModal(null);
      setRevokeReason('');
      refetchUsers();
      refetchAudit();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Staff Directory & Access Revocation Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Faculty allocations, access control, and instant role revocation with accountability audit logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'staff' ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> Add Staff Member
            </button>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-slate-800">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Admin Access Controller Active
            </div>
          )}
        </div>
      </div>

      {/* Main Tabs Header */}
      <div className="flex items-center gap-3 border-b-2 border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'staff'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" /> Staff Directory & Allocations
        </button>

        <button
          onClick={() => setActiveTab('access')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'access'
              ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-500/30'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500" /> User Access & Role Revocation Center
        </button>
      </div>

      {/* Tab 1: Staff Directory */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff by name, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map((s: any) => (
              <div
                key={s.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={s.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'}
                        alt={s.fullName}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/20 shrink-0"
                      />
                      <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{s.fullName}</h3>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                          {s.role}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setStaffToDelete(s)}
                      title="Delete staff record"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 mt-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{s.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{s.phone || '+233 24 555 6677'}</span>
                    </div>
                  </div>

                  {/* Assigned Teachings list */}
                  {s.subjectTeachings && s.subjectTeachings.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Subject Allocations:</span>
                      <div className="flex flex-wrap gap-1">
                        {s.subjectTeachings.map((st: any) => (
                          <span key={st.id || `${st.subjectId}_${st.streamId}`} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-slate-700 dark:text-slate-300 text-[10px]">
                            {st.stream?.class?.name} {st.stream?.name} — {st.subject?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setAllocatingTeacher(s);
                      setAllocForm({ classId: '', streamId: '', subjectId: '' });
                    }}
                    className="w-full py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Allocate Subject & Stream</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: User Access & Role Revocation Center */}
      {activeTab === 'access' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user accounts by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                >
                  <option value="">All User Roles</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Registrar Admin</option>
                  <option value="TEACHER">Subject Teacher</option>
                  <option value="FORM_TEACHER">Form Teacher</option>
                  <option value="BURSAR">Bursar / Accountant</option>
                  <option value="STUDENT">Student</option>
                  <option value="PARENT">Parent / Guardian</option>
                  <option value="LIBRARIAN">Librarian</option>
                </select>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
              >
                <option value="">All Statuses</option>
                <option value="active">Active Accounts</option>
                <option value="revoked">Revoked Accounts</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold text-slate-800 dark:text-white text-xs">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Registered User Accounts Access Directory
              </span>
              <span>Total Accounts: {usersList.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase">
                    <th className="p-3.5">User Account</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5">Access Status</th>
                    <th className="p-3.5 text-right">Role Access Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {usersList.map((u: any) => {
                    const isSelf = currentUser?.id === u.id;
                    const isAdminTarget = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
                    const isSuperAdminCurrent = currentUser?.role === 'SUPER_ADMIN';
                    const canModify = isSuperAdminCurrent || (!isAdminTarget && !isSelf);

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                          <img
                            src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                            alt={u.fullName}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
                          />
                          <div>
                            <div>{u.fullName} {isSelf && <span className="text-[10px] text-emerald-600 font-normal">(You)</span>}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{u.email}</div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[10px]">
                            {u.role}
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-600 dark:text-slate-400">{u.phone || '+233 24 000 0000'}</td>

                        <td className="p-3.5">
                          {u.isActive ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 w-fit">
                              <Check className="w-3 h-3" /> Active Access
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] flex items-center gap-1 w-fit">
                              <UserX className="w-3 h-3" /> Role Revoked
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-right">
                          {u.isActive ? (
                            <button
                              onClick={() => setRevokeUserModal({ user: u, action: 'REVOKE' })}
                              disabled={!canModify}
                              title={!canModify ? 'Only Super Admin can revoke Admin access' : 'Revoke user role & access'}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 transition"
                            >
                              <UserX className="w-3.5 h-3.5" /> Revoke Role Access
                            </button>
                          ) : (
                            <button
                              onClick={() => setRevokeUserModal({ user: u, action: 'REINSTATE' })}
                              disabled={!canModify}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Reinstate Access
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <History className="w-4 h-4 text-emerald-600" /> Action Audit Log (Accountability Trail)
              </div>
              <span className="text-xs text-slate-500">Tracks who revoked/reinstated role permissions</span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {auditLogs.map((log: any) => (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                    log.action === 'REVOKED'
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-950 dark:text-rose-200'
                      : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-950 dark:text-emerald-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        log.action === 'REVOKED' ? 'bg-rose-700 text-white' : 'bg-emerald-700 text-white'
                      }`}>
                        {log.action}
                      </span>
                      <span>Target: {log.targetUser} ({log.targetUserRole})</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 italic text-[11px]">Reason: "{log.reason || 'N/A'}"</p>
                  </div>

                  <div className="text-right text-[11px] text-slate-500 font-medium">
                    <div>Performed by: <strong>{log.performedBy} ({log.performedByRole})</strong></div>
                    <div>{new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 1. Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" /> Add Staff Member
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mr. Kweku Browning"
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
                  placeholder="teacher@kqprep.edu.gh"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Assigned Role:</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                >
                  <option value="TEACHER">Subject Teacher</option>
                  <option value="FORM_TEACHER">Form Teacher</option>
                  <option value="BURSAR">Bursar / Accountant</option>
                  <option value="LIBRARIAN">Librarian</option>
                  <option value="ADMIN">Registrar Admin</option>
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
                      <span>Register Staff</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Allocate Subject & Stream Modal */}
      {allocatingTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" /> Allocate Subject & Stream
              </h3>
              <button onClick={() => setAllocatingTeacher(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAllocateSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Allocating Faculty:</span>
                <strong className="text-slate-900 dark:text-white text-sm">{allocatingTeacher.fullName}</strong>
                <p className="text-slate-500">{allocatingTeacher.email}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Subject:</label>
                <select
                  required
                  value={allocForm.subjectId}
                  onChange={(e) => setAllocForm({ ...allocForm, subjectId: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                >
                  <option value="">Select Curriculum Subject</option>
                  {subjects.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Class Level:</label>
                  <select
                    value={allocForm.classId}
                    onChange={(e) => setAllocForm({ ...allocForm, classId: e.target.value, streamId: '' })}
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Stream Section:</label>
                  <select
                    required
                    value={allocForm.streamId}
                    onChange={(e) => setAllocForm({ ...allocForm, streamId: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                  >
                    <option value="">Select Stream</option>
                    {filteredStreamsForAlloc.map((s: any) => (
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
                  onClick={() => setAllocatingTeacher(null)}
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
                      <span>Allocating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm Allocation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Revoke/Reinstate Modal */}
      {revokeUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                {revokeUserModal.action === 'REVOKE' ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-600" /> Confirm Role Revocation
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-5 h-5 text-emerald-600" /> Confirm Reinstatement
                  </>
                )}
              </h3>
              <button onClick={() => setRevokeUserModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRevokeOrReinstate} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs space-y-1 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white">
                  User: {revokeUserModal.user.fullName} ({revokeUserModal.user.role})
                </div>
                <p className="text-slate-500">{revokeUserModal.user.email}</p>
                {revokeUserModal.action === 'REVOKE' ? (
                  <p className="text-rose-700 dark:text-rose-300 font-semibold pt-1">
                    ⚠️ Effect: User will be set to INACTIVE and blocked from logging in.
                  </p>
                ) : (
                  <p className="text-emerald-700 dark:text-emerald-300 font-semibold pt-1">
                    ✅ Effect: User account will be restored to ACTIVE.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Audit Trail Reason:</label>
                <textarea
                  rows={3}
                  required
                  placeholder={
                    revokeUserModal.action === 'REVOKE'
                      ? 'Specify reason for access revocation...'
                      : 'Specify reason for account reinstatement...'
                  }
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRevokeUserModal(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 rounded-xl text-xs font-extrabold text-white shadow-md flex items-center gap-1.5 ${
                    revokeUserModal.action === 'REVOKE'
                      ? 'bg-rose-600 hover:bg-rose-700 disabled:opacity-50'
                      : 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{revokeUserModal.action === 'REVOKE' ? 'Confirm & Revoke Access' : 'Confirm & Reinstate'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Delete Staff Confirmation Modal */}
      {staffToDelete && (
        <ConfirmModal
          isOpen={!!staffToDelete}
          onClose={() => setStaffToDelete(null)}
          onConfirm={handleConfirmDeleteStaff}
          isLoading={isSubmitting}
          title="Delete Staff Member Account"
          message={`Are you sure you want to permanently delete faculty member "${staffToDelete.fullName}" (${staffToDelete.role})? All teaching allocations and access records will be removed.`}
          confirmText="Confirm & Delete Staff"
        />
      )}

    </div>
  );
};
