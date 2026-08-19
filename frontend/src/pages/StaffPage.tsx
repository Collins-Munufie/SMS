import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
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
} from 'lucide-react';

export const StaffPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'staff' | 'access'>('staff');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Revoke / Reinstate Modal state
  const [revokeUserModal, setRevokeUserModal] = useState<any>(null); // { user, action: 'REVOKE' | 'REINSTATE' }
  const [revokeReason, setRevokeReason] = useState('');

  // New staff form modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState<any>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'TEACHER',
    phone: '+233 24 000 0000',
  });

  const { data: staffData, refetch: refetchStaff } = useQuery({
    queryKey: ['staffList'],
    queryFn: async () => (await api.get('/staff')).data,
  });

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

  const staff = staffData?.staff || [];
  const usersList = usersData?.users || [];
  const auditLogs = auditData?.logs || [];

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/staff', formData);
      setShowAddModal(false);
      refetchStaff();
      refetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add staff');
    }
  };

  const handleConfirmRevokeOrReinstate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeUserModal) return;

    try {
      const isRevoking = revokeUserModal.action === 'REVOKE';
      const endpoint = isRevoking ? '/auth/revoke-role' : '/auth/reinstate-role';

      const res = await api.post(endpoint, {
        targetUserId: revokeUserModal.user.id,
        reason: revokeReason || (isRevoking ? 'Administrative revocation' : 'Restored by Admin'),
      });

      alert(res.data.message);
      setRevokeUserModal(null);
      setRevokeReason('');
      refetchUsers();
      refetchAudit();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Staff Directory & User Access Revocation Center</h2>
          <p className="text-xs text-slate-500">Manage faculty allocations, access control, and instant role revocation with accountability audit logs</p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'staff' ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs"
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
      <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'staff'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" /> Staff Directory & Allocations
        </button>

        <button
          onClick={() => setActiveTab('access')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'access'
              ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-500/30 animate-pulse'
              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500" /> User Access & Role Revocation Center
        </button>
      </div>

      {/* Tab 1: Staff Directory */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff by name, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map((s: any) => (
              <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition">
                <div className="flex items-center gap-3">
                  <img
                    src={s.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'}
                    alt={s.fullName}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/20"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{s.fullName}</h3>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {s.role}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {s.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {s.phone || '+233 24 555 6677'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: User Access & Role Revocation Center */}
      {activeTab === 'access' && (
        <div className="space-y-6">
          
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user accounts by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-semibold"
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
                className="p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-semibold"
              >
                <option value="">All Statuses</option>
                <option value="active">Active Accounts</option>
                <option value="revoked">Revoked Accounts</option>
              </select>
            </div>
          </div>

          {/* User Directory Table with Revoke / Reinstate Buttons */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between font-bold text-slate-800 text-xs">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Registered User Accounts Access Directory
              </span>
              <span>Total Accounts: {usersList.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase">
                    <th className="p-3.5">User Account</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5">Access Status</th>
                    <th className="p-3.5 text-right">Role Access Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u: any) => {
                    const isSelf = currentUser?.id === u.id;
                    const isAdminTarget = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
                    const isSuperAdminCurrent = currentUser?.role === 'SUPER_ADMIN';
                    const canModify = isSuperAdminCurrent || (!isAdminTarget && !isSelf);

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-bold text-slate-900 flex items-center gap-3">
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
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[10px]">
                            {u.role}
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-600">{u.phone || '+233 24 000 0000'}</td>

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

          {/* Accountability Audit Log History Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <History className="w-4 h-4 text-emerald-600" /> Action Audit Log (Accountability Trail)
              </div>
              <span className="text-xs text-slate-500">Tracks who revoked/reinstated role permissions</span>
            </div>

            <div className="space-y-2">
              {auditLogs.map((log: any) => (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                    log.action === 'REVOKED'
                      ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                      : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
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
                    <p className="text-slate-600 italic text-[11px]">Reason: "{log.reason || 'N/A'}"</p>
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

      {/* Revoke / Reinstate Confirmation Modal */}
      {revokeUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
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

            <form onSubmit={handleConfirmRevokeOrReinstate} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-200">
                <div className="font-bold text-slate-900">
                  User: {revokeUserModal.user.fullName} ({revokeUserModal.user.role})
                </div>
                <p className="text-slate-500">{revokeUserModal.user.email}</p>
                {revokeUserModal.action === 'REVOKE' ? (
                  <p className="text-rose-700 font-semibold pt-1">
                    ⚠️ Effect: User will be set to INACTIVE, logged out immediately, and blocked from logging in until reinstated.
                  </p>
                ) : (
                  <p className="text-emerald-700 font-semibold pt-1">
                    ✅ Effect: User account will be set to ACTIVE, restoring login and role permissions.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Audit Log Reason</label>
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
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRevokeUserModal(null)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md ${
                    revokeUserModal.action === 'REVOKE'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {revokeUserModal.action === 'REVOKE' ? 'Confirm & Revoke Access' : 'Confirm & Reinstate Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add Staff Member</h3>
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
                  placeholder="e.g. Mr. Kweku Browning"
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
                  placeholder="teacher@kqprep.edu.gh"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Assigned Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1 font-semibold"
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

    </div>
  );
};
