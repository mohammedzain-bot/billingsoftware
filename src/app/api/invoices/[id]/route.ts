import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase, generateId, StockMovement, Payment } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const db = getDatabase();
  const invoice = db.invoices.find((i) => i.id === params.id || i.invoiceNumber === params.id);
  if (!invoice) return errorResponse('Invoice not found', 404);

  const customer = invoice.customerId
    ? db.customers.find((c) => c.id === invoice.customerId)
    : null;

  return successResponse({
    invoice,
    customer,
    business: db.businessProfile,
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
    const { action } = body; // 'CANCEL', 'RETURN', 'PAYMENT'

    const db = getDatabase();
    const index = db.invoices.findIndex((i) => i.id === params.id || i.invoiceNumber === params.id);
    if (index === -1) return errorResponse('Invoice not found', 404);

    const invoice = db.invoices[index];
    const now = new Date().toISOString();

    if (action === 'CANCEL') {
      if (user.role === 'CASHIER' || user.role === 'INVENTORY') {
        return forbiddenResponse('Only Owner or Manager can cancel an invoice');
      }

      if (invoice.status === 'CANCELLED') {
        return errorResponse('Invoice is already cancelled', 400);
      }

      // Restore stock for all items
      for (const item of invoice.items) {
        const product = db.products.find((p) => p.id === item.productId);
        if (product) {
          product.stock += item.quantity;
          if (item.variantId && product.variants) {
            const v = product.variants.find((vr) => vr.id === item.variantId);
            if (v) v.stock += item.quantity;
          }

          // Stock movement
          const movement: StockMovement = {
            id: generateId(),
            productId: product.id,
            productName: product.name,
            variantId: item.variantId || null,
            type: 'RETURN',
            quantity: item.quantity,
            balanceAfter: product.stock,
            unitCost: item.unitCost,
            reason: `Restocked due to invoice cancellation: ${invoice.invoiceNumber}`,
            referenceId: invoice.id,
            userName: user.name,
            createdAt: now,
          };
          db.stockMovements.unshift(movement);
        }
      }

      // Revert customer outstanding balance if unpaid portion was on credit
      if (invoice.customerId && invoice.balanceAmount > 0) {
        const cust = db.customers.find((c) => c.id === invoice.customerId);
        if (cust) {
          cust.outstandingBalance = Math.max(0, cust.outstandingBalance - invoice.balanceAmount);
          cust.totalPurchases = Math.max(0, cust.totalPurchases - invoice.grandTotal);
          cust.updatedAt = now;
        }
      }

      invoice.status = 'CANCELLED';
      invoice.notes = `${invoice.notes || ''} [Cancelled by ${user.name} on ${new Date().toLocaleString('en-IN')}: ${body.reason || 'No reason provided'}]`;
      invoice.updatedAt = now;

      db.auditLogs.unshift({
        id: generateId(),
        userId: user.id,
        userName: user.name,
        action: 'INVOICE_CANCELLED',
        entity: 'INVOICE',
        entityId: invoice.id,
        details: `Cancelled invoice ${invoice.invoiceNumber}. Restocked items.`,
        createdAt: now,
      });

      saveDatabase(db);
      return successResponse(invoice, 'Invoice cancelled successfully and stock restored');
    }

    if (action === 'RETURN') {
      if (user.role === 'CASHIER' || user.role === 'INVENTORY') {
        return forbiddenResponse('Only Owner or Manager can approve returns');
      }

      if (invoice.status === 'RETURNED' || invoice.status === 'CANCELLED') {
        return errorResponse(`Invoice is already ${invoice.status.toLowerCase()}`, 400);
      }

      const returnReason = body.returnReason || 'Customer return';

      // Restore stock for items
      for (const item of invoice.items) {
        const product = db.products.find((p) => p.id === item.productId);
        if (product) {
          product.stock += item.quantity;
          if (item.variantId && product.variants) {
            const v = product.variants.find((vr) => vr.id === item.variantId);
            if (v) v.stock += item.quantity;
          }

          const movement: StockMovement = {
            id: generateId(),
            productId: product.id,
            productName: product.name,
            variantId: item.variantId || null,
            type: 'RETURN',
            quantity: item.quantity,
            balanceAfter: product.stock,
            unitCost: item.unitCost,
            reason: `Return processed: ${invoice.invoiceNumber} - ${returnReason}`,
            referenceId: invoice.id,
            userName: user.name,
            createdAt: now,
          };
          db.stockMovements.unshift(movement);
        }
      }

      // Revert customer balance if needed
      if (invoice.customerId && invoice.balanceAmount > 0) {
        const cust = db.customers.find((c) => c.id === invoice.customerId);
        if (cust) {
          cust.outstandingBalance = Math.max(0, cust.outstandingBalance - invoice.balanceAmount);
          cust.totalPurchases = Math.max(0, cust.totalPurchases - invoice.grandTotal);
          cust.updatedAt = now;
        }
      }

      invoice.status = 'RETURNED';
      invoice.returnReason = returnReason;
      invoice.returnedAt = now;
      invoice.updatedAt = now;

      db.auditLogs.unshift({
        id: generateId(),
        userId: user.id,
        userName: user.name,
        action: 'INVOICE_RETURNED',
        entity: 'INVOICE',
        entityId: invoice.id,
        details: `Returned invoice ${invoice.invoiceNumber}. Reason: ${returnReason}`,
        createdAt: now,
      });

      saveDatabase(db);
      return successResponse(invoice, 'Return processed successfully and inventory restocked');
    }

    if (action === 'PAYMENT') {
      const { paymentAmount, paymentMethod = 'CASH', referenceNumber, notes } = body;
      const amount = Number(paymentAmount);

      if (!amount || amount <= 0) {
        return errorResponse('Valid payment amount is required', 400);
      }
      if (amount > invoice.balanceAmount) {
        return errorResponse(`Payment amount cannot exceed outstanding balance of ₹${invoice.balanceAmount}`, 400);
      }

      const payment: Payment = {
        id: generateId(),
        invoiceId: invoice.id,
        customerId: invoice.customerId || null,
        amount,
        paymentMethod,
        referenceNumber: referenceNumber || null,
        notes: notes || `Installment payment for invoice ${invoice.invoiceNumber}`,
        userName: user.name,
        createdAt: now,
      };

      invoice.payments.push(payment);
      invoice.paidAmount += amount;
      invoice.balanceAmount = Math.max(0, invoice.grandTotal - invoice.paidAmount);
      invoice.paymentStatus = invoice.balanceAmount === 0 ? 'PAID' : 'PARTIAL';
      invoice.updatedAt = now;

      // Update customer outstanding balance
      if (invoice.customerId) {
        const cust = db.customers.find((c) => c.id === invoice.customerId);
        if (cust) {
          cust.outstandingBalance = Math.max(0, cust.outstandingBalance - amount);
          cust.updatedAt = now;
        }
      }

      db.auditLogs.unshift({
        id: generateId(),
        userId: user.id,
        userName: user.name,
        action: 'PAYMENT_RECORDED',
        entity: 'INVOICE',
        entityId: invoice.id,
        details: `Recorded ₹${amount} payment (${paymentMethod}) on invoice ${invoice.invoiceNumber}`,
        createdAt: now,
      });

      saveDatabase(db);
      return successResponse({ invoice, payment }, 'Payment recorded successfully');
    }

    return errorResponse('Invalid action specified', 400);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update invoice', 500);
  }
}
