import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import {
  BookOpen,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  X,
  Loader2,
  Filter,
  Layers,
} from 'lucide-react';

export const LibraryPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Book Form
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Mathematics',
    totalCopies: '30',
  });

  // 1. Fetch Books
  const { data: booksData, refetch: refetchBooks, isLoading: isBooksLoading } = useQuery({
    queryKey: ['libraryBooks', searchTerm, categoryFilter],
    queryFn: async () =>
      (
        await api.get('/library/books', {
          params: { search: searchTerm || undefined, category: categoryFilter || undefined },
        })
      ).data,
  });

  // 2. Fetch Students for Issue Book selector
  const { data: studentsData } = useQuery({
    queryKey: ['studentsListForLibrary'],
    queryFn: async () => (await api.get('/students')).data,
  });

  const books = booksData?.books || [];
  const students = studentsData?.students || [];

  // 1. Add Book Handler
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title.trim() || !bookForm.author.trim() || !bookForm.isbn.trim()) {
      toast.warning('Please fill in title, author, and ISBN');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/library/books', bookForm);
      toast.success(res.data.message || 'Textbook added to catalog successfully!');
      setShowAddBookModal(false);
      setBookForm({ title: '', author: '', isbn: '', category: 'Mathematics', totalCopies: '30' });
      refetchBooks();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add textbook');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Issue Book Handler
  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !studentIdInput) {
      toast.warning('Please select a student');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/library/issue', {
        bookId: selectedBook.id,
        studentId: studentIdInput,
      });

      toast.success(res.data.message || `Book "${selectedBook.title}" issued successfully!`);
      setShowIssueModal(false);
      setSelectedBook(null);
      setStudentIdInput('');
      refetchBooks();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to issue book');
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
            Library Catalog & Textbook Checkout
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage NaCCA approved basic education textbooks, student borrowing, and returns
          </p>
        </div>

        <button
          onClick={() => setShowAddBookModal(true)}
          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> Add Textbook to Catalog
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search catalog by title, author or ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
          >
            <option value="">All Subject Categories</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="Computing">Computing & ICT</option>
            <option value="Literature">Literature & Readers</option>
            <option value="General">General Reference</option>
          </select>
        </div>
      </div>

      {/* Books Grid */}
      {isBooksLoading ? (
        <div className="p-12 text-center text-slate-500 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
          <p className="text-xs font-bold">Loading library catalog...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 max-w-md mx-auto space-y-3">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h4 className="font-extrabold text-slate-900 dark:text-white text-base">No Textbooks Found</h4>
          <p className="text-xs text-slate-500">Add NaCCA approved textbooks to manage student book checkout.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((b: any) => (
            <div
              key={b.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[10px]">
                    ISBN: {b.isbn || 'NaCCA Textbook'}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                      b.availableCopies > 0
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {b.availableCopies} Available
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug">{b.title}</h3>
                <p className="text-xs text-slate-500 font-medium">Author: {b.author}</p>
                <div className="text-[11px] text-slate-400 font-mono">Category: {b.category || 'General'}</div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-medium">
                  Total Copies: <strong>{b.totalCopies}</strong>
                </div>
                <button
                  onClick={() => {
                    setSelectedBook(b);
                    setShowIssueModal(true);
                  }}
                  disabled={b.availableCopies <= 0}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" /> Issue Book
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. Add Book Modal */}
      {showAddBookModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" /> Add Textbook to Catalog
              </h3>
              <button onClick={() => setShowAddBookModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBook} className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Book Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aki-Ola Mathematics for JHS"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Author:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. P. A. Asiedu"
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">ISBN Number:</label>
                  <input
                    type="text"
                    required
                    placeholder="978-9988-..."
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Total Copies:</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={bookForm.totalCopies}
                    onChange={(e) => setBookForm({ ...bookForm, totalCopies: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category:</label>
                <select
                  value={bookForm.category}
                  onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="Computing">Computing & ICT</option>
                  <option value="Literature">Literature & Readers</option>
                  <option value="General">General Reference</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBookModal(false)}
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
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add to Catalog</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Issue Book Modal */}
      {showIssueModal && selectedBook && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" /> Issue Textbook to Student
              </h3>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueBook} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-1 border border-slate-200 dark:border-slate-700">
                <div className="font-extrabold text-slate-900 dark:text-white">{selectedBook.title}</div>
                <div className="text-slate-500">Author: {selectedBook.author} • Available: {selectedBook.availableCopies}</div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Student:</label>
                <select
                  required
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                >
                  <option value="">Select Student</option>
                  {students.map((st: any) => (
                    <option key={st.id} value={st.id}>
                      {st.user?.fullName} ({st.studentId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl text-emerald-900 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-900/40">
                Standard textbook borrowing period: <strong>14 Days</strong>.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
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
                      <span>Checking out...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Confirm Checkout</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
