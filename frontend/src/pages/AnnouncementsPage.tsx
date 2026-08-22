import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/common/ConfirmModal';
import {
  Bell,
  Plus,
  Calendar,
  AlertCircle,
  X,
  Send,
  PhoneCall,
  Crown,
  Trash2,
  Filter,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const AnnouncementsPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [smsMessage, setSmsMessage] = useState(
    'Kings & Queens Preparatory Notice: PTA General Meeting is scheduled for Friday at 3:00 PM in the Assembly Hall.'
  );

  const { data: announcementsData, refetch: refetchAnnouncements, isLoading: isAnnouncementsLoading } = useQuery({
    queryKey: ['announcements', priorityFilter],
    queryFn: async () =>
      (
        await api.get('/announcements', {
          params: { priority: priorityFilter !== 'ALL' ? priorityFilter : undefined },
        })
      ).data,
  });

  const announcements = announcementsData?.announcements || [];

  // Create Circular
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.warning('Please provide notice title and content');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/announcements', { title, content, priority });
      toast.success(res.data.message || 'Notice broadcasted to school community successfully!');
      setShowModal(false);
      setTitle('');
      setContent('');
      refetchAnnouncements();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to post circular');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send SMS Broadcast
  const handleSendSmsBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsMessage.trim()) {
      toast.warning('Please enter an SMS text message');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/announcements/broadcast-sms', { message: smsMessage });
      toast.success(res.data.message || 'SMS broadcast sent to all parent mobile contacts!');
      setShowSmsModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to dispatch SMS broadcast');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Notice
  const handleConfirmDelete = async () => {
    if (!noticeToDelete) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/announcements/${noticeToDelete.id}`);
      toast.success('Notice deleted from noticeboard successfully.');
      setNoticeToDelete(null);
      refetchAnnouncements();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            School Noticeboard & Parent SMS Broadcasts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Official circulars, PTA meeting notices and instant SMS broadcasts to parents via Hubtel/Twilio gateway
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSmsModal(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs border border-slate-700 transition"
          >
            <Send className="w-4 h-4 text-amber-400" /> Send SMS Broadcast
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Post New Circular
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Filter by Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="p-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">URGENT</option>
            <option value="HIGH">HIGH</option>
            <option value="NORMAL">NORMAL</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-semibold">{announcements.length} Notices Posted</span>
      </div>

      {/* Notices Feed */}
      <div className="space-y-4">
        {isAnnouncementsLoading ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
            <p className="text-xs font-bold">Loading notices...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 space-y-2">
            <Bell className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">No Circulars Found</h4>
            <p className="text-xs text-slate-500">Post a new circular to broadcast information to the school community.</p>
          </div>
        ) : (
          announcements.map((item: any) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      item.priority === 'HIGH' || item.priority === 'URGENT'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    {item.priority} PRIORITY
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
                    Posted by {item.author?.fullName} ({item.author?.role})
                  </span>
                  <button
                    onClick={() => setNoticeToDelete(item)}
                    title="Delete notice"
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{item.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.content}</p>
            </div>
          ))
        )}
      </div>

      {/* 1. Post Circular Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" /> New Circular Broadcast
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Notice Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PTA General Meeting Notice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Priority Level:</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Notice Content / Body:</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write notice text here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-extrabold flex items-center gap-1.5 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Broadcast Circular</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. SMS Broadcast Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-emerald-600" /> Send SMS to Parents (Ghana SMS)
              </h3>
              <button onClick={() => setShowSmsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendSmsBroadcast} className="space-y-3.5 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">SMS Text Message:</label>
                <textarea
                  rows={4}
                  required
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl text-xs text-amber-900 dark:text-amber-300 space-y-1 border border-amber-200 dark:border-amber-900/40">
                <div className="font-bold">Target: All Kings & Queens Registered Parent Contacts</div>
                <p className="text-[11px] text-amber-800 dark:text-amber-400">Messages dispatched via Hubtel / Twilio Ghana Gateway.</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSmsModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-extrabold flex items-center gap-1.5 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Dispatching SMS...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Dispatch SMS Broadcast</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {noticeToDelete && (
        <ConfirmModal
          isOpen={!!noticeToDelete}
          onClose={() => setNoticeToDelete(null)}
          onConfirm={handleConfirmDelete}
          isLoading={isSubmitting}
          title="Delete Noticeboard Circular"
          message={`Are you sure you want to remove notice "${noticeToDelete.title}"?`}
          confirmText="Confirm & Delete"
        />
      )}

    </div>
  );
};
