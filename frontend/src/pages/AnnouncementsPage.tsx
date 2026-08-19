import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Bell, Plus, Calendar, AlertCircle, X, Send, PhoneCall } from 'lucide-react';

export const AnnouncementsPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [smsMessage, setSmsMessage] = useState('Achimota School Notice: PTA General Meeting is scheduled for Friday at 3:00 PM in the Assembly Hall.');

  const { data: announcementsData, refetch } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => (await api.get('/announcements')).data,
  });

  const announcements = announcementsData?.announcements || [
    {
      id: '1',
      title: 'Welcome to Academic Year 2025/2026',
      content: 'Dear Parents, Staff, and Students, we warmly welcome everyone to Term 1. PTA meeting is scheduled for Friday at 3:00 PM.',
      priority: 'HIGH',
      createdAt: '2025-09-01T10:00:00Z',
      author: { fullName: 'Dr. Emmanuel K. Addo', role: 'SUPER_ADMIN' },
    },
    {
      id: '2',
      title: 'Mid-Term Break Announcement',
      content: 'Please take note that mid-term break starts on October 24th. Mid-term assessments will be published online.',
      priority: 'NORMAL',
      createdAt: '2025-10-10T08:30:00Z',
      author: { fullName: 'Mrs. Patience Baidoo', role: 'ADMIN' },
    },
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/announcements', { title, content, priority });
      setShowModal(false);
      setTitle('');
      setContent('');
      refetch();
    } catch {
      setShowModal(false);
    }
  };

  const handleSendSmsBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/announcements/broadcast-sms', { message: smsMessage });
      alert(res.data.message);
      setShowSmsModal(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed SMS broadcast');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">School Noticeboard & SMS Broadcasts</h2>
          <p className="text-xs text-slate-500">Official circulars, PTA meeting notices and instant SMS broadcasts to parents via Hubtel/Twilio gateway</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSmsModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Send className="w-4 h-4 text-amber-400" /> Send SMS Broadcast
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Post New Circular
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {announcements.map((item: any) => (
          <div
            key={item.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    item.priority === 'HIGH' || item.priority === 'URGENT'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {item.priority} PRIORITY
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                Posted by {item.author?.fullName} ({item.author?.role})
              </span>
            </div>

            <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{item.content}</p>
          </div>
        ))}
      </div>

      {/* Post Circular Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">New Broadcast Notice</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PTA Meeting Notice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1 font-semibold"
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Content / Body</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write notice text here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMS Broadcast Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-emerald-600" /> Send SMS to Parents (Ghana SMS)
              </h3>
              <button onClick={() => setShowSmsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendSmsBroadcast} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">SMS Text Message</label>
                <textarea
                  rows={4}
                  required
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 space-y-1">
                <div className="font-bold">Target: All Registered Parent Contacts</div>
                <p className="text-[11px] text-amber-800">Messages will be delivered instantly via Hubtel / Twilio Ghana Gateway.</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSmsModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                >
                  Dispatch SMS Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
