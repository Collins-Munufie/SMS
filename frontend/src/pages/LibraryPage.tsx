import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { BookOpen, Search, Plus, CheckCircle2, Clock, AlertTriangle, UserCheck, X } from 'lucide-react';

export const LibraryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [studentIdInput, setStudentIdInput] = useState('SMS-2025-001');

  const { data: booksData, refetch } = useQuery({
    queryKey: ['libraryBooks', searchTerm],
    queryFn: async () => (await api.get('/library/books', { params: { search: searchTerm } })).data,
  });

  const books = booksData?.books || [
    {
      id: 'b1',
      title: 'Aki-Ola Basic Mathematics for JHS (Basic 7-9)',
      author: 'P. A. Asiedu',
      isbn: '978-9988-1-2345-1',
      copiesTotal: 45,
      copiesAvailable: 38,
      location: 'Section A - JHS Shelf 3',
    },
    {
      id: 'b2',
      title: 'Integrated Science for Basic Schools (NaCCA Approved)',
      author: 'Prof. K. E. Mensah',
      isbn: '978-9988-2-6789-0',
      copiesTotal: 30,
      copiesAvailable: 22,
      location: 'Section B - Science Shelf 1',
    },
    {
      id: 'b3',
      title: 'Ghana Basic Education Computing & ICT Textbook',
      author: 'E. K. Quartey',
      isbn: '978-9988-3-4512-9',
      copiesTotal: 50,
      copiesAvailable: 44,
      location: 'Section C - ICT Lab Bookshelf',
    },
  ];

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    try {
      await api.post('/library/issue', {
        bookId: selectedBook.id,
        studentId: studentIdInput,
      });

      alert(`Book issued successfully to ${studentIdInput}!`);
      setShowIssueModal(false);
      setSelectedBook(null);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to issue book');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Library Catalog & Textbook Checkout</h2>
          <p className="text-xs text-slate-500">Manage NaCCA approved basic education textbooks, borrowing tracking, and returns</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search catalog by title, author or ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map((b: any) => (
          <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[10px]">
                  ISBN: {b.isbn || 'NaCCA Textbook'}
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                  {b.copiesAvailable} Available
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm leading-snug">{b.title}</h3>
              <p className="text-xs text-slate-500 font-medium">Author: {b.author}</p>
              <div className="text-[11px] text-slate-400 font-mono">Location: {b.location}</div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-medium">
                Total Copies: <strong>{b.copiesTotal}</strong>
              </div>
              <button
                onClick={() => {
                  setSelectedBook(b);
                  setShowIssueModal(true);
                }}
                disabled={b.copiesAvailable <= 0}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1"
              >
                <UserCheck className="w-3.5 h-3.5" /> Issue Book
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Issue Book Modal */}
      {showIssueModal && selectedBook && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Issue Textbook to Student</h3>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueBook} className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <div className="font-bold text-slate-900">{selectedBook.title}</div>
                <div className="text-slate-500">Author: {selectedBook.author}</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Student Index ID</label>
                <input
                  type="text"
                  required
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                >
                  Confirm Checkout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
