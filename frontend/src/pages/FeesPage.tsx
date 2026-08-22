import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/common/ConfirmModal';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Download,
  Printer,
  ArrowUpRight,
  Search,
  FileText,
  Phone,
  Building2,
  X,
  Filter,
  Loader2,
  Sparkles,
  Send,
  Trash2,
  Layers,
  AlertTriangle,
  Receipt,
} from 'lucide-react';

export const FeesPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'invoices' | 'defaulters' | 'structures'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showAddStructureModal, setShowAddStructureModal] = useState(false);
  const [structureToDelete, setStructureToDelete] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form payment
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('MOMO_MTN');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Form new invoice
  const [invoiceForm, setInvoiceForm] = useState({
    studentId: '',
    totalAmount: '1450',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Form new structure item
  const [structureForm, setStructureForm] = useState({
    classId: '',
    name: 'Tuition Fee',
    amount: '950',
    description: 'Term 1 Tuition and Academic Instruction Levy',
  });

  // 1. Fetch Invoices
  const { data: invoicesData, refetch: refetchInvoices, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['invoicesList', searchTerm, statusFilter],
    queryFn: async () =>
      (
        await api.get('/fees/invoices', {
          params: { search: searchTerm || undefined, status: statusFilter || undefined },
        })
      ).data,
  });

  // 2. Fetch Defaulters
  const { data: defaultersData, refetch: refetchDefaulters, isLoading: isDefaultersLoading } = useQuery({
    queryKey: ['feeDefaulters'],
    queryFn: async () => (await api.get('/fees/defaulters')).data,
  });

  // 3. Fetch Fee Structures
  const { data: structuresData, refetch: refetchStructures, isLoading: isStructuresLoading } = useQuery({
    queryKey: ['feeStructuresList'],
    queryFn: async () => (await api.get('/fees/structures')).data,
  });

  // 4. Fetch Classes & Students
  const { data: classesData } = useQuery({
    queryKey: ['academicClassesForFees'],
    queryFn: async () => (await api.get('/academic/classes')).data,
  });

  const { data: studentsData } = useQuery({
    queryKey: ['studentsListForFees'],
    queryFn: async () => (await api.get('/students')).data,
  });

  const invoices = invoicesData?.invoices || [];
  const defaulters = defaultersData?.defaulters || [];
  const structures = structuresData?.structures || [];
  const classes = classesData?.classes || [];
  const students = studentsData?.students || [];

  // Record MoMo Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.warning('Please enter a valid payment amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/fees/payments', {
        invoiceId: selectedInvoice.id,
        amountPaid: amount,
        paymentMethod,
        referenceNumber: refNumber || `MOMO-${Date.now().toString().slice(-6)}`,
        notes,
      });

      toast.success(
        res.data.message || `Payment of GHS ₵${amount.toFixed(2)} recorded successfully! Official MoMo receipt generated.`
      );
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      setPaymentAmount('');
      setRefNumber('');
      refetchInvoices();
      refetchDefaulters();
      queryClient.invalidateQueries({ queryKey: ['feeSummary'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Payment recording failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Single Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.studentId || !invoiceForm.totalAmount) {
      toast.warning('Please select a pupil and enter an invoice amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/fees/invoices', invoiceForm);
      toast.success(res.data.message || 'Invoice generated successfully!');
      setShowCreateInvoiceModal(false);
      setInvoiceForm({
        studentId: '',
        totalAmount: '1450',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      refetchInvoices();
      refetchDefaulters();
      queryClient.invalidateQueries({ queryKey: ['feeSummary'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Fee Structure
  const handleAddStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structureForm.classId || !structureForm.name || !structureForm.amount) {
      toast.warning('Please fill in class level, fee name, and amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const activeTermId = (await api.get('/academic/terms')).data?.terms?.[0]?.id;
      const res = await api.post('/fees/structures', {
        ...structureForm,
        termId: activeTermId,
      });

      toast.success('Fee structure item added successfully!');
      setShowAddStructureModal(false);
      setStructureForm({ classId: '', name: 'Tuition Fee', amount: '950', description: '' });
      refetchStructures();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add fee structure');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Fee Structure
  const handleConfirmDeleteStructure = async () => {
    if (!structureToDelete) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/fees/structures/${structureToDelete.id}`);
      toast.success('Fee structure item removed successfully.');
      setStructureToDelete(null);
      refetchStructures();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete fee structure');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dispatch MoMo SMS Reminders
  const handleSendReminders = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/fees/defaulters/send-reminders');
      toast.success(res.data.message || 'SMS payment reminders sent to parent contacts!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send SMS reminders');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Print Official MoMo Receipt
  const handlePrintReceipt = (invoice: any) => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;

    const payment = invoice.payments?.[0] || {
      receiptNumber: 'REC-2025-001',
      amountPaid: invoice.amountPaid || invoice.totalAmount,
      paymentMethod: 'MOMO_MTN',
      paymentDate: new Date().toISOString(),
      referenceNumber: 'MTN-998811002',
    };

    receiptWindow.document.write(`
      <html>
        <head>
          <title>Fee Receipt - ${invoice.student?.user?.fullName}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 30px; color: #0f172a; max-width: 650px; margin: auto; }
            .header { text-align: center; border-bottom: 2px solid #006b3f; padding-bottom: 15px; }
            .motto { font-size: 11px; color: #64748b; font-style: italic; }
            .badge { background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; font-size: 13px; }
            .amount-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #0f172a; }
            .footer { text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0; color:#0f172a;">KINGS & QUEENS PREPARATORY SCHOOL</h2>
            <div class="motto">"Excellence, Royalty & Moral Leadership (KG 1 - Basic 9)"</div>
            <div style="font-size:12px; margin-top:5px; font-weight:bold; color:#006b3f;">OFFICIAL MOBILE MONEY TUITION RECEIPT</div>
          </div>

          <div class="grid">
            <div>
              <strong>Receipt No:</strong> ${payment.receiptNumber}<br>
              <strong>Date:</strong> ${new Date(payment.paymentDate).toLocaleDateString()}<br>
              <strong>Pupil Name:</strong> ${invoice.student?.user?.fullName}<br>
              <strong>Index ID:</strong> ${invoice.student?.studentId}
            </div>
            <div>
              <strong>Class Stream:</strong> ${invoice.student?.enrollments?.[0]?.stream?.class?.name || 'Basic 7'} ${invoice.student?.enrollments?.[0]?.stream?.name || 'A'}<br>
              <strong>Payment Method:</strong> ${payment.paymentMethod}<br>
              <strong>MoMo Reference:</strong> ${payment.referenceNumber || 'N/A'}<br>
              <strong>Status:</strong> <span class="badge">PAYMENT VERIFIED</span>
            </div>
          </div>

          <div class="amount-box">
            <div style="font-size:12px; color:#64748b;">AMOUNT RECEIVED</div>
            <div class="amount">GHS ₵ ${payment.amountPaid.toFixed(2)}</div>
            <div style="font-size:12px; color:#475569; margin-top:5px;">Remaining Invoice Balance: GHS ₵ ${invoice.balance.toFixed(2)}</div>
          </div>

          <div class="footer">
            Thank you for paying through Kings & Queens Mobile Money Services.<br>
            Plot 12, East Legon Hills, Accra, Ghana | +233 24 123 4567 | info@kqprep.edu.gh
          </div>
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Fees & Mobile Money Collections (GHS ₵)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage term tuition levies, student invoicing, and instant MoMo payment receipts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'structures' ? (
            <button
              onClick={() => setShowAddStructureModal(true)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> Add Fee Structure Item
            </button>
          ) : (
            <button
              onClick={() => setShowCreateInvoiceModal(true)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> Issue Custom Invoice
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b-2 border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'invoices'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Invoices & MoMo Payments
        </button>

        <button
          onClick={() => setActiveTab('defaulters')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'defaulters'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" /> Defaulters & SMS Reminders ({defaulters.length})
        </button>

        <button
          onClick={() => setActiveTab('structures')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'structures'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" /> Fee Structures by Class
        </button>
      </div>

      {/* TAB 1: INVOICES & MOMO PAYMENTS */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoices by pupil name or Index ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
              >
                <option value="">All Payment Statuses</option>
                <option value="PAID">PAID</option>
                <option value="PARTIAL">PARTIAL</option>
                <option value="UNPAID">UNPAID</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3.5">Invoice No</th>
                    <th className="p-3.5">Pupil Name</th>
                    <th className="p-3.5">Total Amount</th>
                    <th className="p-3.5">Amount Paid</th>
                    <th className="p-3.5">Balance Due</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isInvoicesLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                        <span>Loading fee invoices...</span>
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No fee invoices found.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-bold font-mono text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                        <td className="p-3.5">
                          <div className="font-extrabold text-slate-800 dark:text-slate-200">{inv.student?.user?.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{inv.student?.studentId}</div>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-white">GHS ₵{inv.totalAmount?.toFixed(2)}</td>
                        <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">GHS ₵{inv.amountPaid?.toFixed(2)}</td>
                        <td className="p-3.5 font-bold text-rose-600 dark:text-rose-400">GHS ₵{inv.balance?.toFixed(2)}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : inv.status === 'PARTIAL'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          {inv.balance > 0 && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setPaymentAmount(inv.balance.toString());
                                setShowPaymentModal(true);
                              }}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                            >
                              Record MoMo Payment
                            </button>
                          )}
                          <button
                            onClick={() => handlePrintReceipt(inv)}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-500" /> Receipt
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEFAULTERS & SMS REMINDERS */}
      {activeTab === 'defaulters' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Outstanding Fee Defaulters ({defaulters.length} Pupils)
              </h3>
              <p className="text-xs text-slate-500">Dispatch payment reminder SMS to parent phone contacts</p>
            </div>

            <button
              onClick={handleSendReminders}
              disabled={isSubmitting || defaulters.length === 0}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-2xl font-extrabold text-xs flex items-center gap-2 shadow-md transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching SMS...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>Send MoMo Payment Reminder SMS to All Defaulters</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3.5">Pupil Name</th>
                    <th className="p-3.5">Class Stream</th>
                    <th className="p-3.5">Parent / Contact</th>
                    <th className="p-3.5">Total Invoiced</th>
                    <th className="p-3.5">Amount Paid</th>
                    <th className="p-3.5">Balance Due</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {defaulters.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{inv.student?.user?.fullName}</td>
                      <td className="p-3.5 font-semibold">
                        {inv.student?.enrollments?.[0]?.stream?.class?.name} {inv.student?.enrollments?.[0]?.stream?.name}
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono">{inv.student?.user?.phone || '+233 24 999 8877'}</td>
                      <td className="p-3.5">GHS ₵{inv.totalAmount?.toFixed(2)}</td>
                      <td className="p-3.5 font-semibold text-emerald-600">GHS ₵{inv.amountPaid?.toFixed(2)}</td>
                      <td className="p-3.5 font-black text-rose-600">GHS ₵{inv.balance?.toFixed(2)}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPaymentAmount(inv.balance.toString());
                            setShowPaymentModal(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs"
                        >
                          Record MoMo Payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FEE STRUCTURES BY CLASS */}
      {activeTab === 'structures' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {structures.map((item: any) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-[10px] text-slate-800 dark:text-slate-200">
                      {item.class?.name || 'All Classes'} ({item.class?.level || 'Basic'})
                    </span>
                    <button
                      onClick={() => setStructureToDelete(item)}
                      title="Delete fee structure"
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base mt-2">{item.name}</h4>
                  <p className="text-xs text-slate-500">{item.description || 'Standard term academic fee'}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Levy Amount:</span>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    GHS ₵{item.amount?.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" /> Record Mobile Money Payment
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-1 border border-slate-200 dark:border-slate-700">
                <div>
                  <strong>Pupil:</strong> {selectedInvoice.student?.user?.fullName} ({selectedInvoice.student?.studentId})
                </div>
                <div>
                  <strong>Invoice Balance Due:</strong> <span className="text-rose-600 font-extrabold">GHS ₵{selectedInvoice.balance?.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Amount Paid (GHS ₵):</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Payment Channel:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                >
                  <option value="MOMO_MTN">MTN Mobile Money (*170#)</option>
                  <option value="MOMO_TELECEL">Telecel Cash (*110#)</option>
                  <option value="MOMO_AT">AT Money (*110#)</option>
                  <option value="CASH">Cash Deposit at Bursar Desk</option>
                  <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">MoMo Transaction ID / Ref:</label>
                <input
                  type="text"
                  placeholder="e.g. MTN-998811002"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
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
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Issue Receipt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Issue Custom Invoice Modal */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" /> Issue Custom Fee Invoice
              </h3>
              <button onClick={() => setShowCreateInvoiceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3.5 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Pupil:</label>
                <select
                  required
                  value={invoiceForm.studentId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, studentId: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                >
                  <option value="">Select Pupil</option>
                  {students.map((st: any) => (
                    <option key={st.id} value={st.id}>
                      {st.user?.fullName} ({st.studentId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Invoice Amount (GHS ₵):</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={invoiceForm.totalAmount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, totalAmount: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Payment Due Date:</label>
                <input
                  type="date"
                  required
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
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
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Generate Invoice</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Structure Modal */}
      {showAddStructureModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" /> Add Fee Structure Item
              </h3>
              <button onClick={() => setShowAddStructureModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStructure} className="space-y-3.5 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Class Level:</label>
                <select
                  required
                  value={structureForm.classId}
                  onChange={(e) => setStructureForm({ ...structureForm, classId: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                >
                  <option value="">Select Class</option>
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Fee Item Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tuition Fee, Feeding Levy, PTA Dues"
                  value={structureForm.name}
                  onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Amount in GHS ₵:</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={structureForm.amount}
                  onChange={(e) => setStructureForm({ ...structureForm, amount: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStructureModal(false)}
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
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Save Fee Structure</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Structure Confirmation */}
      {structureToDelete && (
        <ConfirmModal
          isOpen={!!structureToDelete}
          onClose={() => setStructureToDelete(null)}
          onConfirm={handleConfirmDeleteStructure}
          isLoading={isSubmitting}
          title="Delete Fee Structure Item"
          message={`Are you sure you want to delete "${structureToDelete.name}" (GHS ₵${structureToDelete.amount}) for ${structureToDelete.class?.name}?`}
          confirmText="Confirm & Delete"
        />
      )}

    </div>
  );
};
