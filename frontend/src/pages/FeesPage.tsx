import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { CreditCard, DollarSign, AlertTriangle, CheckCircle2, Receipt, PhoneCall, Plus, X } from 'lucide-react';

export const FeesPage: React.FC = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('450');
  const [paymentMethod, setPaymentMethod] = useState('MOMO_MTN');
  const [momoRef, setMomoRef] = useState('MTN-99881100');

  const { data: feeSummary } = useQuery({
    queryKey: ['feeSummaryPage'],
    queryFn: async () => (await api.get('/fees/summary')).data,
  });

  const { data: invoicesData, refetch } = useQuery({
    queryKey: ['feeInvoices'],
    queryFn: async () => (await api.get('/fees/invoices')).data,
  });

  const { data: defaultersData } = useQuery({
    queryKey: ['feeDefaulters'],
    queryFn: async () => (await api.get('/fees/defaulters')).data,
  });

  const invoices = invoicesData?.invoices || [];
  const defaulters = defaultersData?.defaulters || [];

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await api.post('/fees/payments', {
        invoiceId: selectedInvoice.id,
        amountPaid: Number(paymentAmount),
        paymentMethod,
        referenceNumber: momoRef,
        notes: 'Paid via Mobile Money portal',
      });
      setSelectedInvoice(null);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record payment');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Fees, Invoicing & Mobile Money Payments (GHS ₵)</h2>
          <p className="text-xs text-slate-500">Track tuition, feeding & PTA levies, record MTN MoMo/Telecel payments and view defaulters</p>
        </div>
      </div>

      {/* Financial Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Total Billed (Term 1)</div>
          <div className="text-2xl font-extrabold text-slate-900">₵{(feeSummary?.totalBilled || 1450).toLocaleString()}</div>
          <p className="text-[10px] text-slate-400">Total expected school fees in GHS</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1 border-l-4 border-l-emerald-600">
          <div className="text-xs font-semibold text-slate-500">Total Collected</div>
          <div className="text-2xl font-extrabold text-emerald-800">₵{(feeSummary?.totalCollected || 1000).toLocaleString()}</div>
          <p className="text-[10px] text-emerald-700 font-medium">{feeSummary?.collectionRate || 69}% collection efficiency</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1 border-l-4 border-l-rose-600">
          <div className="text-xs font-semibold text-slate-500">Outstanding Balance</div>
          <div className="text-2xl font-extrabold text-rose-700">₵{(feeSummary?.totalOutstanding || 450).toLocaleString()}</div>
          <p className="text-[10px] text-rose-600 font-medium">Fee defaulters balance</p>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="font-bold text-slate-800 text-xs">Term 1 Student Invoices</span>
          <span className="text-xs text-slate-500">GHS ₵ Currency</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase">
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Total Billed</th>
                <th className="p-3.5">Paid</th>
                <th className="p-3.5">Balance</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
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
                  <td className="p-3.5 text-right">
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
                      <span className="text-emerald-700 font-bold text-xs flex items-center justify-end gap-1">
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

      {/* Record Payment Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Record Ghana Mobile Money / Cash Payment</h3>
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

    </div>
  );
};
