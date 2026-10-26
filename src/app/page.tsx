'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IndianRupee,
  TrendingUp,
  Package,
  AlertTriangle,
  Receipt,
  ShoppingCart,
  Calendar,
  CreditCard,
  ArrowUpRight,
  ChevronRight,
  Clock,
  Filter,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { permissions } = useAuth();
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'last7days' | 'thismonth' | 'custom'>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      let url = `/api/dashboard?period=${period}`;
      if (period === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [period, customStart, customEnd]);

  const summary = data?.summaryCards || {
    todaySales: 0,
    todayProfit: 0,
    totalProducts: 0,
    outstandingPayments: 0,
  };

  const filtered = data?.filteredMetrics || {
    revenue: 0,
    grossProfit: 0,
    netProfit: 0,
    expenses: 0,
    ordersCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-charcoal-900 tracking-tight">
            Store Performance Overview
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Real-time sales, profitability, and inventory health metrics
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-lg border border-charcoal-200 shadow-sm text-xs">
          <button
            onClick={() => setPeriod('today')}
            className={cn(
              'px-2.5 py-1 rounded-md font-medium transition-colors',
              period === 'today'
                ? 'bg-brand-700 text-white shadow-xs'
                : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-50'
            )}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('yesterday')}
            className={cn(
              'px-2.5 py-1 rounded-md font-medium transition-colors',
              period === 'yesterday'
                ? 'bg-brand-700 text-white shadow-xs'
                : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-50'
            )}
          >
            Yesterday
          </button>
          <button
            onClick={() => setPeriod('last7days')}
            className={cn(
              'px-2.5 py-1 rounded-md font-medium transition-colors',
              period === 'last7days'
                ? 'bg-brand-700 text-white shadow-xs'
                : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-50'
            )}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setPeriod('thismonth')}
            className={cn(
              'px-2.5 py-1 rounded-md font-medium transition-colors',
              period === 'thismonth'
                ? 'bg-brand-700 text-white shadow-xs'
                : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-50'
            )}
          >
            This Month
          </button>
          <button
            onClick={() => setPeriod('custom')}
            className={cn(
              'px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1',
              period === 'custom'
                ? 'bg-brand-700 text-white shadow-xs'
                : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-50'
            )}
          >
            <Calendar className="w-3 h-3" />
            <span>Custom</span>
          </button>
        </div>
      </div>

      {/* Custom Date Pickers */}
      {period === 'custom' && (
        <div className="bg-white p-3 rounded-lg border border-charcoal-200 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-charcoal-600 font-medium">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="border border-charcoal-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-brand-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-charcoal-600 font-medium">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="border border-charcoal-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-brand-600"
            />
          </div>
        </div>
      )}

      {/* 4 PRIMARY SUMMARY CARDS (Required by spec) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Sales */}
        <div className="bg-white p-5 rounded-xl border border-charcoal-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
              Today's Sales
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-700">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-charcoal-900 tracking-tight">
              {formatCurrency(summary.todaySales)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-charcoal-500">
              <span className="font-semibold text-brand-700">
                {summary.todayOrdersCount || 0} completed orders
              </span>
              <span>today</span>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Profit */}
        <div className="bg-white p-5 rounded-xl border border-charcoal-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
              Today's Profit
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700 tracking-tight">
              {formatCurrency(summary.todayProfit)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-charcoal-500">
              <span>Gross Margin:</span>
              <span className="font-semibold text-charcoal-800">
                {summary.todaySales > 0
                  ? `${Math.round((summary.todayProfit / summary.todaySales) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Products */}
        <div className="bg-white p-5 rounded-xl border border-charcoal-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
              Total Products
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-charcoal-900 tracking-tight">
              {summary.totalProducts}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-charcoal-500">
              <span>Active SKUs in catalog</span>
            </div>
          </div>
        </div>

        {/* Card 4: Outstanding Payments */}
        <div className="bg-white p-5 rounded-xl border border-charcoal-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
              Outstanding Payments
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-700 tracking-tight">
              {formatCurrency(summary.outstandingPayments)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-charcoal-500">
              <Link href="/customers" className="hover:underline text-amber-800 font-medium">
                View customer credit ledger →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filtered Range Indicator Banner if not 'today' */}
      {period !== 'today' && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="font-semibold text-brand-900 uppercase tracking-wider text-[11px]">
              Filtered Period Performance ({period}):
            </span>
            <div className="text-charcoal-700 mt-0.5">
              Revenue: <strong className="text-charcoal-900">{formatCurrency(filtered.revenue)}</strong> • Gross Profit: <strong className="text-emerald-800">{formatCurrency(filtered.grossProfit)}</strong> • Operating Expenses: <strong className="text-red-700">{formatCurrency(filtered.expenses)}</strong> • Net Profit: <strong className="text-charcoal-900">{formatCurrency(filtered.netProfit)}</strong>
            </div>
          </div>
          {permissions?.canAccessReports && (
            <Link
              href="/reports"
              className="px-3 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded font-medium shadow-xs"
            >
              Full Profit & Loss Breakdown →
            </Link>
          )}
        </div>
      )}

      {/* Chart & Payment Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance Chart (2 Columns) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-charcoal-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-charcoal-900">
                Sales & Profit Trend (Last 7 Days)
              </h2>
              <p className="text-xs text-charcoal-500">
                Daily actual gross turnover vs net profit generated
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-600 inline-block" />
                <span className="text-charcoal-600 font-medium">Sales Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                <span className="text-charcoal-600 font-medium">Gross Profit</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            {data?.chartData && data.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#15803d" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      formatCurrency(Number(value)),
                      name === 'sales' ? 'Revenue' : 'Profit',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#15803d"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#34d399"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-charcoal-400">
                No trend data available for period
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Summary (1 Column) */}
        <div className="bg-white p-5 rounded-xl border border-charcoal-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-charcoal-900">
                Payment Breakdown
              </h2>
              <CreditCard className="w-4 h-4 text-charcoal-400" />
            </div>
            <p className="text-xs text-charcoal-500 mb-4">
              Recorded settlement channels in active period
            </p>

            <div className="space-y-3">
              {data?.paymentMethodSummary &&
                Object.entries(data.paymentMethodSummary).map(([method, item]: [string, any]) => {
                  const totalRev = filtered.revenue || 1;
                  const percent = Math.min(100, Math.round((item.total / totalRev) * 100));

                  return (
                    <div key={method} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-charcoal-700 capitalize">
                          {method.toLowerCase().replace('_', ' ')} ({item.count})
                        </span>
                        <span className="font-semibold text-charcoal-900">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-charcoal-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-700 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-charcoal-100 flex items-center justify-between text-xs text-charcoal-500">
            <span>Manual payment records only</span>
            <span className="font-semibold text-charcoal-800">
              Total: {formatCurrency(filtered.revenue)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Transactions & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Table (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-charcoal-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-charcoal-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-charcoal-900">
                Recent Transactions
              </h2>
              <p className="text-xs text-charcoal-500">
                Latest customer bills and payment statuses
              </p>
            </div>
            <Link
              href="/invoices"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-charcoal-50 text-charcoal-600 font-semibold border-b border-charcoal-200">
                <tr>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100 text-charcoal-700">
                {data?.recentTransactions && data.recentTransactions.length > 0 ? (
                  data.recentTransactions.map((tx: any) => {
                    const statusColors: Record<string, string> = {
                      COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                      CANCELLED: 'bg-red-50 text-red-800 border-red-200',
                      RETURNED: 'bg-amber-50 text-amber-800 border-amber-200',
                    };

                    return (
                      <tr key={tx.id} className="hover:bg-charcoal-50/60 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-charcoal-900">
                          <Link href={`/invoices?search=${tx.invoiceNumber}`} className="hover:underline text-brand-700">
                            {tx.invoiceNumber}
                          </Link>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-charcoal-800">
                          {tx.customerName}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-charcoal-900">
                          {formatCurrency(tx.grandTotal)}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-[11px] font-medium uppercase px-2 py-0.5 rounded bg-charcoal-100 text-charcoal-700">
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full border tracking-wide uppercase',
                              statusColors[tx.status] || 'bg-charcoal-100 text-charcoal-700'
                            )}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-charcoal-500 whitespace-nowrap">
                          {formatDateTime(tx.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-charcoal-400">
                      No invoices recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low-Stock Alerts Card (1 Column) */}
        <div className="bg-white rounded-xl border border-charcoal-200 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="p-4 sm:p-5 border-b border-charcoal-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-charcoal-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Low-Stock Alerts</span>
                </h2>
                <p className="text-xs text-charcoal-500">
                  Products requiring urgent reorder
                </p>
              </div>
              <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                {data?.lowStockAlerts?.length || 0}
              </span>
            </div>

            <div className="p-4 divide-y divide-charcoal-100 space-y-3">
              {data?.lowStockAlerts && data.lowStockAlerts.length > 0 ? (
                data.lowStockAlerts.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-semibold text-charcoal-800 line-clamp-1">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-charcoal-500">
                        SKU: {item.sku} • Min alert: {item.minStockAlert} {item.unit}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded font-bold bg-red-50 text-red-700 border border-red-200">
                        {item.stock} left
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-charcoal-400">
                  All inventory stocks are healthy!
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-charcoal-50 border-t border-charcoal-100">
            <Link
              href="/purchases"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-charcoal-300 hover:border-charcoal-400 rounded-lg text-xs font-semibold text-charcoal-800 shadow-xs transition-colors"
            >
              <span>Create Supplier Purchase Order</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
