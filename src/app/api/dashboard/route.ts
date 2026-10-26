import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'today'; // today, yesterday, last7days, thismonth, custom
  const customStart = searchParams.get('startDate');
  const customEnd = searchParams.get('endDate');

  const db = getDatabase();

  // Date range determination
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  if (period === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (period === 'yesterday') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
  } else if (period === 'last7days') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    endDate = new Date();
  } else if (period === 'thismonth') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    endDate = new Date();
  } else if (period === 'custom' && customStart && customEnd) {
    startDate = new Date(customStart);
    endDate = new Date(new Date(customEnd).setHours(23, 59, 59, 999));
  }

  // Filter completed invoices in range
  const periodInvoices = db.invoices.filter((inv) => {
    const invDate = new Date(inv.createdAt);
    return invDate >= startDate && invDate <= endDate && inv.status === 'COMPLETED';
  });

  // Calculate Revenue, COGS, Gross Profit for period
  let periodRevenue = 0;
  let periodCOGS = 0;
  let periodTaxCollected = 0;
  let periodDiscountGiven = 0;

  periodInvoices.forEach((inv) => {
    periodRevenue += inv.grandTotal;
    periodTaxCollected += inv.taxAmount;
    periodDiscountGiven += inv.discountAmount;

    inv.items.forEach((item) => {
      periodCOGS += item.quantity * (item.unitCost || 0);
    });
  });

  const periodGrossProfit = periodRevenue - periodTaxCollected - periodCOGS;

  // Operating Expenses in range
  const periodExpenses = db.expenses.filter((exp) => {
    const expDate = new Date(exp.date);
    return expDate >= startDate && expDate <= endDate;
  });

  const periodExpensesTotal = periodExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const periodNetProfit = periodGrossProfit - periodExpensesTotal;

  // Always compute "Today" figures for the primary top cards
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const todayInvoices = db.invoices.filter((inv) => {
    const invDate = new Date(inv.createdAt);
    return invDate >= todayStart && invDate <= todayEnd && inv.status === 'COMPLETED';
  });

  let todaySales = 0;
  let todayCOGS = 0;
  let todayTax = 0;
  todayInvoices.forEach((inv) => {
    todaySales += inv.grandTotal;
    todayTax += inv.taxAmount;
    inv.items.forEach((item) => {
      todayCOGS += item.quantity * (item.unitCost || 0);
    });
  });
  const todayProfit = todaySales - todayTax - todayCOGS;

  // Total products & low-stock alerts
  const totalProductsCount = db.products.length;
  const lowStockAlerts = db.products
    .filter((p) => p.stock <= p.minStockAlert)
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      minStockAlert: p.minStockAlert,
      unit: p.unit,
      sellingPrice: p.sellingPrice,
    }));

  // Outstanding payments across all customers
  const totalOutstandingPayments = db.customers.reduce(
    (sum, c) => sum + (c.outstandingBalance > 0 ? c.outstandingBalance : 0),
    0
  );

  // Payment methods summary in period
  const paymentMethodSummary: Record<string, { count: number; total: number }> = {
    CASH: { count: 0, total: 0 },
    UPI: { count: 0, total: 0 },
    CARD: { count: 0, total: 0 },
    BANK_TRANSFER: { count: 0, total: 0 },
    CREDIT: { count: 0, total: 0 },
    SPLIT: { count: 0, total: 0 },
  };

  periodInvoices.forEach((inv) => {
    const method = inv.paymentMethod || 'CASH';
    if (!paymentMethodSummary[method]) {
      paymentMethodSummary[method] = { count: 0, total: 0 };
    }
    paymentMethodSummary[method].count += 1;
    paymentMethodSummary[method].total += inv.grandTotal;
  });

  // Recent transactions (last 7 invoices)
  const recentTransactions = [...db.invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 7)
    .map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName,
      customerPhone: inv.customerPhone,
      grandTotal: inv.grandTotal,
      paidAmount: inv.paidAmount,
      balanceAmount: inv.balanceAmount,
      paymentMethod: inv.paymentMethod,
      paymentStatus: inv.paymentStatus,
      status: inv.status,
      itemsCount: inv.items.length,
      createdAt: inv.createdAt,
    }));

  // Sales performance chart data (last 7 days breakdown)
  const chartDays: { [key: string]: { date: string; label: string; sales: number; profit: number; orders: number } } = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    chartDays[key] = { date: key, label, sales: 0, profit: 0, orders: 0 };
  }

  db.invoices.forEach((inv) => {
    if (inv.status !== 'COMPLETED') return;
    const invDay = inv.createdAt.split('T')[0];
    if (chartDays[invDay]) {
      chartDays[invDay].sales += inv.grandTotal;
      chartDays[invDay].orders += 1;
      let cogs = 0;
      inv.items.forEach((item) => {
        cogs += item.quantity * (item.unitCost || 0);
      });
      chartDays[invDay].profit += (inv.grandTotal - inv.taxAmount - cogs);
    }
  });

  const chartData = Object.values(chartDays);

  return successResponse({
    summaryCards: {
      todaySales,
      todayProfit,
      totalProducts: totalProductsCount,
      outstandingPayments: totalOutstandingPayments,
      todayOrdersCount: todayInvoices.length,
    },
    filteredMetrics: {
      period,
      revenue: periodRevenue,
      cogs: periodCOGS,
      taxCollected: periodTaxCollected,
      discountGiven: periodDiscountGiven,
      grossProfit: periodGrossProfit,
      expenses: periodExpensesTotal,
      netProfit: periodNetProfit,
      ordersCount: periodInvoices.length,
    },
    chartData,
    recentTransactions,
    lowStockAlerts,
    paymentMethodSummary,
    business: {
      name: db.businessProfile.name,
      currencySymbol: db.businessProfile.currencySymbol,
    },
  });
}
