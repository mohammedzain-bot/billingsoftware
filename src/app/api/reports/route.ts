import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();
  if (user.role === 'CASHIER' || user.role === 'INVENTORY') {
    return forbiddenResponse('Only Owner and Manager have permission to view financial reports');
  }

  const { searchParams } = new URL(request.url);
  const reportType = searchParams.get('type') || 'PROFIT_LOSS'; // PROFIT_LOSS, PRODUCT_SALES, INVENTORY, CUSTOMER_LEDGER, GST, REFUNDS
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const db = getDatabase();

  const filterByDate = (dateStr: string) => {
    let ok = true;
    if (startDate) ok = ok && new Date(dateStr) >= new Date(startDate);
    if (endDate) ok = ok && new Date(dateStr) <= new Date(new Date(endDate).setHours(23, 59, 59, 999));
    return ok;
  };

  // 1. Profit & Loss Report
  if (reportType === 'PROFIT_LOSS') {
    const completedInvoices = db.invoices.filter((i) => i.status === 'COMPLETED' && filterByDate(i.createdAt));

    let grossSales = 0;
    let taxCollected = 0;
    let discountsGiven = 0;
    let costOfGoodsSold = 0;

    completedInvoices.forEach((inv) => {
      grossSales += inv.grandTotal;
      taxCollected += inv.taxAmount;
      discountsGiven += inv.discountAmount;

      inv.items.forEach((item) => {
        costOfGoodsSold += item.quantity * (item.unitCost || 0);
      });
    });

    const netSales = grossSales - taxCollected;
    const grossProfit = netSales - costOfGoodsSold;
    const grossMarginPercent = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

    // Filter operating expenses
    const periodExpenses = db.expenses.filter((e) => filterByDate(e.date));
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

    const expenseBreakdown: Record<string, number> = {};
    periodExpenses.forEach((e) => {
      expenseBreakdown[e.category] = (expenseBreakdown[e.category] || 0) + e.amount;
    });

    const netProfit = grossProfit - totalExpenses;
    const netMarginPercent = netSales > 0 ? (netProfit / netSales) * 100 : 0;

    return successResponse({
      reportType,
      dateRange: { startDate, endDate },
      methodology: {
        formulaNetSales: 'Gross Sales - Tax Collected',
        formulaCOGS: 'Sum of (Item Quantity × Recorded Historical Purchase Cost)',
        formulaGrossProfit: 'Net Sales - Cost of Goods Sold (COGS)',
        formulaNetProfit: 'Gross Profit - Operating Expenses',
        notes: 'Tax collected is held as liability to tax authority, not recognized as revenue. Historical cost snapshots prevent cost distortion when vendor prices fluctuate.',
      },
      summary: {
        completedOrdersCount: completedInvoices.length,
        grossSales,
        taxCollected,
        discountsGiven,
        netSales,
        costOfGoodsSold,
        grossProfit,
        grossMarginPercent: Number(grossMarginPercent.toFixed(2)),
        operatingExpenses: totalExpenses,
        expenseBreakdown,
        netProfit,
        netMarginPercent: Number(netMarginPercent.toFixed(2)),
      },
    });
  }

  // 2. Product-wise Sales Report
  if (reportType === 'PRODUCT_SALES') {
    const completedInvoices = db.invoices.filter((i) => i.status === 'COMPLETED' && filterByDate(i.createdAt));
    const productStats: Record<
      string,
      {
        productId: string;
        productName: string;
        sku: string;
        unitsSold: number;
        revenue: number;
        cost: number;
        profit: number;
        marginPercent: number;
      }
    > = {};

    completedInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            sku: item.productSku,
            unitsSold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            marginPercent: 0,
          };
        }
        const stat = productStats[item.productId];
        stat.unitsSold += item.quantity;
        stat.revenue += item.lineTotal;
        const cogs = item.quantity * item.unitCost;
        stat.cost += cogs;
        stat.profit += (item.lineTotal - item.taxAmount - cogs);
      });
    });

    const rows = Object.values(productStats).map((p) => ({
      ...p,
      marginPercent: p.revenue > 0 ? Number(((p.profit / p.revenue) * 100).toFixed(2)) : 0,
    }));

    rows.sort((a, b) => b.revenue - a.revenue);

    return successResponse({
      reportType,
      dateRange: { startDate, endDate },
      products: rows,
    });
  }

  // 3. Inventory Valuation Report
  if (reportType === 'INVENTORY') {
    let totalStockUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;

    const items = db.products.map((p) => {
      const costValuation = p.stock * p.purchaseCost;
      const retailValuation = p.stock * p.sellingPrice;
      const potentialProfit = retailValuation - costValuation;

      totalStockUnits += p.stock;
      totalCostValuation += costValuation;
      totalRetailValuation += retailValuation;

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: db.categories.find((c) => c.id === p.categoryId)?.name || 'Uncategorized',
        stock: p.stock,
        unit: p.unit,
        purchaseCost: p.purchaseCost,
        sellingPrice: p.sellingPrice,
        costValuation,
        retailValuation,
        potentialProfit,
        status: p.stock <= 0 ? 'OUT_OF_STOCK' : p.stock <= p.minStockAlert ? 'LOW_STOCK' : 'HEALTHY',
      };
    });

    return successResponse({
      reportType,
      summary: {
        totalStockUnits,
        totalCostValuation,
        totalRetailValuation,
        totalPotentialProfit: totalRetailValuation - totalCostValuation,
      },
      items,
    });
  }

  // 4. Customer Credit / Ledger Report
  if (reportType === 'CUSTOMER_LEDGER') {
    const customersWithHistory = db.customers.map((c) => {
      const invoices = db.invoices.filter((i) => i.customerId === c.id);
      const totalBilled = invoices.reduce((sum, i) => sum + (i.status === 'COMPLETED' ? i.grandTotal : 0), 0);
      const totalPaid = invoices.reduce((sum, i) => sum + (i.status === 'COMPLETED' ? i.paidAmount : 0), 0);

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        gstin: c.gstin,
        totalBilled,
        totalPaid,
        outstandingBalance: c.outstandingBalance,
        invoicesCount: invoices.length,
      };
    });

    return successResponse({
      reportType,
      totalOutstanding: db.customers.reduce((sum, c) => sum + c.outstandingBalance, 0),
      customers: customersWithHistory,
    });
  }

  // 5. GST / Tax Summary Report (GSTR-1 format summary)
  if (reportType === 'GST') {
    const completedInvoices = db.invoices.filter((i) => i.status === 'COMPLETED' && filterByDate(i.createdAt));

    const slabSummary: Record<
      number,
      {
        taxRate: number;
        taxableValue: number;
        cgst: number;
        sgst: number;
        igst: number;
        totalTax: number;
      }
    > = {
      0: { taxRate: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
      5: { taxRate: 5, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
      12: { taxRate: 12, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
      18: { taxRate: 18, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
      28: { taxRate: 28, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
    };

    let grandTaxable = 0;
    let grandCGST = 0;
    let grandSGST = 0;
    let grandIGST = 0;
    let grandTotalTax = 0;

    completedInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const rate = Math.round(item.taxRate);
        if (!slabSummary[rate]) {
          slabSummary[rate] = { taxRate: rate, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
        }
        const base = item.lineTotal - item.taxAmount;
        const tax = item.taxAmount;
        const half = tax / 2;

        slabSummary[rate].taxableValue += base;
        slabSummary[rate].cgst += half;
        slabSummary[rate].sgst += half;
        slabSummary[rate].totalTax += tax;

        grandTaxable += base;
        grandCGST += half;
        grandSGST += half;
        grandTotalTax += tax;
      });
    });

    return successResponse({
      reportType,
      dateRange: { startDate, endDate },
      businessGstin: db.businessProfile.gstin,
      slabs: Object.values(slabSummary).filter((s) => s.taxableValue > 0 || s.taxRate === 18 || s.taxRate === 5),
      totals: {
        grandTaxable,
        grandCGST,
        grandSGST,
        grandIGST,
        grandTotalTax,
      },
    });
  }

  // 6. Refunds & Cancellations Report
  if (reportType === 'REFUNDS') {
    const refundedOrCancelled = db.invoices.filter(
      (i) => (i.status === 'RETURNED' || i.status === 'CANCELLED') && filterByDate(i.updatedAt || i.createdAt)
    );

    const totalValue = refundedOrCancelled.reduce((sum, i) => sum + i.grandTotal, 0);

    return successResponse({
      reportType,
      dateRange: { startDate, endDate },
      totalCount: refundedOrCancelled.length,
      totalValue,
      invoices: refundedOrCancelled,
    });
  }

  return successResponse({ error: 'Unknown report type requested' }, 'Report', 400);
}
