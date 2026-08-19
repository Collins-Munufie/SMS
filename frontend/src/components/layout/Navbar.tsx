import React from 'react';
import { useAuth, Role } from '../../context/AuthContext';
import { GraduationCap, ShieldAlert, LogOut, ChevronDown, Bell, Search, Sparkles } from 'lucide-react';

const roleLabels: Record<Role, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-emerald-600 text-white' },
  ADMIN: { label: 'Registrar Admin', color: 'bg-teal-600 text-white' },
  TEACHER: { label: 'Subject Teacher', color: 'bg-blue-600 text-white' },
  FORM_TEACHER: { label: 'Form Teacher', color: 'bg-indigo-600 text-white' },
  BURSAR: { label: 'Bursar / Accountant', color: 'bg-amber-600 text-white' },
  STUDENT: { label: 'Student', color: 'bg-purple-600 text-white' },
  PARENT: { label: 'Parent / Guardian', color: 'bg-rose-600 text-white' },
  LIBRARIAN: { label: 'Librarian', color: 'bg-slate-700 text-white' },
};

export const Navbar: React.FC = () => {
  const { user, switchRole, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = React.useState(false);

  const currentRoleInfo = user ? roleLabels[user.role] : roleLabels.SUPER_ADMIN;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="ghana-accent-bar h-1 w-full" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand / School Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/20">
            <GraduationCap className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base sm:text-lg leading-tight flex items-center gap-2">
              Achimota Basic School SMS
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                KG 1 – Basic 9
              </span>
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">Ghana Basic Education Structure • Term 1 (2025/2026)</p>
          </div>
        </div>

        {/* Center: Quick Search Simulator */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search basic students, index numbers, staff, or fee records..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Right: Role Switcher & User Profile */}
        <div className="flex items-center gap-3">
          {/* Role Impersonation Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-slate-50 hover:bg-slate-100 transition shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-slate-600 hidden sm:inline">Role:</span>
              <span className={`px-2 py-0.5 rounded ${currentRoleInfo.color}`}>
                {currentRoleInfo.label}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Switch Active Role Preview
                </div>
                {(Object.keys(roleLabels) as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchRole(r);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                      user?.role === r ? 'font-bold text-emerald-700 bg-emerald-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>{roleLabels[r].label}</span>
                    {user?.role === r && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Icon */}
          <button className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
              alt={user?.fullName || 'User'}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
            />
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">{user?.fullName || 'Demo Admin'}</div>
              <div className="text-[10px] text-slate-500">{user?.email || 'admin@achimotabasic.edu.gh'}</div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
