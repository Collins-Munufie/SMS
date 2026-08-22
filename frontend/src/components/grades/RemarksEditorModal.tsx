import React, { useState } from 'react';
import {
  Edit3,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  User,
} from 'lucide-react';

interface RemarksEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentId: string;
  termId: string;
  initialFormTeacherRemarks?: string;
  initialHeadteacherRemarks?: string;
  onSave: (payload: {
    studentId: string;
    termId: string;
    formTeacherRemarks: string;
    headteacherRemarks: string;
  }) => Promise<void>;
}

const PRESET_FORM_TEACHER_REMARKS = [
  'An outstanding academic performance. Recommended for promotion with honors.',
  'A very good and commendable effort. Keep up the dedication.',
  'Good performance and steady academic progress throughout the term.',
  'Satisfactory effort, but needs to focus more on core mathematics and science.',
  'Hardworking student with excellent classroom conduct and enthusiasm.',
  'Capable of much higher achievements with greater consistency and revision.',
];

const PRESET_HEAD_REMARKS = [
  'Promoted to next class level with high honors.',
  'Promoted to next grade level. Well done.',
  'Promoted on academic recommendation.',
  'Maintained exemplary royalty and moral leadership in the school community.',
  'A diligent and disciplined pupil. Keep striving for greater heights.',
];

export const RemarksEditorModal: React.FC<RemarksEditorModalProps> = ({
  isOpen,
  onClose,
  studentName,
  studentId,
  termId,
  initialFormTeacherRemarks = '',
  initialHeadteacherRemarks = '',
  onSave,
}) => {
  const [formTeacherRemarks, setFormTeacherRemarks] = useState(initialFormTeacherRemarks);
  const [headteacherRemarks, setHeadteacherRemarks] = useState(initialHeadteacherRemarks);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        studentId,
        termId,
        formTeacherRemarks,
        headteacherRemarks,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save remarks');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Edit Report Card Remarks
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pupil: <strong>{studentName}</strong>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Teacher Remarks */}
          <div className="space-y-1.5">
            <label className="block text-slate-700 dark:text-slate-300 font-bold">
              Form Teacher's Remarks:
            </label>
            <textarea
              rows={3}
              value={formTeacherRemarks}
              onChange={(e) => setFormTeacherRemarks(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter form teacher remarks..."
            />
            {/* Suggestion Chips */}
            <div className="flex flex-wrap gap-1 pt-1">
              {PRESET_FORM_TEACHER_REMARKS.slice(0, 3).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormTeacherRemarks(preset)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[10px] text-slate-600 dark:text-slate-400 hover:text-emerald-700 transition truncate max-w-xs"
                >
                  "{preset}"
                </button>
              ))}
            </div>
          </div>

          {/* Headteacher Remarks */}
          <div className="space-y-1.5">
            <label className="block text-slate-700 dark:text-slate-300 font-bold">
              Headmaster / Principal's Recommendation:
            </label>
            <textarea
              rows={2}
              value={headteacherRemarks}
              onChange={(e) => setHeadteacherRemarks(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter headmaster recommendation..."
            />
            {/* Suggestion Chips */}
            <div className="flex flex-wrap gap-1 pt-1">
              {PRESET_HEAD_REMARKS.slice(0, 3).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setHeadteacherRemarks(preset)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[10px] text-slate-600 dark:text-slate-400 hover:text-emerald-700 transition truncate max-w-xs"
                >
                  "{preset}"
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md shadow-emerald-950/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Remarks'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
