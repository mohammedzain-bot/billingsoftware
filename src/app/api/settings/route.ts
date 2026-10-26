import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase, generateId } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const db = getDatabase();
  return successResponse({
    business: db.businessProfile,
    auditLogs: db.auditLogs.slice(0, 30),
    systemStats: {
      totalProducts: db.products.length,
      totalInvoices: db.invoices.length,
      totalCustomers: db.customers.length,
      totalSuppliers: db.suppliers.length,
      totalPurchases: db.purchases.length,
      totalExpenses: db.expenses.length,
    },
  });
}

export async function PUT(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();
  if (user.role !== 'OWNER') {
    return forbiddenResponse('Only the Business Owner can modify store settings and tax preferences');
  }

  try {
    const body = await request.json();
    const db = getDatabase();
    const now = new Date().toISOString();

    const p = db.businessProfile;
    if (body.name) p.name = body.name.trim();
    if (body.tagline !== undefined) p.tagline = body.tagline.trim();
    if (body.logoUrl !== undefined) p.logoUrl = body.logoUrl;
    if (body.gstin !== undefined) p.gstin = body.gstin ? body.gstin.trim().toUpperCase() : null;
    if (body.phone) p.phone = body.phone.trim();
    if (body.email) p.email = body.email.trim();
    if (body.address) p.address = body.address.trim();
    if (body.city) p.city = body.city.trim();
    if (body.state) p.state = body.state.trim();
    if (body.pincode) p.pincode = body.pincode.trim();
    if (body.currency) p.currency = body.currency;
    if (body.currencySymbol) p.currencySymbol = body.currencySymbol;
    if (body.invoicePrefix) p.invoicePrefix = body.invoicePrefix.trim();
    if (body.invoiceCounter !== undefined) p.invoiceCounter = Number(body.invoiceCounter);
    if (body.defaultTaxRate !== undefined) p.defaultTaxRate = Number(body.defaultTaxRate);
    if (body.printPaperSize) p.printPaperSize = body.printPaperSize;
    if (body.returnPolicy !== undefined) p.returnPolicy = body.returnPolicy;
    if (body.termsAndConditions !== undefined) p.termsAndConditions = body.termsAndConditions;
    p.updatedAt = now;

    db.auditLogs.unshift({
      id: generateId(),
      userId: user.id,
      userName: user.name,
      action: 'SETTINGS_UPDATED',
      entity: 'BUSINESS_PROFILE',
      details: 'Business profile and billing preferences updated',
      createdAt: now,
    });

    saveDatabase(db);
    return successResponse(p, 'Store settings updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update settings', 500);
  }
}
