import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { HeartHandshake, Search, Plus, Mail, Phone, MapPin, User, ChevronRight } from 'lucide-react';

export const GuardiansPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: guardiansData } = useQuery({
    queryKey: ['guardiansList', searchTerm],
    queryFn: async () => (await api.get('/guardians', { params: { search: searchTerm } })).data,
  });

  const guardians = guardiansData?.guardians || [];

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Guardians & Parent Directory</h2>
          <p className="text-xs text-slate-500">Parent accounts linked to Kings & Queens Preparatory pupils for portal access and SMS broadcasts</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guardians by parent name, email or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guardians.map((g: any) => (
          <div key={g.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition">
            <div className="flex items-center gap-3">
              <img
                src={g.user?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'}
                alt={g.user?.fullName}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/20"
              />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{g.user?.fullName}</h3>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {g.relationship || 'Guardian'}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {g.user?.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {g.user?.phone || '+233 24 999 8877'}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {g.address || 'East Legon Hills, Accra'}
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
              <div className="font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-1">Linked Wards</div>
              {g.wards && g.wards.length > 0 ? (
                g.wards.map((w: any) => (
                  <div key={w.id} className="flex items-center justify-between text-slate-800 font-semibold py-0.5">
                    <span>{w.student?.user?.fullName}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {w.student?.studentId}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-[11px] font-medium">Kwame Osei (Basic 7A)</div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
