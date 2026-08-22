import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
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
  GraduationCap,
  Calendar,
  BookOpen,
  Printer,
  HeartHandshake,
  Send,
  Lock,
  Unlock,
  Layers,
  FileText,
  Phone,
  ShieldCheck,
  ChevronRight,
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
import { Link, useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const currentRole = user?.role || 'SUPER_ADMIN';

  // State for parent multi-ward selection
  const [selectedWardIndex, setSelectedWardIndex] = useState(0);

  // Queries
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

  const { data: pendingData } = useQuery({
    queryKey: ['pendingAssessmentSummary', user?.id],
    queryFn: async () => (await api.get('/grades/pending-summary')).data,
  });

  const { data: announcementsData } = useQuery({
    queryKey: ['announcementsDashboard'],
    queryFn: async () => (await api.get('/announcements')).data,
  });

  const { data: defaultersData, refetch: refetchDefaulters } = useQuery({
    queryKey: ['feeDefaultersDashboard'],
    queryFn: async () => (await api.get('/fees/defaulters')).data,
    enabled: currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN' || currentRole === 'BURSAR',
  });

  const { data: myAllocations } = useQuery({
    queryKey: ['myAllocationsTeacher', user?.id],
    queryFn: async () => (await api.get('/grades/teacher/allocations')).data,
    enabled: currentRole === 'TEACHER' || currentRole === 'FORM_TEACHER',
  });

  const { data: sampleReportCard } = useQuery({
    queryKey: ['sampleReportCardForStudent', studentsData?.students?.[0]?.id],
    queryFn: async () => {
      const studentId = studentsData?.students?.[0]?.id;
      if (!studentId) return null;
      return (await api.get(`/grades/report-card/${studentId}`)).data;
    },
    enabled: currentRole === 'STUDENT' || currentRole === 'PARENT',
  });

  const totalStudents = studentsData?.students?.length || 18;
  const announcements = announcementsData?.announcements || [];
  const defaulters = defaultersData?.defaulters || [];
  const allocations = myAllocations?.allocations || [];

  const handleSendReminder = async () => {
    try {
      const res = await api.post('/fees/defaulters/send-reminders');
      toast.success(res.data.message || 'SMS payment reminders dispatched to parent contacts!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send SMS reminders');
    }
  };

  const chartFeeData = [
    { name: 'Collected', amount: feeSummary?.totalCollected || 8500 },
    { name: 'Outstanding', amount: feeSummary?.totalOutstanding || 2150 },
  ];

  const gradeDistribution = [
    { grade: 'A1 (80-100)', count: 22 },
    { grade: 'B2 (75-79)', count: 16 },
    { grade: 'B3 (70-74)', count: 12 },
    { grade: 'C4-C6 (55-69)', count: 8 },
    { grade: 'D7-E8 (45-54)', count: 2 },
  ];

  // Sample wards for Parent view
  const sampleWards = [
    {
      name: 'Kwame Mensah',
      id: 'SMS-2025-001',
      class: 'Basic 7A (JHS 1)',
      average: '83.8%',
      grade: 'A1',
      position: '1st in Class',
      attendance: '98.3%',
      feeBalance: 0,
      status: 'PAID',
    },
    {
      name: 'Ama Tutu',
      id: 'SMS-2025-002',
      class: 'Basic 5A (Primary 5)',
      average: '78.5%',
      grade: 'B2',
      position: '2nd in Class',
      attendance: '95.0%',
      feeBalance: 350.0,
      status: 'PARTIAL',
    },
  ];

  const activeWard = sampleWards[selectedWardIndex] || sampleWards[0];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* 1. Universal Royal Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-7 shadow-xl border border-slate-800 overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Kings & Queens Preparatory School • KG 1 to Basic 9
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Akwaaba, {user?.fullName || 'User'}!
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Workspace active:{' '}
              <strong className="text-amber-300 font-bold underline">{user?.role}</strong>. Ghana Basic Education (KG 1 – Basic 9 BECE Candidate Stream).
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {currentRole === 'STUDENT' && (
              <Link
                to="/grades"
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-amber-300" />
                <span>My Term 1 Report Card</span>
              </Link>
            )}

            {currentRole === 'PARENT' && (
              <Link
                to="/fees"
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4 text-amber-300" />
                <span>Pay Ward Fees (MoMo)</span>
              </Link>
            )}

            {(currentRole === 'TEACHER' || currentRole === 'FORM_TEACHER') && (
              <>
                <Link
                  to="/grades"
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                  <span>Enter CA Scores</span>
                </Link>
                <Link
                  to="/attendance"
                  className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs shadow-md transition flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <span>Daily Register</span>
                </Link>
              </>
            )}

            {currentRole === 'BURSAR' && (
              <Link
                to="/fees"
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4 text-amber-300" />
                <span>Record MoMo Payment</span>
              </Link>
            )}

            {(currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN') && (
              <>
                <Link
                  to="/grades"
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                  <span>Score Grid & Reports</span>
                </Link>
                <Link
                  to="/timetable"
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs border border-slate-700 transition flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Master Timetable</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ROLE-SPECIFIC WORKSPACES */}
      {/* ========================================================================= */}

      {/* ----------------- A. STUDENT WORKSPACE ----------------- */}
      {currentRole === 'STUDENT' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Student Profile & Report Card Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-600" /> My Academic Performance
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Term 1 (2025/26)
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Index ID:</span>
                  <strong className="font-mono text-emerald-700 dark:text-emerald-400">SMS-2025-001</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Class Stream:</span>
                  <strong className="text-slate-900 dark:text-white">Basic 7A (JHS 1)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Terminal Average:</span>
                  <strong className="text-amber-500 text-sm font-black">83.8% (A1 Excellent)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Class Position:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">1st out of 35 Pupils</strong>
                </div>
              </div>
              <Link
                to="/grades"
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" /> View & Print Official Report Card
              </Link>
            </div>

            {/* Student Attendance Stats */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" /> Attendance Compliance
                </span>
                <span className="text-xs font-black text-emerald-600">98.3%</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '98.3%' }} />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-[9px] text-slate-400 block font-bold">Total Days</span>
                    <strong className="text-slate-900 dark:text-white">60</strong>
                  </div>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
                    <span className="text-[9px] text-emerald-700 block font-bold">Present</span>
                    <strong className="text-emerald-900 dark:text-emerald-300">59</strong>
                  </div>
                  <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl">
                    <span className="text-[9px] text-rose-700 block font-bold">Absent</span>
                    <strong className="text-rose-900 dark:text-rose-300">1</strong>
                  </div>
                </div>
              </div>
              <Link to="/attendance" className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">
                View Attendance Record &rarr;
              </Link>
            </div>

            {/* Student Fees Status */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-500" /> Tuition & Fees Status
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  PAID IN FULL
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="text-2xl font-black text-slate-900 dark:text-white">GHS ₵0.00</div>
                <p className="text-slate-500">Remaining term balance due</p>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  Last receipt: <strong>REC-2025-001 (MoMo MTN)</strong>
                </div>
              </div>
              <Link
                to="/fees"
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" /> Download Fee Receipt
              </Link>
            </div>
          </div>

          {/* Today's Schedule Card for Student */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Today's Academic Schedule (Basic 7A)</h3>
                  <p className="text-xs text-slate-500">Periods, Bell Times & Subject Classrooms</p>
                </div>
              </div>
              <Link to="/timetable" className="text-xs font-bold text-emerald-700 hover:underline">
                Full Weekly Timetable &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono font-bold block">08:00 - 08:45 • Period 1</span>
                <strong className="text-slate-900 dark:text-white block">Mathematics</strong>
                <span className="text-slate-500 text-[11px]">Mr. Kwaku Browning • Rm 7A</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono font-bold block">08:45 - 09:30 • Period 2</span>
                <strong className="text-slate-900 dark:text-white block">English Language</strong>
                <span className="text-slate-500 text-[11px]">Ms. Abena Mensah • Rm 7A</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono font-bold block">09:30 - 10:15 • Period 3</span>
                <strong className="text-slate-900 dark:text-white block">Integrated Science</strong>
                <span className="text-slate-500 text-[11px]">Mr. Kofi Mensah • Science Lab 1</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono font-bold block">10:45 - 11:30 • Period 4</span>
                <strong className="text-slate-900 dark:text-white block">Computing / ICT</strong>
                <span className="text-slate-500 text-[11px]">Mr. E. K. Quartey • ICT Lab</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- B. PARENT / GUARDIAN WORKSPACE ----------------- */}
      {currentRole === 'PARENT' && (
        <div className="space-y-6">
          {/* Multi-Ward Selector Tabs */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-rose-500" /> Your Enrolled Wards at Kings & Queens
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {sampleWards.length} Wards Linked
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {sampleWards.map((w, idx) => (
                <button
                  key={w.id}
                  onClick={() => setSelectedWardIndex(idx)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 border ${
                    selectedWardIndex === idx
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{w.name} ({w.class})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Ward Dashboard Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Academic Performance Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-600" /> {activeWard.name}'s Grades
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {activeWard.grade} Grade
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Terminal Average:</span>
                  <strong className="text-slate-900 dark:text-white text-sm font-black">{activeWard.average}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Class Ranking:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{activeWard.position}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Promotion Recommendation:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Recommended with Honors</span>
                </div>
              </div>
              <Link
                to="/grades"
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" /> View Printable Report Card
              </Link>
            </div>

            {/* Attendance Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" /> Attendance Compliance
                </span>
                <span className="text-xs font-black text-emerald-600">{activeWard.attendance}</span>
              </div>
              <div className="space-y-2 text-xs">
                <p className="text-slate-500">Daily roll call register records for {activeWard.name}.</p>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-bold">Status Today:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Present in Class (Punctual)
                  </strong>
                </div>
              </div>
              <Link to="/attendance" className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">
                View Full Term Attendance &rarr;
              </Link>
            </div>

            {/* MoMo Fee Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-500" /> Tuition & Fees
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeWard.feeBalance === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {activeWard.status}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Outstanding Balance:</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  GHS ₵{activeWard.feeBalance.toFixed(2)}
                </div>
                <p className="text-slate-500 text-[11px]">Payable via MTN MoMo (*170#), Telecel Cash or AT Money</p>
              </div>
              <Link
                to="/fees"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-300" /> Pay Fees & View Receipts
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- C. TEACHER / FORM TEACHER WORKSPACE ----------------- */}
      {(currentRole === 'TEACHER' || currentRole === 'FORM_TEACHER') && (
        <div className="space-y-6">
          {/* Pending Continuous Assessment Entries Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    Pending Continuous Assessment (CA) Score Submissions
                  </h3>
                  <p className="text-xs text-slate-500">Your assigned subject classes requiring term marks collation</p>
                </div>
              </div>
              <Link
                to="/grades"
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition"
              >
                Open Score Grid
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allocations.slice(0, 3).map((alloc: any, idx: number) => (
                <div
                  key={alloc.id || idx}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-slate-900 dark:text-white">
                      {alloc.stream?.class?.name} {alloc.stream?.name} — {alloc.subject?.name}
                    </strong>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                      Term 1 Open
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '80%' }} />
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>40% CA + 60% Exam</span>
                    <Link to="/grades" className="text-emerald-700 font-bold hover:underline">
                      Enter Scores &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- D. BURSAR / ACCOUNTANT WORKSPACE ----------------- */}
      {currentRole === 'BURSAR' && (
        <div className="space-y-6">
          {/* Defaulters Ledger & Reminder Dispatch */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-rose-600" /> Fee Defaulters & Debtors Ledger
                </h3>
                <p className="text-xs text-slate-500">Pupils with outstanding term fee balances</p>
              </div>

              <button
                onClick={handleSendReminder}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition"
              >
                <Send className="w-3.5 h-3.5 text-amber-300" /> Dispatch MoMo Reminder SMS to Parents
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3">Pupil Name</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Parent / Contact</th>
                    <th className="p-3">Total Invoiced</th>
                    <th className="p-3">Amount Paid</th>
                    <th className="p-3">Balance Due</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {defaulters.slice(0, 5).map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{inv.student?.user?.fullName}</td>
                      <td className="p-3 font-semibold">{inv.student?.enrollments?.[0]?.stream?.class?.name} {inv.student?.enrollments?.[0]?.stream?.name}</td>
                      <td className="p-3 text-slate-500">{inv.student?.user?.phone || '+233 24 999 8877'}</td>
                      <td className="p-3">GHS ₵{inv.totalAmount?.toFixed(2)}</td>
                      <td className="p-3 font-semibold text-emerald-600">GHS ₵{inv.amountPaid?.toFixed(2)}</td>
                      <td className="p-3 font-extrabold text-rose-600">GHS ₵{inv.balance?.toFixed(2)}</td>
                      <td className="p-3 text-right">
                        <Link
                          to="/fees"
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px]"
                        >
                          Record MoMo Payment
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- E. ADMIN & GLOBAL METRICS ----------------- */}
      {(currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN' || currentRole === 'BURSAR') && (
        <>
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xs space-y-2 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Basic Pupils</span>
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">{totalStudents} Pupils</div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Term 1 (KG 1 to Basic 9 BECE)
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xs space-y-2 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Attendance Rate</span>
                <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {attendanceData?.attendancePercentage || 97.2}%
              </div>
              <div className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold">
                Daily roll call register compliance
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xs space-y-2 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">GHS Fee Collections</span>
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                ₵{(feeSummary?.totalCollected || 8500).toLocaleString()}
              </div>
              <div className="text-[11px] text-amber-800 dark:text-amber-400 font-semibold">
                {feeSummary?.collectionRate || 80}% of Term 1 budget
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xs space-y-2 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Basic Levels</span>
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-800">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">11 Levels</div>
              <div className="text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold">
                KG 1–2, Basic 1–6 & Basic 7–9
              </div>
            </div>
          </div>

          {/* Analytics Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Term 1 Fee Revenue (GHS ₵)</h3>
                  <p className="text-xs text-slate-500">Mobile Money & Bursar collections vs outstanding</p>
                </div>
                <Link to="/fees" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
                  Details <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartFeeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip formatter={(value) => [`₵${Number(value).toLocaleString()}`, 'Amount']} />
                    <Bar dataKey="amount" fill="#006b3f" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">WAEC Assessment Grade Distribution</h3>
                  <p className="text-xs text-slate-500">Continuous Assessment & Terminal Exams (40% + 60%)</p>
                </div>
                <Link to="/grades" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
                  Grades <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="grade" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#fcd116" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 3. School Noticeboard Circulars Feed (All Roles) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">School Circulars & Noticeboard</h3>
              <p className="text-xs text-slate-500">Official circulars, PTA meeting notices and broadcasts</p>
            </div>
          </div>
          <Link to="/announcements" className="text-xs font-bold text-emerald-700 hover:underline">
            View All Circulars &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.slice(0, 2).map((item: any) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    item.priority === 'HIGH' || item.priority === 'URGENT'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {item.priority}
                </span>
                <span className="text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">{item.title}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{item.content}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
