import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Users, Search, UserPlus, FileText, Phone, Mail, MapPin, X, Check } from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Add Student Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    dob: '2011-05-12',
    gender: 'MALE',
    address: 'Mile 7, Achimota, Accra',
    phone: '+233 24 000 1122',
  });

  const { data: studentsData, refetch } = useQuery({
    queryKey: ['students', searchTerm],
    queryFn: async () => (await api.get('/students', { params: { search: searchTerm } })).data,
  });

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/students', formData);
      setShowAddModal(false);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add student');
    }
  };

  const students = studentsData?.students || [];

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Student Admissions & Directory</h2>
          <p className="text-xs text-slate-500">Manage student bio-data, auto-generated Index IDs, class enrollments and guardian contacts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
        >
          <UserPlus className="w-4 h-4" /> New Student Admission
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, index ID (e.g. SMS-2025-001) or guardian phone..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <th className="p-3.5">Student Index ID</th>
                <th className="p-3.5">Full Name</th>
                <th className="p-3.5">Gender & DOB</th>
                <th className="p-3.5">Current Class</th>
                <th className="p-3.5">Guardian Contact</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((st: any) => (
                <tr key={st.id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 font-mono font-bold text-emerald-800">{st.studentId}</td>
                  <td className="p-3.5 font-semibold text-slate-900 flex items-center gap-2">
                    <img
                      src={st.user.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150'}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    {st.user.fullName}
                  </td>
                  <td className="p-3.5 text-slate-600">
                    {st.gender} • {new Date(st.dob).toLocaleDateString()}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      {st.enrollments?.[0]?.stream?.class?.name || 'JHS 1'} ({st.enrollments?.[0]?.stream?.name || 'Gold'})
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600">
                    {st.guardians?.[0]?.guardian?.user?.fullName || 'Kofi Osei'} ({st.guardians?.[0]?.guardian?.user?.phone || '+233 24 999 8877'})
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setSelectedStudent(st)}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">New Ghana Student Admission</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwame Mensah"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="kwame@student.achimota.edu.gh"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Residential Address in Ghana</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
                >
                  Submit Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Profile Preview Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStudent.user.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150'}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedStudent.user.fullName}</h3>
                  <span className="font-mono text-xs text-emerald-700 font-bold">{selectedStudent.studentId}</span>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="font-bold text-slate-900 text-xs">Academic Status</div>
                <div>Class & Stream: <strong>{selectedStudent.enrollments?.[0]?.stream?.class?.name || 'JHS 1'} ({selectedStudent.enrollments?.[0]?.stream?.name || 'Gold'})</strong></div>
                <div>Admission Date: {new Date(selectedStudent.admissionDate).toLocaleDateString()}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="font-bold text-slate-900 text-xs">Bio-data & Address</div>
                <div>Gender: {selectedStudent.gender} • DOB: {new Date(selectedStudent.dob).toLocaleDateString()}</div>
                <div>Address: {selectedStudent.address}</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
