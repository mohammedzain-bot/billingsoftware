'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Receipt,
  Eye,
  RotateCcw,
  Ban,
  Printer,
  CreditCard,
  Download,
  Calendar,
  AlertCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import InvoiceModal from '@/components/pos/InvoiceModal';

export default function InvoicesPage() {
  const { user, business, permissions } = useAuth();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected invoice for detail/print
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [actionModal, setActionModal] = useState<{
    type: 'CANCEL' | 'RETURN' | 'PAYMENT' | null;
    invoice: any;
  }>({ type: null, invoice: null });

  // Action form state
  const [reasonInput, setReasonInput] = useState('');
  const [paymentInput, setPaymentInput] = useState({
    amount: '',
    method: 'CASH',
    ref: '',
  });

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let url = `/api/invoices?status=${status}&paymentStatus=${paymentStatus}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setInvoices(json.data.invoices);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [status, paymentStatus, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  // Perform Cancel or Return or Settle Payment
  const handleExecuteAction = async () => {
    if (!actionModal.invoice || !actionModal.type) return;

    try {
      let payload: any = { action: actionModal.type };
      if (actionModal.type === 'CANCEL') {
        payload.reason = reasonInput || 'Customer cancellation';
      } else if (actionModal.type === 'RETURN') {
        payload.returnReason = reasonInput || 'Defective/Exchange return';
      } else if (actionModal.type === 'PAYMENT') {
        payload.paymentAmount = Number(paymentInput.amount);
        payload.paymentMethod = paymentInput.method;
        payload.referenceNumber = paymentInput.ref;
      }

      const res = await fetch(`/api/invoices/${actionModal.invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setActionModal({ type: null, invoice: null });
        setReasonInput('');
        setPaymentInput({ amount: '', method: 'CASH', ref: '' });
        fetchInvoices();
      } else {
        alert(json.message || 'Action failed');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const rows = invoices.map((i) => ({
      'Invoice Number': i.invoiceNumber,
      Date: formatDateTime(i.createdAt),
      Customer: i.customerName,
      Phone: i.customerPhone || '-',
      Subtotal: i.subtotal,
      'GST Tax': i.taxAmount,
      Discount: i.discountAmount,
      'Grand Total': i.grandTotal,
      'Paid Amount': i.paidAmount,
      'Balance Owed': i.balanceAmount,
      'Payment Method': i.paymentMethod,
      'Payment Status': i.paymentStatus,
      'Invoice Status': i.status,
      Notes: i.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
    XLSX.writeFile(workbook, `Invoices_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-charcoal-900 tracking-tight">
            Invoices & Sales Transactions
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Audit, reprint, cancel, process returns, or record balance settlements
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-charcoal-300 hover:bg-charcoal-50 text-charcoal-700 rounded-lg text-xs font-semibold shadow-xs transition-colors self-start"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-charcoal-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="sm:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search invoice number, customer name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-charcoal-300 rounded-lg text-xs focus:ring-1 focus:ring-brand-600"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full py-2 px-2.5 border border-charcoal-300 rounded-lg text-xs text-charcoal-700 focus:ring-1 focus:ring-brand-600"
            >
              <option value="ALL">All Invoice Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="RETURNED">Returned</option>
            </select>
          </div>

          {/* Payment status filter */}
          <div>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full py-2 px-2.5 border border-charcoal-300 rounded-lg text-xs text-charcoal-700 focus:ring-1 focus:ring-brand-600"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">Paid in Full</option>
              <option value="PARTIAL">Partially Paid</option>
              <option value="UNPAID">Unpaid / Credit</option>
            </select>
          </div>
        </form>

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-charcoal-100 text-xs">
          <span className="font-semibold text-charcoal-600">Date Range:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-charcoal-300 rounded px-2 py-1 text-xs"
          />
          <span className="text-charcoal-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-charcoal-300 rounded px-2 py-1 text-xs"
          />
          {(startDate || endDate || search || status !== 'ALL' || paymentStatus !== 'ALL') && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearch('');
                setStatus('ALL');
                setPaymentStatus('ALL');
              }}
              className="text-xs text-brand-700 hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-charcoal-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-charcoal-50 text-charcoal-600 font-semibold border-b border-charcoal-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100 text-charcoal-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-charcoal-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-charcoal-400">
                    No matching invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const statusColors: Record<string, string> = {
                    COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    CANCELLED: 'bg-red-50 text-red-800 border-red-200',
                    RETURNED: 'bg-amber-50 text-amber-800 border-amber-200',
                  };

                  const paymentColors: Record<string, string> = {
                    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    PARTIAL: 'bg-amber-50 text-amber-700 border-amber-200',
                    UNPAID: 'bg-red-50 text-red-700 border-red-200',
                  };

                  return (
                    <tr key={inv.id} className="hover:bg-charcoal-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-charcoal-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-charcoal-800">
                          {inv.customerName}
                        </div>
                        {inv.customerPhone && (
                          <div className="text-[11px] text-charcoal-400">
                            {inv.customerPhone}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-charcoal-900">
                        {formatCurrency(inv.grandTotal)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-semibold">
                        {formatCurrency(inv.paidAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {inv.balanceAmount > 0 ? (
                          <span className="text-red-600 font-bold">
                            {formatCurrency(inv.balanceAmount)}
                          </span>
                        ) : (
                          <span className="text-charcoal-400">₹0.00</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase',
                            paymentColors[inv.paymentStatus]
                          )}
                        >
                          {inv.paymentStatus} ({inv.paymentMethod})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase',
                            statusColors[inv.status]
                          )}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-charcoal-500 whitespace-nowrap">
                        {formatDateTime(inv.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View & Print button */}
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 text-charcoal-600 hover:text-brand-700 hover:bg-brand-50 rounded"
                            title="View / Print Tax Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Settle partial balance */}
                          {inv.balanceAmount > 0 && inv.status === 'COMPLETED' && (
                            <button
                              onClick={() => {
                                setPaymentInput({
                                  amount: String(inv.balanceAmount),
                                  method: 'CASH',
                                  ref: '',
                                });
                                setActionModal({ type: 'PAYMENT', invoice: inv });
                              }}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Record Balance Payment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}

                          {/* Process Return (Manager/Owner) */}
                          {permissions?.canRefundInvoice && inv.status === 'COMPLETED' && (
                            <button
                              onClick={() => setActionModal({ type: 'RETURN', invoice: inv })}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                              title="Process Customer Return"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          {/* Cancel Invoice (Manager/Owner) */}
                          {permissions?.canCancelInvoice && inv.status === 'COMPLETED' && (
                            <button
                              onClick={() => setActionModal({ type: 'CANCEL', invoice: inv })}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                              title="Cancel Invoice & Restock"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACTION DIALOG: CANCEL / RETURN / RECORD PAYMENT */}
      {actionModal.type && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-charcoal-200">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-3">
              <h3 className="text-sm font-bold text-charcoal-900">
                {actionModal.type === 'CANCEL' && 'Cancel Invoice & Restore Stock'}
                {actionModal.type === 'RETURN' && 'Process Product Return & Restock'}
                {actionModal.type === 'PAYMENT' && 'Record Balance Settlement'}
              </h3>
              <button
                onClick={() => setActionModal({ type: null, invoice: null })}
                className="text-charcoal-400 hover:text-charcoal-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-charcoal-600 mb-3 space-y-1">
              <div>
                Invoice Number:{' '}
                <strong className="text-charcoal-900">{actionModal.invoice?.invoiceNumber}</strong>
              </div>
              <div>
                Customer:{' '}
                <strong className="text-charcoal-900">{actionModal.invoice?.customerName}</strong>
              </div>
              <div>
                Total Amount:{' '}
                <strong className="text-charcoal-900">
                  {formatCurrency(actionModal.invoice?.grandTotal)}
                </strong>
              </div>
            </div>

            {actionModal.type === 'CANCEL' && (
              <div className="space-y-3 text-xs">
                <p className="text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200">
                  Warning: Cancelling will mark this bill as cancelled and return all sold item quantities back into active inventory stock.
                </p>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Reason for Cancellation *
                  </label>
                  <textarea
                    rows={2}
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    placeholder="e.g. Mistake in quantity, customer cancelled order"
                    className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                  />
                </div>
              </div>
            )}

            {actionModal.type === 'RETURN' && (
              <div className="space-y-3 text-xs">
                <p className="text-charcoal-600 bg-charcoal-50 p-2.5 rounded border border-charcoal-200">
                  Returned products will be restocked automatically with an audit trail entry.
                </p>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Return / Exchange Reason *
                  </label>
                  <textarea
                    rows={2}
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    placeholder="e.g. Size exchange requested, defective seal on product"
                    className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                  />
                </div>
              </div>
            )}

            {actionModal.type === 'PAYMENT' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Settlement Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={actionModal.invoice?.balanceAmount}
                    value={paymentInput.amount}
                    onChange={(e) =>
                      setPaymentInput({ ...paymentInput, amount: e.target.value })
                    }
                    className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600 font-bold"
                  />
                  <span className="text-[11px] text-charcoal-500">
                    Max outstanding: {formatCurrency(actionModal.invoice?.balanceAmount)}
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentInput.method}
                    onChange={(e) =>
                      setPaymentInput({ ...paymentInput, method: e.target.value })
                    }
                    className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer / IMPS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Transaction / Cheque Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentInput.ref}
                    onChange={(e) =>
                      setPaymentInput({ ...paymentInput, ref: e.target.value })
                    }
                    placeholder="e.g. UPI Ref # or receipt memo"
                    className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                  />
                </div>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-charcoal-100 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setActionModal({ type: null, invoice: null })}
                className="px-3 py-1.5 border border-charcoal-300 rounded-lg text-charcoal-700 hover:bg-charcoal-50 font-medium"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                className={cn(
                  'px-4 py-1.5 text-white rounded-lg font-semibold',
                  actionModal.type === 'CANCEL'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-brand-700 hover:bg-brand-800'
                )}
              >
                Confirm {actionModal.type}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL INVOICE VIEW & PRINT MODAL */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          business={business}
          onClose={() => setSelectedInvoice(null)}
          onNewSale={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
