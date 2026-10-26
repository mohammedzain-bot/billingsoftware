'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  FileSpreadsheet,
  Download,
  Calendar,
  IndianRupee,
  RotateCcw,
  Receipt,
  ChevronRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

type ReportType = 'PROFIT_LOSS' | 'PRODUCT_SALES' | 'INVENTORY' | 'CUSTOMER_LEDGER' | 'GST' | 'REFUNDS';

export default function ReportsPage() {
  const { user, permissions } = useAuth();

  const [reportType, setReportType] = useState<ReportType>('PROFIT_LOSS');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = `/api/reports?type=${reportType}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, startDate, endDate]);

  const handleExportExcel = () => {
    if (!data) return;

    let rows: any[] = [];
    let sheetName = reportType;

    if (reportType === 'PROFIT_LOSS' && data.summary) {
      rows = Object.entries(data.summary).map(([key, val]) => ({
        Metric: key.replace(/([A-Z])/g, ' $1').trim(),
        Value: typeof val === 'number' ? Number(val.toFixed(2)) : val,
      }));
    } else if (reportType === 'PRODUCT_SALES' && data.products) {
      rows = data.products.map((p: any) => ({
        Product: p.productName,
        SKU: p.sku,
        'Units Sold': p.unitsSold,
        Revenue: p.revenue.toFixed(2),
        COGS: p.cost.toFixed(2),
        Profit: p.profit.toFixed(2),
        'Margin %': p.marginPercent,
      }));
    } else if (reportType === 'INVENTORY' && data.items) {
      rows = data.items.map((i: any) => ({
        Product: i.name,
        SKU: i.sku,
        Category: i.category,
        Stock: i.stock,
        Unit: i.unit,
        'Purchase Cost': i.purchaseCost,
        'Selling Price': i.sellingPrice,
        'Cost Valuation': i.costValuation.toFixed(2),
        'Retail Valuation': i.retailValuation.toFixed(2),
        Status: i.status,
      }));
    } else if (reportType === 'CUSTOMER_LEDGER' && data.customers) {
      rows = data.customers.map((c: any) => ({
        Name: c.name,
        Phone: c.phone,
        Email: c.email || '-',
        'Total Billed': c.totalBilled.toFixed(2),
        'Total Paid': c.totalPaid.toFixed(2),
        'Outstanding Balance': c.outstandingBalance.toFixed(2),
        'Invoice Count': c.invoicesCount,
      }));
    } else if (reportType === 'GST' && data.slabs) {
      rows = data.slabs.map((s: any) => ({
        'GST Rate': `${s.taxRate}%`,
        'Taxable Value': s.taxableValue.toFixed(2),
        'CGST': s.cgst.toFixed(2),
        'SGST': s.sgst.toFixed(2),
        'Total GST': s.totalTax.toFixed(2),
      }));
    } else if (reportType === 'REFUNDS' && data.invoices) {
      rows = data.invoices.map((i: any) => ({
        Invoice: i.invoiceNumber,
        Customer: i.customerName,
        'Grand Total': i.grandTotal.toFixed(2),
        Status: i.status,
        Reason: i.returnReason || i.notes || '-',
        Date: formatDate(i.updatedAt || i.createdAt),
      }));
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `Report_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const reportTypes = [
    { id: 'PROFIT_LOSS', label: 'Profit & Loss', icon: TrendingUp },
    { id: 'PRODUCT_SALES', label: 'Product Sales', icon: BarChart3 },
    { id: 'INVENTORY', label: 'Inventory Value', icon: Package },
    { id: 'CUSTOMER_LEDGER', label: 'Customer Ledger', icon: Users },
    { id: 'GST', label: 'GST Summary', icon: Receipt },
    { id: 'REFUNDS', label: 'Refunds & Cancels', icon: RotateCcw },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-charcoal-900 tracking-tight">
            Business Reports & Analytics
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Comprehensive financial and operational insights derived from actual transaction data
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={!data || loading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-charcoal-300 hover:bg-charcoal-50 text-charcoal-700 rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
          <span>Export to Excel</span>
        </button>
      </div>

      {/* Report Type Tabs & Date Range */}
      <div className="bg-white p-4 rounded-xl border border-charcoal-200 shadow-xs space-y-4">
        <div className="flex flex-wrap gap-2">
          {reportTypes.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                onClick={() => setReportType(r.id as ReportType)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  reportType === r.id
                    ? 'bg-brand-700 text-white border-brand-700 shadow-xs'
                    : 'bg-white text-charcoal-700 border-charcoal-300 hover:bg-charcoal-50'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {r.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-charcoal-100 text-xs">
          <span className="font-semibold text-charcoal-600">Date Range:</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="border border-charcoal-300 rounded px-2 py-1.5" />
          <span className="text-charcoal-400">to</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="border border-charcoal-300 rounded px-2 py-1.5" />
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="text-brand-700 hover:underline font-medium"
            >
              All Time
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white p-8 rounded-xl border border-charcoal-200 text-center text-sm text-charcoal-500">
          Generating report...
        </div>
      )}

      {/* ========== PROFIT & LOSS REPORT ========== */}
      {!loading && data && reportType === 'PROFIT_LOSS' && data.summary && (
        <div className="space-y-4">
          {/* Methodology note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800">
            <strong>Calculation Methodology:</strong> Net Sales = Gross Sales − Tax Collected. COGS = Σ(Item Qty × Historical Purchase Cost at time of sale). Gross Profit = Net Sales − COGS. Net Profit = Gross Profit − Operating Expenses.
            <br /><em>Tax collected is a liability to the government, not recognized as business revenue.</em>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Gross Sales Revenue', value: data.summary.grossSales, color: 'text-charcoal-900', bg: 'bg-white' },
              { label: 'Net Sales (ex-Tax)', value: data.summary.netSales, color: 'text-charcoal-800', bg: 'bg-white' },
              { label: 'Gross Profit', value: data.summary.grossProfit, color: 'text-emerald-700', bg: 'bg-emerald-50' },
              { label: 'Estimated Net Profit', value: data.summary.netProfit, color: data.summary.netProfit >= 0 ? 'text-brand-800' : 'text-red-700', bg: data.summary.netProfit >= 0 ? 'bg-brand-50' : 'bg-red-50' },
            ].map((card) => (
              <div key={card.label} className={cn('p-5 rounded-xl border border-charcoal-200 shadow-xs', card.bg)}>
                <div className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-1">{card.label}</div>
                <div className={cn('text-2xl font-bold', card.color)}>{formatCurrency(card.value)}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-charcoal-200 shadow-xs p-5">
              <h3 className="text-sm font-bold text-charcoal-900 mb-4">P&L Statement</h3>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-charcoal-100">
                  {[
                    ['Gross Sales Revenue', data.summary.grossSales, ''],
                    ['(−) Tax Collected (GST Liability)', data.summary.taxCollected, 'text-red-600'],
                    ['(−) Discounts Given', data.summary.discountsGiven, 'text-red-600'],
                    ['= Net Revenue', data.summary.netSales, 'font-bold text-charcoal-900'],
                    ['(−) Cost of Goods Sold (COGS)', data.summary.costOfGoodsSold, 'text-red-600'],
                    ['= Gross Profit', data.summary.grossProfit, 'font-bold text-emerald-700'],
                    ['Gross Margin', `${data.summary.grossMarginPercent}%`, 'text-charcoal-600'],
                    ['(−) Operating Expenses', data.summary.operatingExpenses, 'text-red-600'],
                    ['= Estimated Net Profit', data.summary.netProfit, `font-bold text-lg ${data.summary.netProfit >= 0 ? 'text-brand-800' : 'text-red-700'}`],
                    ['Net Margin', `${data.summary.netMarginPercent}%`, 'text-charcoal-600'],
                  ].map(([label, val, className]) => (
                    <tr key={label as string}>
                      <td className="py-2 text-charcoal-600">{label}</td>
                      <td className={cn('py-2 text-right font-semibold', className as string)}>
                        {typeof val === 'number' ? formatCurrency(val) : val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-xl border border-charcoal-200 shadow-xs p-5">
              <h3 className="text-sm font-bold text-charcoal-900 mb-4">Operating Expenses Breakdown</h3>
              {Object.entries(data.summary.expenseBreakdown || {}).length === 0 ? (
                <div className="text-xs text-charcoal-400 py-4 text-center">No expenses recorded in this period</div>
              ) : (
                <div className="space-y-2 text-xs">
                  {Object.entries(data.summary.expenseBreakdown || {})
                    .sort((a: any, b: any) => b[1] - a[1])
                    .map(([cat, amt]) => (
                      <div key={cat} className="flex justify-between items-center">
                        <span className="text-charcoal-600">{cat}</span>
                        <span className="font-bold text-red-700">{formatCurrency(amt as number)}</span>
                      </div>
                    ))}
                  <div className="border-t border-charcoal-200 pt-2 flex justify-between font-bold text-charcoal-900">
                    <span>Total Operating Expenses</span>
                    <span className="text-red-700">{formatCurrency(data.summary.operatingExpenses)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== PRODUCT SALES REPORT ========== */}
      {!loading && data && reportType === 'PRODUCT_SALES' && data.products && (
        <div className="bg-white rounded-xl border border-charcoal-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-charcoal-50 text-charcoal-600 font-semibold border-b border-charcoal-200">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-right">Units Sold</th>
                  <th className="py-3 px-4 text-right">Revenue</th>
                  <th className="py-3 px-4 text-right">COGS</th>
                  <th className="py-3 px-4 text-right">Gross Profit</th>
                  <th className="py-3 px-4 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {data.products.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-charcoal-400">No sales recorded in this period</td></tr>
                ) : (
                  data.products.map((p: any, i: number) => (
                    <tr key={p.productId} className="hover:bg-charcoal-50/70">
                      <td className="py-3 px-4 text-charcoal-400">{i + 1}</td>
                      <td className="py-3 px-4 font-semibold text-charcoal-900">{p.productName}</td>
                      <td className="py-3 px-4 font-mono text-charcoal-400 text-[11px]">{p.sku}</td>
                      <td className="py-3 px-4 text-right font-bold">{p.unitsSold}</td>
                      <td className="py-3 px-4 text-right font-bold text-charcoal-900">{formatCurrency(p.revenue)}</td>
                      <td className="py-3 px-4 text-right text-red-600">{formatCurrency(p.cost)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">{formatCurrency(p.profit)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={cn(
                          'font-bold px-2 py-0.5 rounded text-[11px]',
                          p.marginPercent > 25 ? 'bg-emerald-50 text-emerald-800' : p.marginPercent > 10 ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-800'
                        )}>
                          {p.marginPercent}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== INVENTORY VALUATION ========== */}
      {!loading && data && reportType === 'INVENTORY' && data.items && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total SKUs', value: data.items.length, isCurrency: false },
              { label: 'Total Stock Units', value: data.summary.totalStockUnits, isCurrency: false },
              { label: 'Cost Valuation', value: data.summary.totalCostValuation, isCurrency: true },
              { label: 'Retail Valuation', value: data.summary.totalRetailValuation, isCurrency: true },
            ].map((c) => (
              <div key={c.label} className="bg-white p-4 rounded-xl border border-charcoal-200 shadow-xs">
                <div className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-1">{c.label}</div>
                <div className="text-xl font-bold text-charcoal-900">
                  {c.isCurrency ? formatCurrency(c.value as number) : c.value}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-charcoal-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-charcoal-50 text-charcoal-600 font-semibold border-b border-charcoal-200">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Stock</th>
                    <th className="py-3 px-4 text-right">Cost Price</th>
                    <th className="py-3 px-4 text-right">Sell Price</th>
                    <th className="py-3 px-4 text-right">Cost Valuation</th>
                    <th className="py-3 px-4 text-right">Potential Profit</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {data.items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-charcoal-50/70">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-charcoal-900">{item.name}</div>
                        <div className="text-[11px] text-charcoal-400 font-mono">{item.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-charcoal-600">{item.category}</td>
                      <td className="py-3 px-4 text-center font-bold">{item.stock} {item.unit}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(item.purchaseCost)}</td>
                      <td className="py-3 px-4 text-right font-semibold">{formatCurrency(item.sellingPrice)}</td>
                      <td className="py-3 px-4 text-right font-bold text-charcoal-900">{formatCurrency(item.costValuation)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">{formatCurrency(item.potentialProfit)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase',
                          item.status === 'HEALTHY' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          item.status === 'LOW_STOCK' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          'bg-red-50 text-red-800 border-red-200'
                        )}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========== CUSTOMER LEDGER ========== */}
      {!loading && data && reportType === 'CUSTOMER_LEDGER' && data.customers && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between text-xs">
            <span className="text-amber-800 font-medium">Total Outstanding Credit Across All Customers:</span>
            <strong className="text-amber-900 text-base">{formatCurrency(data.totalOutstanding)}</strong>
          </div>
          <div className="bg-white rounded-xl border border-charcoal-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-charcoal-50 text-charcoal-600 font-semibold border-b border-charcoal-200">
                  <tr>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4 text-center">Invoices</th>
                    <th className="py-3 px-4 text-right">Total Billed</th>
                    <th className="py-3 px-4 text-right">Total Paid</th>
                    <th className="py-3 px-4 text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {data.customers.map((c: any) => (
                    <tr key={c.id} className="hover:bg-charcoal-50/70">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-charcoal-900">{c.name}</div>
                        {c.gstin && <div className="text-[11px] font-mono text-charcoal-400">GST: {c.gstin}</div>}
                      </td>
                      <td className="py-3 px-4 text-charcoal-700">{c.phone}</td>
                      <td className="py-3 px-4 text-center">{c.invoicesCount}</td>
                      <td className="py-3 px-4 text-right font-bold text-charcoal-900">{formatCurrency(c.totalBilled)}</td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-semibold">{formatCurrency(c.totalPaid)}</td>
                      <td className="py-3 px-4 text-right font-bold">
                        {c.outstandingBalance > 0
                          ? <span className="text-red-700">{formatCurrency(c.outstandingBalance)}</span>
                          : <span className="text-charcoal-400">₹0.00</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========== GST REPORT ========== */}
      {!loading && data && reportType === 'GST' && data.slabs && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-charcoal-200 shadow-xs p-5">
            <h3 className="text-sm font-bold text-charcoal-900 mb-2">
              GSTR-1 Tax Summary | Business GSTIN: {data.businessGstin || 'Not Configured'}
            </h3>
            <table className="w-full text-xs">
              <thead className="bg-charcoal-50 text-charcoal-600 font-semibold border-b border-charcoal-200">
                <tr>
                  <th className="py-2.5 px-4">GST Rate Slab</th>
                  <th className="py-2.5 px-4 text-right">Taxable Value</th>
                  <th className="py-2.5 px-4 text-right">CGST</th>
                  <th className="py-2.5 px-4 text-right">SGST</th>
                  <th className="py-2.5 px-4 text-right">Total Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {data.slabs.map((s: any) => (
                  <tr key={s.taxRate} className="hover:bg-charcoal-50/70">
                    <td className="py-2.5 px-4 font-bold text-charcoal-900">{s.taxRate}% GST</td>
                    <td className="py-2.5 px-4 text-right">{formatCurrency(s.taxableValue)}</td>
                    <td className="py-2.5 px-4 text-right">{formatCurrency(s.cgst)}</td>
                    <td className="py-2.5 px-4 text-right">{formatCurrency(s.sgst)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-charcoal-900">{formatCurrency(s.totalTax)}</td>
                  </tr>
                ))}
                <tr className="bg-charcoal-50 font-bold border-t-2 border-charcoal-300">
                  <td className="py-2.5 px-4 text-charcoal-900">Grand Total</td>
                  <td className="py-2.5 px-4 text-right">{formatCurrency(data.totals?.grandTaxable)}</td>
                  <td className="py-2.5 px-4 text-right">{formatCurrency(data.totals?.grandCGST)}</td>
                  <td className="py-2.5 px-4 text-right">{formatCurrency(data.totals?.grandSGST)}</td>
                  <td className="py-2.5 px-4 text-right text-brand-800">{formatCurrency(data.totals?.grandTotalTax)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== REFUNDS & CANCELLATIONS ========== */}
      {!loading && data && reportType === 'REFUNDS' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-xs">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="font-semibold text-red-900">Total Cancelled/Returned</div>
              <div className="text-xl font-bold text-red-700 mt-1">{formatCurrency(data.totalValue)}</div>
              <div className="text-red-600 mt-0.5">{data.totalCount} invoices</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-charcoal-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-charcoal-50 text-charcoal-600 font-semibold border-b border-charcoal-200">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {(data.invoices || []).length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-charcoal-400">No returns or cancellations in this period.</td></tr>
                  ) : (
                    (data.invoices || []).map((i: any) => (
                      <tr key={i.id} className="hover:bg-charcoal-50/70">
                        <td className="py-3 px-4 font-bold text-charcoal-900">{i.invoiceNumber}</td>
                        <td className="py-3 px-4 text-charcoal-800">{i.customerName}</td>
                        <td className="py-3 px-4 text-right font-bold">{formatCurrency(i.grandTotal)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded border uppercase',
                            i.status === 'RETURNED' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-red-800 border-red-200'
                          )}>
                            {i.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-charcoal-500 max-w-xs truncate">
                          {i.returnReason || i.notes || '-'}
                        </td>
                        <td className="py-3 px-4 text-charcoal-500">{formatDate(i.updatedAt || i.createdAt)}</td>
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
