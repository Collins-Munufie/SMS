import React, { useState } from 'react';
import {
  Wand2,
  Copy,
  Trash2,
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Stream } from './types';

interface AutoScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStream: Stream | null;
  allStreams: Stream[];
  onAutoGenerate: (streamId: string, clearExisting: boolean) => Promise<void>;
  onCopyFromStream: (sourceStreamId: string, targetStreamId: string, overrideExisting: boolean) => Promise<void>;
  onClearStream: (streamId: string) => Promise<void>;
}

export const AutoScheduleModal: React.FC<AutoScheduleModalProps> = ({
  isOpen,
  onClose,
  targetStream,
  allStreams,
  onAutoGenerate,
  onCopyFromStream,
  onClearStream,
}) => {
  const [activeTab, setActiveTab] = useState<'AUTO' | 'COPY' | 'CLEAR'>('AUTO');
  const [sourceStreamId, setSourceStreamId] = useState<string>('');
  const [clearExisting, setClearExisting] = useState<boolean>(true);
  const [overrideExisting, setOverrideExisting] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !targetStream) return null;

  const otherStreams = allStreams.filter((s) => s.id !== targetStream.id);

  const handleAutoGenerate = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      await onAutoGenerate(targetStream.id, clearExisting);
      setStatusMessage({
        type: 'success',
        text: `Successfully auto-scheduled weekly timetable for ${targetStream.class?.name} ${targetStream.name}!`,
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Auto-scheduling failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!sourceStreamId) {
      setStatusMessage({ type: 'error', text: 'Please select a source class stream to copy from.' });
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);
    try {
      await onCopyFromStream(sourceStreamId, targetStream.id, overrideExisting);
      setStatusMessage({
        type: 'success',
        text: `Successfully copied timetable schedule to ${targetStream.class?.name} ${targetStream.name}!`,
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to copy timetable',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm(`Are you sure you want to completely clear the weekly timetable for ${targetStream.class?.name} ${targetStream.name}?`)) {
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);
    try {
      await onClearStream(targetStream.id);
      setStatusMessage({
        type: 'success',
        text: `Cleared all timetable slots for ${targetStream.class?.name} ${targetStream.name}.`,
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to clear timetable',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Timetable Builder Tools
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target: <strong>{targetStream.class?.name} {targetStream.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 p-2 gap-1 bg-slate-50/50 dark:bg-slate-850/50 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('AUTO');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'AUTO'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Auto-Generate</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('COPY');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'COPY'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Template</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('CLEAR');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'CLEAR'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Grid</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-semibold">{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: Auto-Generate */}
          {activeTab === 'AUTO' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-slate-700 dark:text-slate-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-400">
                  <Wand2 className="w-4 h-4 text-emerald-600" />
                  Intelligent Schedule Allocation Algorithm
                </div>
                <p className="text-[11px] leading-relaxed">
                  Automatically fills the full 5-day school week (Monday to Friday, Periods 1 to 8)
                  using allocated subject teachers for <strong>{targetStream.class?.name} {targetStream.name}</strong>,
                  while proactively checking other class streams to avoid double-booking any teacher.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={clearExisting}
                  onChange={(e) => setClearExisting(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Clear any existing slots in this stream before generating</span>
              </label>

              <button
                onClick={handleAutoGenerate}
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md shadow-emerald-950/20 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isLoading ? 'Generating Weekly Schedule...' : 'Generate Full Timetable'}</span>
              </button>
            </div>
          )}

          {/* TAB 2: Copy Template */}
          {activeTab === 'COPY' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Select Source Class Stream to Clone:
                </label>
                <select
                  value={sourceStreamId}
                  onChange={(e) => setSourceStreamId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-semibold"
                >
                  <option value="">-- Choose Class Stream --</option>
                  {otherStreams.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.class?.name} {s.name} ({s.formTeacher?.fullName || 'No Form Teacher'})
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={overrideExisting}
                  onChange={(e) => setOverrideExisting(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span>Overwrite existing slots in {targetStream.class?.name} {targetStream.name}</span>
              </label>

              <button
                onClick={handleCopy}
                disabled={isLoading || !sourceStreamId}
                className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-extrabold shadow-md shadow-sky-950/20 transition flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>{isLoading ? 'Cloning Schedule...' : 'Clone Timetable Structure'}</span>
              </button>
            </div>
          )}

          {/* TAB 3: Clear */}
          {activeTab === 'CLEAR' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Reset Timetable Warning
                </div>
                <p className="text-[11px] leading-relaxed">
                  This will remove all period assignments for <strong>{targetStream.class?.name} {targetStream.name}</strong>.
                  This action cannot be undone.
                </p>
              </div>

              <button
                onClick={handleClear}
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md shadow-rose-950/20 transition flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isLoading ? 'Clearing...' : 'Clear All Timetable Slots'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
