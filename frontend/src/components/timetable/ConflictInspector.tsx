import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ConflictItem } from './types';

interface ConflictInspectorProps {
  conflicts: ConflictItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectConflictSlot?: (slotId: string) => void;
}

export const ConflictInspector: React.FC<ConflictInspectorProps> = ({
  conflicts,
  isOpen,
  onClose,
  onSelectConflictSlot,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');

  if (!isOpen) return null;

  const criticalCount = conflicts.filter((c) => c.severity === 'CRITICAL').length;
  const warningCount = conflicts.filter((c) => c.severity === 'WARNING').length;
  const infoCount = conflicts.filter((c) => c.severity === 'INFO').length;

  const filteredConflicts = conflicts.filter(
    (c) => filterSeverity === 'ALL' || c.severity === filterSeverity
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
              criticalCount > 0
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {criticalCount > 0 ? (
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Conflict Engine Inspector
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  criticalCount > 0
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                {conflicts.length === 0 ? 'All Schedules Conflict-Free' : `${conflicts.length} Notice(s)`}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live automated validation for teacher collisions, room overbookings, and staff fatigue
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setFilterSeverity('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            filterSeverity === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-slate-700'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          All ({conflicts.length})
        </button>
        <button
          onClick={() => setFilterSeverity('CRITICAL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            filterSeverity === 'CRITICAL'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
          }`}
        >
          Critical Collisions ({criticalCount})
        </button>
        <button
          onClick={() => setFilterSeverity('WARNING')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            filterSeverity === 'WARNING'
              ? 'bg-sky-600 text-white'
              : 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300'
          }`}
        >
          Room Conflicts ({warningCount})
        </button>
        <button
          onClick={() => setFilterSeverity('INFO')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            filterSeverity === 'INFO'
              ? 'bg-purple-600 text-white'
              : 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300'
          }`}
        >
          Workload Alerts ({infoCount})
        </button>
      </div>

      {/* Conflict List */}
      <div className="space-y-2.5 max-h-72 overflow-y-auto">
        {filteredConflicts.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              No conflicts detected in this filter category!
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Teacher double bookings and room allocations are clean.
            </p>
          </div>
        ) : (
          filteredConflicts.map((c) => (
            <div
              key={c.id}
              className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 ${
                c.severity === 'CRITICAL'
                  ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50'
                  : c.severity === 'WARNING'
                  ? 'bg-sky-50/70 dark:bg-sky-950/20 border-sky-300 dark:border-sky-700/50'
                  : 'bg-purple-50/70 dark:bg-purple-950/20 border-purple-300 dark:border-purple-700/50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      c.severity === 'CRITICAL'
                        ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                        : c.severity === 'WARNING'
                        ? 'bg-sky-200 text-sky-900 dark:bg-sky-900 dark:text-sky-200'
                        : 'bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200'
                    }`}
                  >
                    {c.type.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {c.dayOfWeek} {c.period ? `• Period ${c.period}` : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-900 dark:text-white font-medium leading-relaxed">
                  {c.description}
                </p>

                {c.conflictingSlots && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {c.conflictingSlots.map((cs) => (
                      <span
                        key={cs.slotId}
                        onClick={() => onSelectConflictSlot && onSelectConflictSlot(cs.slotId)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-500 cursor-pointer transition flex items-center gap-1"
                      >
                        <span>
                          {cs.streamName} ({cs.subjectName})
                        </span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
