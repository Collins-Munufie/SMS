import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  Printer,
  X,
  Sparkles,
  BookOpen,
  Award,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { ReportCardPayload } from './types';
import { ReportCardView } from './ReportCardView';

interface BatchReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamId: string;
  streamName?: string;
  termId: string;
}

export const BatchReportCardModal: React.FC<BatchReportCardModalProps> = ({
  isOpen,
  onClose,
  streamId,
  streamName,
  termId,
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ['batchClassReportCards', streamId, termId],
    queryFn: async () => {
      if (!streamId) return null;
      return (
        await api.get('/grades/class-report-cards', {
          params: { streamId, termId },
        })
      ).data;
    },
    enabled: isOpen && !!streamId,
  });

  if (!isOpen) return null;

  const reportCards: ReportCardPayload[] = data?.reportCards || [];

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col p-4 sm:p-6 overflow-y-auto">
      {/* Top Floating Control Bar (hidden on print) */}
      <div className="print:hidden sticky top-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl mb-6 max-w-5xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Class Report Cards Booklet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {streamName ? `Class: ${streamName}` : 'All Pupils in Stream'} • {reportCards.length} Report Cards Generated
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Close
          </button>
          <button
            onClick={handlePrintAll}
            disabled={reportCards.length === 0 || isLoading}
            className="px-5 py-2 rounded-xl text-xs font-extrabold bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white shadow-md transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Print Entire Class Booklet (PDF)</span>
          </button>
        </div>
      </div>

      {/* Booklet Content */}
      <div className="max-w-5xl mx-auto w-full flex-1">
        {isLoading ? (
          <div className="p-12 text-center text-white space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-400" />
            <p className="text-sm font-bold">Collation and Generating Full Class Booklet...</p>
          </div>
        ) : reportCards.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center max-w-md mx-auto">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h4 className="font-bold text-slate-900 dark:text-white">No Pupils Found</h4>
            <p className="text-xs text-slate-500 mt-1">No enrolled students or grades found for this stream.</p>
          </div>
        ) : (
          <div className="space-y-12 print:space-y-0">
            {reportCards.map((rc) => (
              <ReportCardView key={rc.student.id} reportCard={rc} isBatchMode={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
