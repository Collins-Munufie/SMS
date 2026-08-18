import React from 'react';
import { BookOpen, Search, Plus, CheckCircle2 } from 'lucide-react';

export const LibraryPage: React.FC = () => {
  const books = [
    {
      id: '1',
      title: 'Cockcrow: Literature for Junior High Schools',
      author: 'Ghana Education Service',
      isbn: '978-9988-1-1234-5',
      category: 'Literature',
      totalCopies: 50,
      availableCopies: 49,
    },
    {
      id: '2',
      title: 'Aki-Ola Core Mathematics for SHS',
      author: 'P. A. Kwakye',
      isbn: '978-9988-2-5678-9',
      category: 'Mathematics',
      totalCopies: 40,
      availableCopies: 35,
    },
    {
      id: '3',
      title: 'Integrated Science for West Africa',
      author: 'J. K. Mensah & Co.',
      isbn: '978-9988-3-9012-3',
      category: 'Science',
      totalCopies: 30,
      availableCopies: 28,
    },
  ];

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Library Book Catalog & Borrowing</h2>
          <p className="text-xs text-slate-500">Track book inventories, ISBN numbers, borrowed copies and due date alerts</p>
        </div>
        <button className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs">
          <Plus className="w-4 h-4" /> Add Book to Catalog
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="font-bold text-slate-800 text-xs">Achimota Library Inventory</span>
          <span className="text-xs text-slate-500 font-medium">3 Titles Available</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase">
                <th className="p-3.5">Book Title</th>
                <th className="p-3.5">Author</th>
                <th className="p-3.5">ISBN</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Total / Available</th>
                <th className="p-3.5 text-right">Borrow Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {books.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-700" />
                    {b.title}
                  </td>
                  <td className="p-3.5 text-slate-600">{b.author}</td>
                  <td className="p-3.5 font-mono text-slate-500 text-[11px]">{b.isbn}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {b.category}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-800">
                    {b.availableCopies} / {b.totalCopies}
                  </td>
                  <td className="p-3.5 text-right">
                    <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg">
                      Borrow Book
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
