import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Users, Search, Plus, Phone, Mail, MapPin, X, GraduationCap } from 'lucide-react';

export const GuardiansPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '+233 24 000 9988',
    occupation: 'Business Executive',
    relationship: 'Father',
    address: 'Achimota, Accra',
    emergencyContact: '+233 24 000 9988',
  });

  const { data: guardiansData, refetch } = useQuery({
    queryKey: ['guardiansList', searchTerm],
    queryFn: async () => (await api.get('/guardians', { params: { search: searchTerm } })).data,
  });

  const handleAddGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/guardians', formData);
      setShowAddModal(false);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add guardian');
    }
  };

  const guardians = guardiansData?.guardians || [];

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Guardian & Parent Directory</h2>
          <p className="text-xs text-slate-500">Manage parent accounts, multi-child ward linkages, emergency contacts and occupation records</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Register New Guardian
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
            placeholder="Search guardians by name, phone or ward..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Guardians Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guardians.map((g: any) => (
          <div key={g.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={g.user?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'}
                alt=""
                className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/20"
              />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{g.user?.fullName}</h3>
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                  {g.relationship} • {g.occupation}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {g.user?.phone || g.emergencyContact}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {g.user?.email}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {g.address}
              </div>
            </div>

            {/* Linked Wards */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" /> Linked Children / Wards
              </div>
              {g.wards?.length > 0 ? (
                <div className="space-y-1">
                  {g.wards.map((w: any) => (
                    <div key={w.student?.id} className="p-2 bg-slate-50 rounded-lg text-xs flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{w.student?.user?.fullName}</span>
                      <span className="font-mono text-[10px] text-emerald-800 font-bold">{w.student?.studentId}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 italic">Kwame Osei (SMS-2025-001)</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Guardian Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Register New Guardian</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddGuardian} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mr. Kofi Osei"
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
                  placeholder="parent@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Relationship</label>
                  <input
                    type="text"
                    required
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Occupation</label>
                  <input
                    type="text"
                    required
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Phone Number (SMS Alert Target)</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Residential Address</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                  Register Guardian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
