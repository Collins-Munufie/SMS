import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, Role } from '../../context/AuthContext';
import { Crown, Sparkles, LogOut, ChevronDown, Bell, Search, ShieldCheck, Menu, X } from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

const roleLabels: Record<Role, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-emerald-500 text-slate-950 font-extrabold' },
  ADMIN: { label: 'Registrar Admin', color: 'bg-teal-400 text-slate-950 font-extrabold' },
  TEACHER: { label: 'Subject Teacher', color: 'bg-sky-400 text-slate-950 font-extrabold' },
  FORM_TEACHER: { label: 'Form Teacher', color: 'bg-indigo-400 text-slate-950 font-extrabold' },
  BURSAR: { label: 'Bursar / Accountant', color: 'bg-amber-400 text-slate-950 font-extrabold' },
  STUDENT: { label: 'Student', color: 'bg-purple-400 text-slate-950 font-extrabold' },
  PARENT: { label: 'Parent / Guardian', color: 'bg-rose-400 text-slate-950 font-extrabold' },
  LIBRARIAN: { label: 'Librarian', color: 'bg-amber-200 text-slate-950 font-extrabold' },
};

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const { user, switchRole, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const navigate = useNavigate();

  const currentRoleInfo = user ? roleLabels[user.role] : roleLabels.SUPER_ADMIN;

  const handleRoleSwitch = async (r: Role) => {
    setShowRoleMenu(false);
    await switchRole(r);
    navigate('/'); // Redirect to Dashboard on role switch to render valid role workspace
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl text-white">
      {/* Ghana Flag Tricolor Top Bar */}
      <div className="h-1.5 w-full grid grid-cols-3">
        <div className="bg-red-600" />
        <div className="bg-amber-400" />
        <div className="bg-emerald-600" />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Left: Hamburger (Mobile) + Royal School Crest & Name */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-white text-sm sm:text-base md:text-lg tracking-tight flex items-center gap-1.5 truncate max-w-[190px] sm:max-w-none">
                Kings & Queens Preparatory
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 hidden sm:inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Basic Education
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-2">
              <span>KG 1 – Basic 9 (BECE)</span>
              <span className="w-1 h-1 rounded-full bg-slate-600 hidden sm:inline" />
              <span className="text-emerald-400 font-medium hidden sm:inline">Term 1 (2025/2026)</span>
            </p>
          </div>
        </div>

        {/* Center: Search Bar (Desktop) */}
        <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pupils, index IDs, staff, or fees..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-800/80 border border-slate-700/80 text-slate-200 placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:bg-slate-800 transition"
            />
          </div>
        </div>

        {/* Right: Role Impersonator & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Role Impersonation Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold transition shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-400 hidden sm:inline">Role:</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs truncate max-w-[90px] sm:max-w-none ${currentRoleInfo.color}`}>
                {currentRoleInfo.label}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-white">
                <div className="px-3.5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Switch Active Role Preview
                </div>
                {(Object.keys(roleLabels) as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleSwitch(r)}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition ${
                      user?.role === r ? 'font-bold text-amber-300 bg-slate-800/80' : 'text-slate-300'
                    }`}
                  >
                    <span>{roleLabels[r].label}</span>
                    {user?.role === r && <span className="w-2 h-2 rounded-full bg-amber-400 shadow-xs shadow-amber-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile Info */}
          <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-800">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
              alt={user?.fullName || 'User'}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover ring-2 ring-amber-400/40"
            />
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-white leading-tight">{user?.fullName || 'Demo Admin'}</div>
              <div className="text-[10px] text-slate-400">{user?.email || 'admin@kqprep.edu.gh'}</div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
