import React from 'react';
import {
  Printer,
  Crown,
  Sparkles,
  User,
  Building2,
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import {
  TimetableSlot,
  Stream,
  DayOfWeek,
  DAYS,
  getSubjectTheme,
} from './types';

interface PrintableTimetableCardProps {
  stream: Stream;
  slots: TimetableSlot[];
  onBack: () => void;
}

const PERIODS = [
  { period: 1, name: 'P1', time: '08:00 - 08:45' },
  { period: 2, name: 'P2', time: '08:45 - 09:30' },
  { period: 3, name: 'P3', time: '09:30 - 10:15' },
  { period: 4, name: 'P4', time: '10:45 - 11:30' },
  { period: 5, name: 'P5', time: '11:30 - 12:15' },
  { period: 6, name: 'P6', time: '13:00 - 13:45' },
  { period: 7, name: 'P7', time: '13:45 - 14:30' },
  { period: 8, name: 'P8', time: '14:30 - 15:15' },
];

export const PrintableTimetableCard: React.FC<PrintableTimetableCardProps> = ({
  stream,
  slots,
  onBack,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const slotMap = React.useMemo(() => {
    const map = new Map<string, TimetableSlot>();
    slots.forEach((s) => {
      map.set(`${s.dayOfWeek}_${s.period}`, s);
    });
    return map;
  }, [slots]);

  // Distinct subjects and teachers for legend
  const legendItems = React.useMemo(() => {
    const map = new Map<string, { subjectName: string; code: string; teacherName: string }>();
    slots.forEach((s) => {
      if (!map.has(s.subjectId)) {
        map.set(s.subjectId, {
          subjectName: s.subject.name,
          code: s.subject.code,
          teacherName: s.teacher.fullName,
        });
      }
    });
    return Array.from(map.values());
  }, [slots]);

  return (
    <div className="space-y-4">
      {/* Top Action Bar (hidden when printing) */}
      <div className="print:hidden flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Interactive Grid</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Optimized for Standard A4 Landscape & Noticeboard Display
          </span>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Official Timetable (PDF)</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div className="bg-white text-slate-900 p-8 rounded-3xl border border-slate-200 shadow-xl max-w-5xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0">
        
        {/* Ghana Tricolor Accent Top Bar */}
        <div className="h-2 w-full grid grid-cols-3 rounded-full mb-6 overflow-hidden">
          <div className="bg-red-600" />
          <div className="bg-amber-400" />
          <div className="bg-emerald-600" />
        </div>

        {/* Official Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-5 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 p-1 flex items-center justify-center shrink-0">
              <Crown className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                Kings & Queens Preparatory School
              </h1>
              <p className="text-xs text-slate-600 font-semibold italic">
                Excellence, Royalty & Moral Leadership (KG 1 - Basic 9) • East Legon Hills, Accra
              </p>
              <div className="text-[11px] font-bold text-emerald-800 mt-1 flex items-center gap-2">
                <span>GES Curriculum Standard</span>
                <span>•</span>
                <span>Term 1 (2025/2026 Academic Year)</span>
              </div>
            </div>
          </div>

          <div className="text-right border-l-2 border-slate-200 pl-6">
            <div className="text-2xl font-black text-slate-950 tracking-tight">
              {stream.class?.name} {stream.name}
            </div>
            <div className="text-xs font-bold text-slate-700 mt-0.5">
              Class Timetable Schedule
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Form Teacher: <strong>{stream.formTeacher?.fullName || 'Academic Staff'}</strong>
            </div>
          </div>
        </div>

        {/* Timetable Table Grid */}
        <div className="border-2 border-slate-900 rounded-2xl overflow-hidden mb-6">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-extrabold">
                <th className="p-2.5 text-center border-r border-slate-700 w-32 uppercase text-[10px] tracking-wider">
                  Period / Time
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="p-2.5 text-center border-r border-slate-700 last:border-r-0 uppercase text-[11px] font-black tracking-wide"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-300">
              {/* Assembly */}
              <tr className="bg-slate-100 font-bold text-[10px] text-center border-b border-slate-300">
                <td className="p-1.5 border-r border-slate-300">07:30 - 08:00</td>
                <td colSpan={5} className="p-1.5 tracking-wider uppercase text-slate-700">
                  Morning Devotions, Assembly & Registration
                </td>
              </tr>

              {/* Periods 1 to 3 */}
              {PERIODS.slice(0, 3).map((pDef) => (
                <tr key={pDef.period} className="divide-x divide-slate-300">
                  <td className="p-2 text-center bg-slate-50 font-bold border-r border-slate-300">
                    <div className="font-black text-slate-900">{pDef.name}</div>
                    <div className="text-[9px] text-slate-500 font-medium">{pDef.time}</div>
                  </td>
                  {DAYS.map((day) => {
                    const slot = slotMap.get(`${day}_${pDef.period}`);
                    return (
                      <td key={day} className="p-2 text-center h-16 w-[17.5%] align-middle">
                        {slot ? (
                          <div>
                            <div className="font-extrabold text-slate-950 text-xs">
                              {slot.subject?.name}
                            </div>
                            <div className="text-[10px] text-slate-600 font-medium mt-0.5">
                              {slot.teacher?.fullName?.split(' ')[1] || slot.teacher?.fullName}
                              {slot.room && ` • ${slot.room}`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Snack Break */}
              <tr className="bg-amber-100 font-extrabold text-[10px] text-center text-amber-950 border-y-2 border-slate-900">
                <td className="p-1.5 border-r border-slate-400">10:15 - 10:45</td>
                <td colSpan={5} className="p-1.5 uppercase tracking-widest">
                  Snack & Recess Break (30 Minutes)
                </td>
              </tr>

              {/* Periods 4 and 5 */}
              {PERIODS.slice(3, 5).map((pDef) => (
                <tr key={pDef.period} className="divide-x divide-slate-300">
                  <td className="p-2 text-center bg-slate-50 font-bold border-r border-slate-300">
                    <div className="font-black text-slate-900">{pDef.name}</div>
                    <div className="text-[9px] text-slate-500 font-medium">{pDef.time}</div>
                  </td>
                  {DAYS.map((day) => {
                    const slot = slotMap.get(`${day}_${pDef.period}`);
                    return (
                      <td key={day} className="p-2 text-center h-16 w-[17.5%] align-middle">
                        {slot ? (
                          <div>
                            <div className="font-extrabold text-slate-950 text-xs">
                              {slot.subject?.name}
                            </div>
                            <div className="text-[10px] text-slate-600 font-medium mt-0.5">
                              {slot.teacher?.fullName?.split(' ')[1] || slot.teacher?.fullName}
                              {slot.room && ` • ${slot.room}`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Lunch Break */}
              <tr className="bg-emerald-100 font-extrabold text-[10px] text-center text-emerald-950 border-y-2 border-slate-900">
                <td className="p-1.5 border-r border-slate-400">12:15 - 13:00</td>
                <td colSpan={5} className="p-1.5 uppercase tracking-widest">
                  Midday Dining & Canteen Lunch (45 Minutes)
                </td>
              </tr>

              {/* Periods 6 to 8 */}
              {PERIODS.slice(5, 8).map((pDef) => (
                <tr key={pDef.period} className="divide-x divide-slate-300">
                  <td className="p-2 text-center bg-slate-50 font-bold border-r border-slate-300">
                    <div className="font-black text-slate-900">{pDef.name}</div>
                    <div className="text-[9px] text-slate-500 font-medium">{pDef.time}</div>
                  </td>
                  {DAYS.map((day) => {
                    const slot = slotMap.get(`${day}_${pDef.period}`);
                    return (
                      <td key={day} className="p-2 text-center h-16 w-[17.5%] align-middle">
                        {slot ? (
                          <div>
                            <div className="font-extrabold text-slate-950 text-xs">
                              {slot.subject?.name}
                            </div>
                            <div className="text-[10px] text-slate-600 font-medium mt-0.5">
                              {slot.teacher?.fullName?.split(' ')[1] || slot.teacher?.fullName}
                              {slot.room && ` • ${slot.room}`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend & Subject Directory */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-300 text-[11px] mb-8">
          {legendItems.map((item) => (
            <div key={item.code} className="flex items-start gap-2">
              <span className="font-black text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded text-[9px]">
                {item.code}
              </span>
              <div>
                <div className="font-bold text-slate-900 leading-tight">{item.subjectName}</div>
                <div className="text-[10px] text-slate-500">{item.teacherName}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Official Signatures Line */}
        <div className="grid grid-cols-3 gap-8 pt-6 border-t border-slate-300 text-center text-xs">
          <div>
            <div className="border-b border-slate-400 pb-8" />
            <span className="block font-bold text-slate-800 mt-1.5">
              {stream.formTeacher?.fullName || 'Form Teacher'}
            </span>
            <span className="text-[10px] text-slate-500">Form Teacher</span>
          </div>

          <div>
            <div className="border-b border-slate-400 pb-8" />
            <span className="block font-bold text-slate-800 mt-1.5">Mrs. Patience Baidoo</span>
            <span className="text-[10px] text-slate-500">Registrar & Dean of Academics</span>
          </div>

          <div>
            <div className="border-b border-slate-400 pb-8" />
            <span className="block font-bold text-slate-800 mt-1.5">Dr. Emmanuel K. Addo</span>
            <span className="text-[10px] text-slate-500">Headmaster (Official Seal)</span>
          </div>
        </div>

        {/* Document Footer */}
        <div className="mt-8 pt-3 border-t border-slate-200 text-[9px] text-slate-400 text-center flex items-center justify-between">
          <span>Kings & Queens Preparatory School • Ghana Basic Education Timetable</span>
          <span>Generated via Ghana SMS • Valid for Term 1, 2025/2026</span>
        </div>

      </div>
    </div>
  );
};
