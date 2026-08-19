import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  Users,
  Building2,
  CreditCard,
  UserCheck,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Crown,
  FileSpreadsheet,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const { data: feeSummary } = useQuery({
    queryKey: ['feeSummary'],
    queryFn: async () => (await api.get('/fees/summary')).data,
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['attendanceAnalytics'],
    queryFn: async () => (await api.get('/attendance/analytics')).data,
  });

  const { data: studentsData } = useQuery({
    queryKey: ['studentsList'],
    queryFn: async () => (await api.get('/students')).data,
  });

  // Pending Assessment Entries Widget Query for Teachers
  const { data: pendingData } = useQuery({
    queryKey: ['pendingAssessmentSummary', user?.id],
    queryFn: async () => (await api.get('/grades/pending-summary')).data,
  });

  const totalStudents = studentsData?.students?.length || 5;
  const pendingList = pendingData?.pendingList || [
    {
      allocationId: 'alloc-1',
      className: 'Basic 7',
      streamName: 'A',
      subjectName: 'Mathematics',
      completionPercentage: 80,
      isComplete: false,
    },
    {
      allocationId: 'alloc-2',
      className: 'Basic 7',
      streamName: 'B',
      subjectName: 'Mathematics',
      completionPercentage: 60,
      isComplete: false,
    },
  ];

  const chartFeeData = [
    { name: 'Collected', amount: feeSummary?.totalCollected || 800 },
    { name: 'Outstanding', amount: feeSummary?.totalOutstanding || 350 },
  ];

  const gradeDistribution = [
    { grade: 'A1 (80-100)', count: 22 },
    { grade: 'B2 (75-79)', count: 16 },
    { grade: 'B3 (70-74)', count: 12 },
    { grade: 'C4-C6 (55-69)', count: 8 },
    { grade: 'D7-E8 (45-54)', count: 2 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 shadow-xl border border-slate-800 overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Kings & Queens Preparatory School • KG 1 to Basic 9
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Akwaaba, {user?.fullName || 'User'}!
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Role active: <strong className="text-amber-300 underline font-bold">{user?.role}</strong>. Ghana Basic Education System (Kindergarten, Primary & JHS terminal Basic 9 BECE).
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/grades"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-300" />
              Continuous Assessment Entry
            </Link>
            <Link
              to="/attendance"
              className="px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4 text-emerald-700" />
              Mark Register
            </Link>
          </div>
        </div>
      </div>

      {/* Teacher Widget: Pending CA Entries Card */}
      {(user?.role === 'TEACHER' || user?.role === 'FORM_TEACHER' || user?.role === 'SUPER_ADMIN') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Pending Continuous Assessment Entries</h3>
                <p className="text-xs text-slate-500">Subject classes requiring term score entry & collation</p>
              </div>
            </div>
            <Link
              to="/grades"
              className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
            >
              Open Score Grid
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingList.map((item: any) => (
              <div
                key={item.allocationId}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-xs">
                    {item.className} ({item.streamName}) — {item.subjectName}
                  </div>
                  {item.isComplete ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Complete
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                      {item.completionPercentage}% Done
                    </span>
                  )}
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      item.isComplete ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${item.completionPercentage}%` }}
                  />
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Term 1 Assessment</span>
                  <Link to="/grades" className="text-emerald-700 font-bold hover:underline">
                    Enter Scores &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl shadow-xs space-y-2 border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Basic Pupils</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalStudents}</div>
          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Term 1 (KG 1 – Basic 9)
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl shadow-xs space-y-2 border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Attendance Rate</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {attendanceData?.attendancePercentage || 97.2}%
          </div>
          <div className="text-[11px] text-blue-700 font-medium">
            Daily register compliance
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl shadow-xs space-y-2 border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">GHS Basic Fee Revenue</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₵{(feeSummary?.totalCollected || 800).toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-800 font-medium">
            {feeSummary?.collectionRate || 70}% of term budget
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl shadow-xs space-y-2 border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Basic Levels</span>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-800">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">11 Levels</div>
          <div className="text-[11px] text-indigo-700 font-medium">
            KG 1–2, Basic 1–6 & Basic 7–9
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Term 1 Fee Collection (GHS ₵)</h3>
              <p className="text-xs text-slate-500">Bursar fee collections & defaulter records</p>
            </div>
            <Link to="/fees" className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1">
              Details <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartFeeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip formatter={(value) => [`₵${Number(value).toLocaleString()}`, 'Amount']} />
                <Bar dataKey="amount" fill="#006b3f" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">WAEC Assessment Grade Distribution</h3>
              <p className="text-xs text-slate-500">Continuous Class Assessment & Term 1 Exams</p>
            </div>
            <Link to="/grades" className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1">
              Grades <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="grade" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#fcd116" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
};
