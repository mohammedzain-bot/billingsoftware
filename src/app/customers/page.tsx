'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  IndianRupee,
  Phone,
  Mail,
  MapPin,
  History,
  CreditCard,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, with_balance
  const [totalOutstanding, setTotalOutstanding] = useState(0);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [settleCustomer, setSettleCustomer] = useState<any>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMethod, setSettleMethod] = useState('CASH');
  const [historyCustomer, setHistoryCustomer] = useState<any>(null);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);

  // Add customer form
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let url = `/api/customers?filter=${filter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data.customers);
        setTotalOutstanding(json.data.totalOutstanding);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [filter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setForm({ name: '', phone: '', email: '', address: '', gstin: '' });
        fetchCustomers();
      } else {
        alert(json.message);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSettleCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleCustomer) return;

    try {
      const res = await fetch(`/api/customers/${settleCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settlePaymentAmount: Number(settleAmount),
          paymentMethod: settleMethod,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSettleCustomer(null);
        setSettleAmount('');
        fetchCustomers();
      } else {
        alert(json.message);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleViewHistory = async (cust: any) => {
    setHistoryCustomer(cust);
    try {
      const res = await fetch(`/api/customers/${cust.id}`);
      const json = await res.json();
      if (json.success) {
        setCustomerInvoices(json.data.invoices || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner with Outstanding Credit metric */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-charcoal-900 tracking-tight">
            Customer Credit & Accounts Ledger
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Track customer balances, payment records, and sales history
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-lg text-xs">
            <span className="text-amber-800 font-medium">Total Credit Due: </span>
            <strong className="text-amber-900 font-bold text-sm">
              {formatCurrency(totalOutstanding)}
            </strong>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-charcoal-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by customer name, phone number, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-charcoal-300 rounded-lg text-xs focus:ring-1 focus:ring-brand-600"
          />
        </form>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
              filter === 'all'
                ? 'bg-brand-700 text-white border-brand-700'
                : 'bg-white text-charcoal-700 border-charcoal-300 hover:bg-charcoal-50'
            )}
          >
            All Customers
          </button>
          <button
            type="button"
            onClick={() => setFilter('with_balance')}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
              filter === 'with_balance'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-charcoal-700 border-charcoal-300 hover:bg-charcoal-50'
            )}
          >
            Has Credit Balance
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-charcoal-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-charcoal-50 text-charcoal-600 font-semibold border-b border-charcoal-200">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Email / GSTIN</th>
                <th className="py-3 px-4 text-right">Total Purchases</th>
                <th className="py-3 px-4 text-right">Outstanding Credit</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100 text-charcoal-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-charcoal-400">
                    Loading customer directory...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-charcoal-400">
                    No customers found matching filter.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const hasDue = c.outstandingBalance > 0;
                  return (
                    <tr key={c.id} className="hover:bg-charcoal-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-charcoal-900">{c.name}</div>
                        {c.address && (
                          <div className="text-[11px] text-charcoal-400 truncate max-w-xs">
                            {c.address}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-charcoal-800">
                        +91 {c.phone}
                      </td>
                      <td className="py-3 px-4 text-charcoal-600">
                        {c.email && <div>{c.email}</div>}
                        {c.gstin && (
                          <span className="font-mono text-[10px] bg-charcoal-100 px-1.5 py-0.5 rounded font-semibold text-charcoal-700">
                            GST: {c.gstin}
                          </span>
                        )}
                        {!c.email && !c.gstin && <span className="text-charcoal-400">-</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-charcoal-900">
                        {formatCurrency(c.totalPurchases)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        {hasDue ? (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            {formatCurrency(c.outstandingBalance)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">Clear (₹0.00)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Settle Balance Button */}
                          {hasDue && (
                            <button
                              onClick={() => {
                                setSettleCustomer(c);
                                setSettleAmount(String(c.outstandingBalance));
                              }}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Settle Due</span>
                            </button>
                          )}

                          {/* Purchase History */}
                          <button
                            onClick={() => handleViewHistory(c)}
                            className="p-1.5 text-charcoal-500 hover:text-brand-700 hover:bg-brand-50 rounded"
                            title="View Invoices & Transaction History"
                          >
                            <History className="w-4 h-4" />
                          </button>
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

      {/* ADD CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-charcoal-200">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-3">
              <h3 className="text-sm font-bold text-charcoal-900">
                Register Customer Account
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-charcoal-400 hover:text-charcoal-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Full Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@email.com"
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Customer GSTIN (For B2B Billing)
                </label>
                <input
                  type="text"
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                  placeholder="e.g. 27AACCA2244P1ZU"
                  className="w-full border border-charcoal-300 rounded-lg p-2 font-mono uppercase focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Delivery / Billing Address
                </label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street address, city, state, pincode..."
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-charcoal-300 rounded-lg text-charcoal-700 hover:bg-charcoal-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTLE CREDIT MODAL */}
      {settleCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-charcoal-200">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-3">
              <h3 className="text-sm font-bold text-charcoal-900">
                Record Credit Settlement
              </h3>
              <button
                onClick={() => setSettleCustomer(null)}
                className="text-charcoal-400 hover:text-charcoal-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-charcoal-600 mb-3">
              Customer: <strong className="text-charcoal-900">{settleCustomer.name}</strong>
              <br />
              Outstanding Credit: <strong className="text-red-700">{formatCurrency(settleCustomer.outstandingBalance)}</strong>
            </p>

            <form onSubmit={handleSettleCredit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Settlement Amount Received (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={settleCustomer.outstandingBalance}
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full border border-charcoal-300 rounded-lg p-2 font-bold text-brand-900 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value)}
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / Google Pay / PhonePe</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="BANK_TRANSFER">Bank IMPS / NEFT</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSettleCustomer(null)}
                  className="px-3 py-1.5 border border-charcoal-300 rounded-lg text-charcoal-700 hover:bg-charcoal-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER INVOICES HISTORY MODAL */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-5 border border-charcoal-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-3">
              <div>
                <h3 className="text-sm font-bold text-charcoal-900">
                  Customer Purchase History
                </h3>
                <p className="text-xs text-charcoal-500">
                  {historyCustomer.name} ({historyCustomer.phone})
                </p>
              </div>
              <button
                onClick={() => setHistoryCustomer(null)}
                className="text-charcoal-400 hover:text-charcoal-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-charcoal-50 text-charcoal-600 font-semibold border-b border-charcoal-200">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Grand Total</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100 text-charcoal-700">
                  {customerInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-charcoal-400">
                        No invoices on record for this customer.
                      </td>
                    </tr>
                  ) : (
                    customerInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-2 px-3 font-bold text-charcoal-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-2 px-3 text-charcoal-500">
                          {formatDateTime(inv.createdAt)}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-charcoal-900">
                          {formatCurrency(inv.grandTotal)}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-700 font-semibold">
                          {formatCurrency(inv.paidAmount)}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold">
                          {inv.balanceAmount > 0 ? (
                            <span className="text-red-600 font-bold">
                              {formatCurrency(inv.balanceAmount)}
                            </span>
                          ) : (
                            '₹0.00'
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={cn(
                              'text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase',
                              inv.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-red-50 text-red-800 border-red-200'
                            )}
                          >
                            {inv.status}
                          </span>
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
    </div>
  );
}
