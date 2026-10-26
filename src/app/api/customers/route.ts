import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase, generateId, Customer } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const filter = searchParams.get('filter') || 'all'; // all, with_balance

  const db = getDatabase();

  let customers = db.customers.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search));

    const matchFilter = filter === 'with_balance' ? c.outstandingBalance > 0 : true;
    return matchSearch && matchFilter;
  });

  customers.sort((a, b) => b.outstandingBalance - a.outstandingBalance);

  return successResponse({
    customers,
    total: customers.length,
    totalOutstanding: db.customers.reduce((sum, c) => sum + c.outstandingBalance, 0),
  });
}

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { name, phone, email, address, gstin } = body;

    if (!name || !phone) {
      return errorResponse('Customer name and phone number are required', 400);
    }

    const db = getDatabase();
    const exists = db.customers.find((c) => c.phone.trim() === phone.trim());
    if (exists) {
      return errorResponse(`Customer with phone number ${phone} already exists`, 400);
    }

    const now = new Date().toISOString();
    const newCust: Customer = {
      id: generateId(),
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : null,
      address: address ? address.trim() : null,
      gstin: gstin ? gstin.trim().toUpperCase() : null,
      totalPurchases: 0,
      outstandingBalance: 0,
      createdAt: now,
      updatedAt: now,
    };

    db.customers.unshift(newCust);

    db.auditLogs.unshift({
      id: generateId(),
      userId: user.id,
      userName: user.name,
      action: 'CUSTOMER_CREATED',
      entity: 'CUSTOMER',
      entityId: newCust.id,
      details: `Created customer ${newCust.name} (${newCust.phone})`,
      createdAt: now,
    });

    saveDatabase(db);
    return successResponse(newCust, 'Customer registered successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create customer', 500);
  }
}
