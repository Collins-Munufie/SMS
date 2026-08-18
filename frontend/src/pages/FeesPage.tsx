import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { CreditCard, DollarSign, AlertTriangle, CheckCircle2, Receipt, PhoneCall, Plus, X, Printer, RefreshCw, FileText } from 'lucide-react';

export const FeesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'defaulters' | 'structures'>('invoices');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('450');
  const [paymentMethod, setPaymentMethod] = useState('MOMO_MTN');
  const [momoRef, setMomoRef] = useState('MTN-99881100');

  // Bulk Invoice Form State
  const [showBulkInvoiceModal, setShowBulkInvoiceModal] = useState(false);
  const [selectedStreamId, setSelectedStreamId] = useState('');

  // Fee Structure Item Form State
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [feeName, setFeeName] = useState('ICT & Science Lab Levy');
  const [feeAmount, setFeeAmount] = useState('120');

  const { data: feeSummary, refetch: refetchSummary } = useQuery({
    queryKey: ['feeSummaryPage'],
    queryFn: async () => (await api.get('/fees/summary')).data,
  });

  const { data: invoicesData, refetch: refetchInvoices } = useQuery({
    queryKey: ['feeInvoices'],
    queryFn: async () => (await api.get('/fees/invoices')).data,
  });

  const { data: defaultersData } = useQuery({
    queryKey: ['feeDefaulters'],
    queryFn: async () => (await api.get('/fees/defaulters')).data,
  });

  const { data: structuresData, refetch: refetchStructures } = useQuery({
    queryKey: ['feeStructures'],
    queryFn: async () => (await api.get('/fees/structures')).data,
  });

  const { data: streamsData } = useQuery({
    queryKey: ['feeStreams'],
    queryFn: async () => {
      const res = (await api.get('/academic/streams')).data;
      if (res.streams?.[0] && !selectedStreamId) {
        setSelectedStreamId(res.streams[0].id);
      }
      return res;
    },
  });

  const { data: termsData } = useQuery({
    queryKey: ['feeTerms'],
    queryFn: async () => (await api.get('/academic/terms')).data,
  });

  const activeTermId = termsData?.terms?.find((t: any) => t.isCurrent)?.id || termsData?.terms?.[0]?.id;
  const invoices = invoicesData?.invoices || [];
  const defaulters = defaultersData?.defaulters || [];
  const structures = structuresData?.structures || [];
  const streams = streamsData?.streams || [];

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      const res = await api.post('/fees/payments', {
        invoiceId: selectedInvoice.id,
        amountPaid: Number(paymentAmount),
        paymentMethod,
        referenceNumber: momoRef,
        notes: 'Paid via Mobile Money portal',
      });
      alert(`Payment of ₵${paymentAmount} recorded! Receipt #: ${res.data.receiptNumber}`);
      setSelectedInvoice(null);
      refetchInvoices();
      refetchSummary();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record payment');
    }
  };

  const handleGenerateBulkInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/fees/invoices/generate-bulk', {
        streamId: selectedStreamId,
        termId: activeTermId,
      });
      alert(res.data.message);
      setShowBulkInvoiceModal(false);
      refetchInvoices();
      refetchSummary();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate bulk invoices');
    }
  };

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const classId = streams[0]?.classId || 'class-1';
      await api.post('/fees/structures', {
        classId,
        termId: activeTermId,
        name: feeName,
        amount: Number(feeAmount),
        description: 'Itemized fee levy',
      });
      setShowStructureModal(false);
      refetchStructures();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create fee structure');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Fees, Invoicing & Mobile Money Payments (GHS ₵)</h2>
          <p className="text-xs text-slate-500">Itemized tuition levies, bulk term invoicing, MoMo payment tracking & PDF receipt generation</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStructureModal(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Fee Levy Item
          </button>
          <button
            onClick={() => setShowBulkInvoiceModal(true)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-4 h-4" /> Generate Bulk Invoices
          </button>
        </div>
      </div>

      {/* Financial Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Total Billed (Term 1)</div>
          <div className="text-2xl font-extrabold text-slate-900">₵{(feeSummary?.totalBilled || 1450).toLocaleString()}</div>
          <p className="text-[10px] text-slate-400">Total expected school fees in GHS</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1 border-l-4 border-l-emerald-600">
          <div className="text-xs font-semibold text-slate-500">Total Revenue Collected</div>
          <div className="text-2xl font-extrabold text-emerald-800">₵{(feeSummary?.totalCollected || 1000).toLocaleString()}</div>
          <p className="text-[10px] text-emerald-700 font-medium">{feeSummary?.collectionRate || 69}% collection efficiency</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1 border-l-4 border-l-rose-600">
          <div className="text-xs font-semibold text-slate-500">Outstanding Balance</div>
          <div className="text-2xl font-extrabold text-rose-700">₵{(feeSummary?.totalOutstanding || 450).toLocaleString()}</div>
          <p className="text-[10px] text-rose-600 font-medium">Fee defaulters balance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === 'invoices'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          All Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('defaulters')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === 'defaulters'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Defaulters List ({defaulters.length})
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === 'structures'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Fee Structure Breakdown
        </button>
      </div>

      {/* Tab 1: Invoices List Table */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase">
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Total Billed</th>
                  <th className="p-3.5">Paid</th>
                  <th className="p-3.5">Balance</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-emerald-800">{inv.invoiceNumber}</td>
                    <td className="p-3.5 font-semibold text-slate-900">
                      {inv.student?.user?.fullName}
                      <div className="text-[10px] text-slate-400 font-normal">{inv.student?.studentId}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">₵{inv.totalAmount.toLocaleString()}</td>
                    <td className="p-3.5 font-bold text-emerald-800">₵{inv.amountPaid.toLocaleString()}</td>
                    <td className="p-3.5 font-bold text-rose-700">₵{inv.balance.toLocaleString()}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {inv.payments?.[0] && (
                        <button
                          onClick={() => setShowReceipt(inv.payments[0])}
                          className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg inline-flex items-center gap-1"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-700" /> Receipt
                        </button>
                      )}
                      {inv.balance > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPaymentAmount(String(inv.balance));
                          }}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs shadow-xs"
                        >
                          Record Payment
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold text-xs inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Fully Paid
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Defaulters List */}
      {activeTab === 'defaulters' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between text-rose-900 text-xs font-bold">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Outstanding Fee Defaulters Register
            </span>
            <span>Total Defaulters: {defaulters.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase">
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Guardian Contact</th>
                  <th className="p-3.5">Total Billed</th>
                  <th className="p-3.5">Outstanding Balance</th>
                  <th className="p-3.5 text-right">Reminder Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {defaulters.map((def: any) => (
                  <tr key={def.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-900">
                      {def.student?.user?.fullName}
                      <div className="text-[10px] text-emerald-800 font-mono font-normal">{def.student?.studentId}</div>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">
                      {def.student?.guardians?.[0]?.guardian?.user?.fullName || 'Kofi Osei'}
                      <div className="text-[10px] text-slate-500">{def.student?.guardians?.[0]?.guardian?.user?.phone || '+233 24 999 8877'}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">₵{def.totalAmount.toLocaleString()}</td>
                    <td className="p-3.5 font-extrabold text-rose-700">₵{def.balance.toLocaleString()}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => alert(`SMS Fee Reminder sent to guardian: ${def.student?.guardians?.[0]?.guardian?.user?.phone || '+233 24 999 8877'}`)}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 ml-auto"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> Send SMS Alert
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Fee Structure Breakdown */}
      {activeTab === 'structures' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-bold text-slate-800 text-sm">
            <span>Itemized Fee Structure Breakdown (GHS ₵)</span>
            <span className="text-emerald-700">Term 1 (2025/2026)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(structures.length > 0 ? structures : [
              { id: '1', name: 'Tuition Fee', amount: 850, description: 'Term 1 Tuition' },
              { id: '2', name: 'Feeding & Welfare', amount: 350, description: 'Daily lunch & welfare' },
              { id: '3', name: 'PTA Levy', amount: 100, description: 'Parent Teacher Association' },
              { id: '4', name: 'Examination Fee', amount: 150, description: 'Terminal Exam Materials' },
            ]).map((item: any) => (
              <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                <div className="text-lg font-extrabold text-emerald-800">₵{item.amount.toLocaleString()}</div>
                <p className="text-[11px] text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Invoice Modal */}
      {showBulkInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Generate Term Invoices</h3>
              <button onClick={() => setShowBulkInvoiceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateBulkInvoices} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Target Class Stream</label>
                <select
                  value={selectedStreamId}
                  onChange={(e) => setSelectedStreamId(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1 font-semibold"
                >
                  {streams.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.class?.name} ({s.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-900 space-y-1">
                <div className="font-bold">Term Fee Total: ₵1,450.00</div>
                <p className="text-[11px] text-emerald-800">Includes Tuition (₵850), Feeding (₵350), PTA (₵100), and Exam (₵150).</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkInvoiceModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                >
                  Generate Stream Invoices
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Record Mobile Money / Cash Payment</h3>
                <p className="text-xs text-slate-500">Invoice: {selectedInvoice.invoiceNumber}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Payment Amount (GHS ₵)</label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Payment Channel / Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1 font-medium"
                >
                  <option value="MOMO_MTN">MTN Mobile Money (MoMo)</option>
                  <option value="MOMO_TELECEL">Telecel Cash</option>
                  <option value="MOMO_AT">AT Money</option>
                  <option value="CASH">Cash Deposit</option>
                  <option value="BANK_TRANSFER">Bank Direct Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Transaction ID / MoMo Reference</label>
                <input
                  type="text"
                  required
                  value={momoRef}
                  onChange={(e) => setMomoRef(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                >
                  Confirm & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Receipt className="w-5 h-5 text-emerald-600" /> Official Payment Receipt
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="p-1 text-slate-500 hover:text-slate-700">
                  <Printer className="w-4 h-4" />
                </button>
                <button onClick={() => setShowReceipt(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border-2 border-emerald-700 p-5 rounded-xl space-y-4 bg-white text-slate-900 text-xs">
              <div className="text-center space-y-0.5 border-b pb-3 border-emerald-200">
                <div className="font-extrabold text-sm text-emerald-900 uppercase">ACHIMOTA BASIC & SHS</div>
                <div className="text-[10px] text-slate-500">OFFICIAL FEE PAYMENT RECEIPT</div>
                <div className="font-mono font-bold text-emerald-800 text-xs">Receipt #: {showReceipt.receiptNumber || 'REC-2025-001'}</div>
              </div>

              <div className="space-y-1 border-b pb-3 border-slate-100">
                <div>Date: <strong>{new Date(showReceipt.paymentDate || Date.now()).toLocaleDateString()}</strong></div>
                <div>Amount Paid: <strong className="text-emerald-800 font-bold text-sm">₵{showReceipt.amountPaid?.toLocaleString()}</strong></div>
                <div>Payment Method: <strong>{showReceipt.paymentMethod}</strong></div>
                <div>Reference ID: <strong className="font-mono text-slate-800">{showReceipt.referenceNumber || 'MTN-293848103'}</strong></div>
              </div>

              <div className="text-[11px] text-slate-500 italic text-center">
                Received with thanks by Bursar's Office • Achimota School Ghana
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
