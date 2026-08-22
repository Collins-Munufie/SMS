import React from 'react';
import {
  Printer,
  Crown,
  Sparkles,
  User,
  Calendar,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BookOpen,
  Edit3,
  X,
  ArrowLeft,
} from 'lucide-react';
import { ReportCardPayload, WAEC_GRADING_SCALE, getWaecGrade } from './types';

interface ReportCardViewProps {
  reportCard: ReportCardPayload;
  onClose?: () => void;
  onEditRemarks?: () => void;
  isBatchMode?: boolean;
}

export const ReportCardView: React.FC<ReportCardViewProps> = ({
  reportCard,
  onClose,
  onEditRemarks,
  isBatchMode = false,
}) => {
  const { student, term, attendance, subjectResults, summary, schoolProfile } = reportCard;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-4 ${isBatchMode ? 'break-after-page mb-8' : ''}`}>
      {/* Top Action Ribbon (Hidden when printing or in batch mode) */}
      {!isBatchMode && (
        <div className="print:hidden flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Score Sheet</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {onEditRemarks && (
              <button
                onClick={onEditRemarks}
                className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Edit Remarks</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-950/20 transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Print Official Report Card (PDF)</span>
            </button>
          </div>
        </div>
      )}

      {/* Official Report Card Sheet Container */}
      <div className="bg-white text-slate-900 p-8 rounded-3xl border-2 border-emerald-900/40 shadow-xl max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none">
        
        {/* Ghana Flag Tricolor Top Bar */}
        <div className="h-2 w-full grid grid-cols-3 rounded-full mb-6 overflow-hidden">
          <div className="bg-red-600" />
          <div className="bg-amber-400" />
          <div className="bg-emerald-600" />
        </div>

        {/* 1. Official School Header */}
        <div className="flex items-center justify-between border-b-2 border-emerald-950 pb-5 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/50 p-1 flex items-center justify-center shrink-0">
              <Crown className="w-10 h-10 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-emerald-950 uppercase tracking-tight">
                {schoolProfile?.name || 'Kings & Queens Preparatory School'}
              </h1>
              <p className="text-xs font-bold text-slate-700 italic">
                "{schoolProfile?.motto || 'Excellence, Royalty & Moral Leadership (KG 1 - Basic 9)'}"
              </p>
              <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-2 mt-1">
                <span>{schoolProfile?.address || 'Plot 12, East Legon Hills, Accra, Ghana'}</span>
                <span>•</span>
                <span>Tel: {schoolProfile?.phone || '+233 24 123 4567'}</span>
              </div>
            </div>
          </div>

          <div className="text-right border-l-2 border-slate-300 pl-5 hidden sm:block">
            <div className="px-3 py-1 bg-emerald-900 text-amber-300 font-extrabold text-xs uppercase tracking-wider rounded-lg inline-block">
              Terminal Report Card
            </div>
            <div className="text-xs font-bold text-slate-900 mt-1.5">
              {term.label} ({term.academicYear})
            </div>
            <div className="text-[10px] text-emerald-800 font-bold">
              GES Curriculum Standard
            </div>
          </div>
        </div>

        {/* 2. Pupil Profile & Attendance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Pupil Details (2 cols) */}
          <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
            <img
              src={student.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150'}
              alt={student.fullName}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-600/30 shrink-0"
            />
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs w-full">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Pupil Full Name</span>
                <strong className="text-slate-950 text-sm font-extrabold">{student.fullName}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Student Index ID</span>
                <strong className="text-emerald-800 font-mono font-extrabold text-sm">{student.studentId}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Class & Stream</span>
                <strong className="text-slate-900 font-bold">{student.class} {student.stream}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Form Teacher</span>
                <strong className="text-slate-800 font-semibold">{student.formTeacher}</strong>
              </div>
            </div>
          </div>

          {/* Attendance Summary (1 col) */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 text-xs space-y-1.5 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5">
              <span className="font-extrabold text-emerald-950 uppercase text-[10px] flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-700" /> Attendance Summary
              </span>
              <span className="text-[11px] font-black text-emerald-800">
                {attendance.attendancePercentage}% Rate
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white/80 p-1.5 rounded-xl border border-emerald-100">
                <span className="text-[9px] font-bold text-slate-500 block">Total Days</span>
                <strong className="text-slate-900 text-xs font-black">{attendance.totalSchoolDays}</strong>
              </div>
              <div className="bg-emerald-100/70 p-1.5 rounded-xl border border-emerald-200">
                <span className="text-[9px] font-bold text-emerald-800 block">Present</span>
                <strong className="text-emerald-900 text-xs font-black">{attendance.presentDays}</strong>
              </div>
              <div className="bg-rose-50 p-1.5 rounded-xl border border-rose-200">
                <span className="text-[9px] font-bold text-rose-700 block">Absent</span>
                <strong className="text-rose-900 text-xs font-black">{attendance.absentDays}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Academic Subject Breakdown Table */}
        <div className="border-2 border-slate-900 rounded-2xl overflow-hidden mb-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-950 text-white font-extrabold">
                <th className="p-2.5 border-r border-emerald-800 w-8 text-center">#</th>
                <th className="p-2.5 border-r border-emerald-800 min-w-[170px]">Subject</th>
                <th className="p-2.5 border-r border-emerald-800 text-center w-24">
                  Class CA (40%)
                </th>
                <th className="p-2.5 border-r border-emerald-800 text-center w-24">
                  Exam (60%)
                </th>
                <th className="p-2.5 border-r border-emerald-800 text-center w-24 bg-emerald-900">
                  Total (100%)
                </th>
                <th className="p-2.5 border-r border-emerald-800 text-center w-20">
                  WAEC Grade
                </th>
                <th className="p-2.5 border-r border-emerald-800 min-w-[100px]">Remark</th>
                <th className="p-2.5 min-w-[130px]">Subject Teacher</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-300">
              {subjectResults.map((sub, idx) => {
                const waecObj = getWaecGrade(sub.totalScore);
                return (
                  <tr key={sub.subjectCode} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="p-2 text-center border-r border-slate-300 font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="p-2 border-r border-slate-300 font-extrabold text-slate-950">
                      <div>{sub.subjectName}</div>
                      <div className="text-[9px] font-mono text-slate-400">{sub.subjectCode}</div>
                    </td>
                    <td className="p-2 text-center border-r border-slate-300 font-semibold text-slate-700">
                      {sub.classScore > 0 ? sub.classScore : '—'}
                    </td>
                    <td className="p-2 text-center border-r border-slate-300 font-semibold text-slate-700">
                      {sub.examScore > 0 ? sub.examScore : '—'}
                    </td>
                    <td className="p-2 text-center border-r border-slate-300 font-black text-slate-950 bg-emerald-50/50 text-sm">
                      {sub.totalScore > 0 ? `${sub.totalScore}%` : '—'}
                    </td>
                    <td className="p-2 text-center border-r border-slate-300">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${waecObj.color}`}>
                        {sub.waecGrade}
                      </span>
                    </td>
                    <td className="p-2 border-r border-slate-300 font-medium text-slate-800">
                      {sub.remark}
                    </td>
                    <td className="p-2 text-slate-600 text-[11px] font-medium">
                      {sub.teacherName}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4. Overall Performance Summary Banner */}
        <div className="bg-slate-950 text-white rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mb-6">
          <div className="border-r border-slate-800 last:border-r-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Grand Total Score</span>
            <div className="text-lg font-black text-white mt-0.5">
              {summary.overallTotal} <span className="text-xs font-normal text-slate-400">/ {subjectResults.length * 100}</span>
            </div>
          </div>

          <div className="border-r border-slate-800 last:border-r-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Terminal Average</span>
            <div className="text-lg font-black text-amber-300 mt-0.5">
              {summary.overallAverage}%
            </div>
          </div>

          <div className="border-r border-slate-800 last:border-r-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Overall WAEC Grade</span>
            <div className="text-lg font-black text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
              <span>{summary.waecGrade}</span>
              <span className="text-xs font-semibold text-slate-300">({summary.overallRemark})</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Class Position Rank</span>
            <div className="text-lg font-black text-white mt-0.5">
              {summary.positionInClass}{' '}
              <span className="text-xs font-normal text-slate-400">
                out of {summary.totalStudentsInStream} pupils
              </span>
            </div>
          </div>
        </div>

        {/* 5. Remarks & Conduct */}
        <div className="border border-slate-300 rounded-2xl p-4 space-y-3 bg-slate-50/50 mb-6 text-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 uppercase text-[10px]">
                Form Teacher's Remarks & Recommendation:
              </span>
            </div>
            <p className="text-slate-800 font-medium italic mt-0.5 text-xs bg-white p-2.5 rounded-xl border border-slate-200">
              "{summary.formTeacherRemarks}"
            </p>
          </div>

          <div>
            <span className="font-extrabold text-slate-900 uppercase text-[10px]">
              Headmaster / Principal's General Remarks & Promotion:
            </span>
            <p className="text-slate-800 font-medium italic mt-0.5 text-xs bg-white p-2.5 rounded-xl border border-slate-200">
              "{summary.headteacherRemarks}"
            </p>
          </div>
        </div>

        {/* 6. WAEC 9-Point Grading Scale Key */}
        <div className="border border-slate-200 rounded-xl p-3 bg-white text-[9px] mb-6">
          <div className="font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
            Ghana WAEC / GES 9-Point Grading Scale Key:
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 text-center font-semibold">
            {WAEC_GRADING_SCALE.map((g) => (
              <div key={g.grade} className="p-1 rounded bg-slate-50 border border-slate-200">
                <span className="font-black text-slate-900 block">{g.grade} ({g.min}-{g.max}%)</span>
                <span className="text-slate-500 text-[8px]">{g.remark}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Official Signatures Line */}
        <div className="grid grid-cols-3 gap-8 pt-6 border-t-2 border-slate-900 text-center text-xs">
          <div>
            <div className="border-b border-slate-400 pb-6" />
            <span className="block font-extrabold text-slate-900 mt-1.5">{student.formTeacher}</span>
            <span className="text-[10px] text-slate-500">Form Teacher Signature</span>
          </div>

          <div>
            <div className="border-b border-slate-400 pb-6" />
            <span className="block font-extrabold text-slate-900 mt-1.5">Mrs. Patience Baidoo</span>
            <span className="text-[10px] text-slate-500">Academic Dean / Registrar</span>
          </div>

          <div>
            <div className="border-b border-slate-400 pb-6" />
            <span className="block font-extrabold text-slate-900 mt-1.5">Dr. Emmanuel K. Addo</span>
            <span className="text-[10px] text-slate-500">Headmaster (Official Stamp & Seal)</span>
          </div>
        </div>

        {/* Document Footer */}
        <div className="mt-6 pt-3 border-t border-slate-200 text-[9px] text-slate-400 text-center flex items-center justify-between">
          <span>Kings & Queens Preparatory School • Official Terminal Academic Report</span>
          <span>Generated on {new Date().toLocaleDateString('en-GB')} • Valid for Term 1</span>
        </div>

      </div>
    </div>
  );
};
