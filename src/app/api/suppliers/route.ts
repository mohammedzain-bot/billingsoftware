import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase, generateId, Supplier } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase() || '';

  const db = getDatabase();

  let suppliers = db.suppliers.filter((s) => {
    return (
      !search ||
      s.name.toLowerCase().includes(search) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(search)) ||
      s.phone.includes(search) ||
      (s.gstin && s.gstin.toLowerCase().includes(search))
    );
  });

  return successResponse({
    suppliers,
    total: suppliers.length,
    totalPayableToSuppliers: db.suppliers.reduce((sum, s) => sum + s.balance, 0),
  });
}

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { name, contactPerson, phone, email, address, gstin } = body;

    if (!name || !phone) {
      return errorResponse('Supplier name and phone number are required', 400);
    }

    const db = getDatabase();
    const now = new Date().toISOString();

    const newSup: Supplier = {
      id: generateId(),
      name: name.trim(),
      contactPerson: contactPerson ? contactPerson.trim() : null,
      phone: phone.trim(),
      email: email ? email.trim() : null,
      address: address ? address.trim() : null,
      gstin: gstin ? gstin.trim().toUpperCase() : null,
      totalPurchases: 0,
      balance: 0,
      createdAt: now,
      updatedAt: now,
    };

    db.suppliers.push(newSup);

    db.auditLogs.unshift({
      id: generateId(),
      userId: user.id,
      userName: user.name,
      action: 'SUPPLIER_CREATED',
      entity: 'SUPPLIER',
      entityId: newSup.id,
      details: `Registered supplier ${newSup.name}`,
      createdAt: now,
    });

    saveDatabase(db);
    return successResponse(newSup, 'Supplier registered successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create supplier', 500);
  }
}
