'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  Plus,
  Trash2,
  Filter,
  Calendar,
  IndianRupee,
  X,
  FileSpreadsheet,
  PieChart,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const EXPENSE_CATEGORIES = [
  'Rent', 'Electricity', 'Water & Utilities', 'Salaries', 'Stationery',
  'Marketing', 'Maintenance', 'Packaging', 'Transport', 'Internet',
  'Insurance', 'Miscellaneous'
];

export default function ExpensesPage() {
  const { user, permissions } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({});
  const [totalExpense, setTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    category: 'Rent',
    description: '',
    amount: '',
    paymentMethod: 'CASH',
    date: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let url = `/api/expenses?category=${categoryFilter}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setExpenses(json.data.expenses);
        setTotalExpense(json.data.totalExpense);
        setCategoryTotals(json.data.categoryTotals);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter, startDate, endDate]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowAdd(false);
        setForm({
          category: 'Rent',
          description: '',
          amount: '',
          paymentMethod: 'CASH',
          date: new Date().toISOString().split('T')[0],
        });
        fetchExpenses();
      } else {
        alert(json.message);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string, desc: string) => {
    if (!confirm(`Delete expense: "${desc}"?`)) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) fetchExpenses();
      else alert(json.message);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportExcel = () => {
    const rows = expenses.map((e) => ({
      Date: formatDate(e.date),
      Category: e.category,
      Description: e.description,
      Amount: e.amount,
      'Payment Method': e.paymentMethod,
      'Recorded By': e.createdByName || '-',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    XLSX.writeFile(wb, `Expenses_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-charcoal-900 tracking-tight">
            Operating Expense Tracker
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Log rent, utilities, salaries, and all business operating costs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-charcoal-300 hover:bg-charcoal-50 text-charcoal-700 rounded-lg text-xs font-semibold shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Export</span>
          </button>
          {(user?.role === 'OWNER' || user?.role === 'MANAGER') && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Top-level summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-charcoal-200 shadow-xs">
          <div className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-1">
            Total Expenses (Filtered)
          </div>
          <div className="text-2xl font-bold text-red-700">{formatCurrency(totalExpense)}</div>
          <div className="text-xs text-charcoal-500 mt-1">{expenses.length} expense entries</div>
        </div>

        {topCategories.slice(0, 2).map(([cat, amt]) => (
          <div key={cat} className="bg-white p-4 rounded-xl border border-charcoal-200 shadow-xs">
            <div className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-1">
              {cat}
            </div>
            <div className="text-2xl font-bold text-charcoal-800">{formatCurrency(amt)}</div>
            <div className="text-xs text-charcoal-500 mt-1">
              {totalExpense > 0 ? `${Math.round((amt / totalExpense) * 100)}% of total` : '-'}
            </div>
          </div>
        ))}
      </div>

      {/* Category Breakdown Bar */}
      {topCategories.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-charcoal-200 shadow-xs">
          <h2 className="text-sm font-bold text-charcoal-900 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-brand-700" />
            Expense Category Breakdown
          </h2>
          <div className="space-y-3">
            {topCategories.map(([cat, amt]) => (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-charcoal-700">{cat}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-charcoal-900">{formatCurrency(amt)}</span>
                    <span className="text-charcoal-400 w-10 text-right">
                      {totalExpense > 0 ? `${Math.round((amt / totalExpense) * 100)}%` : '0%'}
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full bg-charcoal-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full"
                    style={{ width: totalExpense > 0 ? `${(amt / totalExpense) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-charcoal-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-charcoal-300 rounded-lg py-2 px-2.5 focus:ring-1 focus:ring-brand-600"
          >
            <option value="ALL">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-charcoal-500 font-medium">From:</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="border border-charcoal-300 rounded px-2 py-1.5" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-charcoal-500 font-medium">To:</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="border border-charcoal-300 rounded px-2 py-1.5" />
        </div>
        {(startDate || endDate || categoryFilter !== 'ALL') && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); setCategoryFilter('ALL'); }}
            className="text-brand-700 hover:underline font-medium"
          >
            Reset
          </button>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-charcoal-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-charcoal-50 text-charcoal-600 font-semibold border-b border-charcoal-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Recorded By</th>
                {(user?.role === 'OWNER' || user?.role === 'MANAGER') && (
                  <th className="py-3 px-4 text-right">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100 text-charcoal-700">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-charcoal-400">Loading expenses...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-charcoal-400">No expense records in selected period.</td></tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-charcoal-50/70 transition-colors">
                    <td className="py-3 px-4 text-charcoal-600 whitespace-nowrap">{formatDate(exp.date)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-charcoal-100 rounded text-[11px] font-semibold text-charcoal-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-charcoal-800 max-w-xs">{exp.description}</td>
                    <td className="py-3 px-4 text-right font-bold text-red-700">{formatCurrency(exp.amount)}</td>
                    <td className="py-3 px-4 text-charcoal-600 uppercase text-[11px] font-medium">
                      {exp.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-charcoal-500">{exp.createdByName || 'System'}</td>
                    {(user?.role === 'OWNER' || user?.role === 'MANAGER') && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp.id, exp.description)}
                          className="p-1.5 text-charcoal-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-charcoal-200">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-3">
              <h3 className="text-sm font-bold text-charcoal-900">Record Business Expense</h3>
              <button onClick={() => setShowAdd(false)} className="text-charcoal-400 hover:text-charcoal-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Expense Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the expense in detail..."
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="1"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="e.g. 35000.00"
                    className="w-full border border-charcoal-300 rounded-lg p-2 font-bold focus:ring-1 focus:ring-brand-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Payment Mode</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / Google Pay</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="px-3 py-1.5 border border-charcoal-300 rounded-lg text-charcoal-700 hover:bg-charcoal-50 font-medium">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
