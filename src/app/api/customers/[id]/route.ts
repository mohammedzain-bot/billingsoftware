import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase, generateId, Payment } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const db = getDatabase();
  const customer = db.customers.find((c) => c.id === params.id);
  if (!customer) return errorResponse('Customer not found', 404);

  // Get customer's invoices and payments
  const invoices = db.invoices.filter((i) => i.customerId === params.id);
  const payments: Payment[] = [];
  invoices.forEach((inv) => {
    inv.payments.forEach((p) => payments.push(p));
  });

  return successResponse({
    customer,
    invoices,
    payments,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const db = getDatabase();
    const customer = db.customers.find((c) => c.id === params.id);
    if (!customer) return errorResponse('Customer not found', 404);

    const now = new Date().toISOString();

    // Check if this is a direct credit balance settlement
    if (body.settlePaymentAmount) {
      const amount = Number(body.settlePaymentAmount);
      if (amount <= 0 || amount > customer.outstandingBalance) {
        return errorResponse(`Invalid settlement amount. Max allowed: ₹${customer.outstandingBalance}`, 400);
      }

      const method = body.paymentMethod || 'CASH';
      customer.outstandingBalance = Math.max(0, customer.outstandingBalance - amount);
      customer.updatedAt = now;

      // Also distribute among customer's unpaid/partial invoices
      let remainingToSettle = amount;
      for (const inv of db.invoices) {
        if (remainingToSettle <= 0) break;
        if (inv.customerId === customer.id && inv.balanceAmount > 0 && inv.status === 'COMPLETED') {
          const toPay = Math.min(inv.balanceAmount, remainingToSettle);
          inv.paidAmount += toPay;
          inv.balanceAmount -= toPay;
          inv.paymentStatus = inv.balanceAmount === 0 ? 'PAID' : 'PARTIAL';
          inv.updatedAt = now;
          inv.payments.push({
            id: generateId(),
            invoiceId: inv.id,
            customerId: customer.id,
            amount: toPay,
            paymentMethod: method,
            notes: `Customer ledger credit settlement by ${user.name}`,
            userName: user.name,
            createdAt: now,
          });
          remainingToSettle -= toPay;
        }
      }

      db.auditLogs.unshift({
        id: generateId(),
        userId: user.id,
        userName: user.name,
        action: 'CREDIT_SETTLED',
        entity: 'CUSTOMER',
        entityId: customer.id,
        details: `Customer ${customer.name} paid ₹${amount} towards outstanding credit (${method})`,
        createdAt: now,
      });

      saveDatabase(db);
      return successResponse(customer, 'Credit settlement recorded successfully');
    }

    // Normal customer details update
    if (body.name) customer.name = body.name.trim();
    if (body.phone) customer.phone = body.phone.trim();
    if (body.email !== undefined) customer.email = body.email;
    if (body.address !== undefined) customer.address = body.address;
    if (body.gstin !== undefined) customer.gstin = body.gstin ? body.gstin.trim().toUpperCase() : null;
    customer.updatedAt = now;

    db.auditLogs.unshift({
      id: generateId(),
      userId: user.id,
      userName: user.name,
      action: 'CUSTOMER_UPDATED',
      entity: 'CUSTOMER',
      entityId: customer.id,
      details: `Updated details for customer ${customer.name}`,
      createdAt: now,
    });

    saveDatabase(db);
    return successResponse(customer, 'Customer details updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update customer', 500);
  }
}
