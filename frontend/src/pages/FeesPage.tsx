import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { CreditCard, Plus, CheckCircle2, Download, Printer, ArrowUpRight, Search, FileText, Phone, Building2 } from 'lucide-react';

export const FeesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Form payment
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('MOMO_MTN');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');

  const { data: invoicesData, refetch } = useQuery({
    queryKey: ['invoicesList', searchTerm],
    queryFn: async () => (await api.get('/fees/invoices', { params: { search: searchTerm } })).data,
  });

  const invoices = invoicesData?.invoices || [];

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      await api.post('/fees/payments', {
        invoiceId: selectedInvoice.id,
        amountPaid: parseFloat(paymentAmount),
        paymentMethod,
        referenceNumber: refNumber || `MOMO-${Date.now().toString().slice(-6)}`,
        notes,
      });

      alert('Payment recorded successfully!');
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Payment failed');
    }
  };

  const handlePrintReceipt = (invoice: any) => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;

    const payment = invoice.payments?.[0] || {
      receiptNumber: 'REC-2025-001',
      amountPaid: invoice.amountPaid,
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
            .header { text-align: center; border-b: 2px solid #0284c7; padding-bottom: 15px; }
            .motto { font-size: 11px; color: #64748b; font-style: italic; }
            .badge { background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; font-size: 13px; }
            .amount-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #0f172a; }
            .footer { text-align: center; font-size: 11px; color: #94a3b8; border-t: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0; color:#0f172a;">KINGS & QUEENS PREPARATORY SCHOOL</h2>
            <div class="motto">Excellence, Royalty & Moral Leadership (KG 1 - Basic 9)</div>
            <div style="font-size:12px; margin-top:5px;">OFFICIAL MOBILE MONEY FEE RECEIPT</div>
          </div>

          <div class="grid">
            <div>
              <strong>Receipt No:</strong> ${payment.receiptNumber}<br>
              <strong>Date:</strong> ${new Date(payment.paymentDate).toLocaleDateString()}<br>
              <strong>Student:</strong> ${invoice.student?.user?.fullName}<br>
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
            East Legon Hills, Accra, Ghana | +233 24 123 4567 | info@kqprep.edu.gh
          </div>
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Fees & Mobile Money Collections (GHS ₵)</h2>
          <p className="text-xs text-slate-500">Manage term tuition levies, bulk stream invoicing, and instant MoMo payment receipts</p>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoices by pupil name or Index ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="p-3">Invoice No</th>
                <th className="p-3">Pupil Name</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Amount Paid</th>
                <th className="p-3">Balance Due</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-bold text-slate-900">{inv.invoiceNumber}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{inv.student?.user?.fullName}</div>
                    <div className="text-[10px] text-slate-400">{inv.student?.studentId}</div>
                  </td>
                  <td className="p-3 font-semibold text-slate-900">GHS ₵{inv.totalAmount.toFixed(2)}</td>
                  <td className="p-3 font-semibold text-emerald-700">GHS ₵{inv.amountPaid.toFixed(2)}</td>
                  <td className="p-3 font-bold text-rose-600">GHS ₵{inv.balance.toFixed(2)}</td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'PARTIAL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {inv.balance > 0 && (
                      <button
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setPaymentAmount(inv.balance.toString());
                          setShowPaymentModal(true);
                        }}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold"
                      >
                        Record MoMo Payment
                      </button>
                    )}
                    <button
                      onClick={() => handlePrintReceipt(inv)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 inline-flex"
                    >
                      <Printer className="w-3.5 h-3.5" /> Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Record Mobile Money Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <div><strong>Pupil:</strong> {selectedInvoice.student?.user?.fullName} ({selectedInvoice.student?.studentId})</div>
                <div><strong>Invoice Balance:</strong> GHS ₵{selectedInvoice.balance.toFixed(2)}</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Amount Paid (GHS ₵)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Payment Channel</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1 font-semibold"
                >
                  <option value="MOMO_MTN">MTN Mobile Money (*170#)</option>
                  <option value="MOMO_TELECEL">Telecel Cash (*110#)</option>
                  <option value="MOMO_AT">AT Money (*110#)</option>
                  <option value="CASH">Cash Deposit at Bursar Office</option>
                  <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">MoMo Ref / Transaction ID</label>
                <input
                  type="text"
                  placeholder="e.g. MTN-998811002"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg mt-1"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
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
