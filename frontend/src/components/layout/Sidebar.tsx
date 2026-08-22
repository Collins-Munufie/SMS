import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  GraduationCap,
  CreditCard,
  Bell,
  BookOpen,
  Briefcase,
  HeartHandshake,
  CalendarDays,
  ChevronRight,
  X,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: string[];
}

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Academic Setup', path: '/academic', icon: Building2, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Students Directory', path: '/students', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'FORM_TEACHER'] },
  { label: 'Staff Management', path: '/staff', icon: Briefcase, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Guardians Directory', path: '/guardians', icon: HeartHandshake, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'FORM_TEACHER'] },
  { label: 'Class Attendance', path: '/attendance', icon: UserCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'FORM_TEACHER', 'PARENT', 'STUDENT'] },
  { label: 'Class Timetable', path: '/timetable', icon: CalendarDays },
  { label: 'Grades & Report Cards', path: '/grades', icon: GraduationCap },
  { label: 'Fees & Payments (GHS)', path: '/fees', icon: CreditCard, roles: ['SUPER_ADMIN', 'ADMIN', 'BURSAR', 'PARENT', 'STUDENT'] },
  { label: 'Announcements', path: '/announcements', icon: Bell },
  { label: 'Library Catalog', path: '/library', icon: BookOpen, roles: ['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN', 'STUDENT', 'TEACHER'] },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile = false, onCloseMobile }) => {
  const { user } = useAuth();
  const currentRole = user?.role || 'SUPER_ADMIN';

  const filteredItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(currentRole)
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 animate-in fade-in duration-150"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 lg:z-auto w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4.25rem)] p-4 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6 overflow-y-auto">
          {/* Mobile Top Close Header */}
          <div className="lg:hidden flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Navigation Menu
            </span>
            <button
              onClick={onCloseMobile}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Main Navigation
            </p>
            <nav className="space-y-1">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-950/40'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Quick Ghana School Info Badge */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-emerald-400 font-semibold text-[11px]">
              <span>GES System Status</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">
              Current Term: <strong className="text-slate-200">Term 1 (2025/26)</strong>
            </p>
            <p className="text-[11px] text-slate-400">
              Grading Scale: <strong className="text-amber-400">WAEC / GES (A1-F9)</strong>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          Ghana SMS v1.0.0 • Ghana K-12 Edition
        </div>
      </aside>
    </>
  );
};
