import { NextRequest } from 'next/server';
import {
  getDatabase,
  saveDatabase,
  generateId,
  Invoice,
  InvoiceItem,
  Payment,
  StockMovement,
  Customer,
} from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const status = searchParams.get('status') || 'ALL'; // ALL, COMPLETED, CANCELLED, RETURNED
  const paymentStatus = searchParams.get('paymentStatus') || 'ALL'; // ALL, PAID, PARTIAL, UNPAID
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const db = getDatabase();

  let list = db.invoices.filter((inv) => {
    const matchSearch =
      !search ||
      inv.invoiceNumber.toLowerCase().includes(search) ||
      inv.customerName.toLowerCase().includes(search) ||
      (inv.customerPhone && inv.customerPhone.includes(search));

    const matchStatus = status === 'ALL' || inv.status === status;
    const matchPayment = paymentStatus === 'ALL' || inv.paymentStatus === paymentStatus;

    let matchDate = true;
    if (startDate) {
      matchDate = matchDate && new Date(inv.createdAt) >= new Date(startDate);
    }
    if (endDate) {
      matchDate = matchDate && new Date(inv.createdAt) <= new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    return matchSearch && matchStatus && matchPayment && matchDate;
  });

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return successResponse({
    invoices: list,
    total: list.length,
    business: db.businessProfile,
  });
}

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const {
      customerId,
      customerName = 'Walk-in Customer',
      customerPhone,
      customerAddress,
      customerGstin,
      items, // array of { productId, variantId, quantity, unitPrice, taxRate, discountAmount }
      discountAmount = 0, // bill-level discount
      paymentMethod = 'CASH', // CASH, UPI, CARD, BANK_TRANSFER, CREDIT, SPLIT
      splitDetails, // { cash: 500, upi: 500 }
      paidAmount = 0,
      notes,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse('Cart must contain at least one item', 400);
    }

    const db = getDatabase();
    const now = new Date().toISOString();

    // 1. Validate items and stock availability
    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId);
      if (!product) {
        return errorResponse(`Product with ID "${item.productId}" not found`, 404);
      }
      if (item.quantity <= 0) {
        return errorResponse(`Invalid quantity for "${product.name}"`, 400);
      }
      if (product.stock < item.quantity) {
        return errorResponse(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`,
          400
        );
      }
    }

    // 2. Generate unique Invoice Number safely
    const prefix = db.businessProfile.invoicePrefix || 'INV-';
    const counter = db.businessProfile.invoiceCounter || 1001;
    const invoiceNumber = `${prefix}${counter}`;
    db.businessProfile.invoiceCounter = counter + 1;

    // 3. Process line items and compute subtotal & taxes
    let subtotal = 0;
    let totalTaxAmount = 0;
    let totalItemDiscount = 0;
    const invoiceId = generateId();

    const invoiceItems: InvoiceItem[] = [];

    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId)!;
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice ?? product.sellingPrice);
      const taxRate = Number(item.taxRate ?? product.taxRate);
      const itemDisc = Number(item.discountAmount || 0);

      const baseAmount = qty * price - itemDisc;
      const taxAmount = (baseAmount * taxRate) / 100;
      const lineTotal = baseAmount + taxAmount;

      subtotal += baseAmount;
      totalTaxAmount += taxAmount;
      totalItemDiscount += itemDisc;

      // Decrement product stock
      product.stock -= qty;

      // If variant, decrement variant stock too
      if (item.variantId && product.variants) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (variant) {
          variant.stock = Math.max(0, variant.stock - qty);
        }
      }

      // Record Stock Movement
      const movement: StockMovement = {
        id: generateId(),
        productId: product.id,
        productName: product.name,
        variantId: item.variantId || null,
        type: 'SALE',
        quantity: -qty,
        balanceAfter: product.stock,
        unitCost: product.purchaseCost,
        reason: `Sale on Invoice ${invoiceNumber}`,
        referenceId: invoiceId,
        userName: user.name,
        createdAt: now,
      };
      db.stockMovements.unshift(movement);

      invoiceItems.push({
        id: generateId(),
        invoiceId,
        productId: product.id,
        variantId: item.variantId || null,
        productName: product.name,
        productSku: product.sku,
        quantity: qty,
        unitCost: product.purchaseCost,
        unitPrice: price,
        taxRate,
        taxAmount,
        discountAmount: itemDisc,
        lineTotal,
      });
    }

    const overallDiscount = Number(discountAmount) + totalItemDiscount;
    const grandTotal = Math.max(0, subtotal + totalTaxAmount - Number(discountAmount));

    let finalPaid = Number(paidAmount);
    if (paymentMethod === 'CREDIT' && paidAmount === undefined) {
      finalPaid = 0;
    } else if (paymentMethod !== 'CREDIT' && (paidAmount === undefined || paidAmount === 0)) {
      finalPaid = grandTotal;
    }

    const balanceAmount = Math.max(0, grandTotal - finalPaid);
    const paymentStatus =
      balanceAmount === 0 ? 'PAID' : finalPaid > 0 ? 'PARTIAL' : 'UNPAID';

    // 4. Handle Customer Record / Credit
    let targetCustomerId = customerId;
    if (!targetCustomerId && customerPhone) {
      // Find or create customer by phone
      let existingCust = db.customers.find((c) => c.phone === customerPhone.trim());
      if (!existingCust) {
        existingCust = {
          id: generateId(),
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: null,
          address: customerAddress || null,
          gstin: customerGstin || null,
          totalPurchases: 0,
          outstandingBalance: 0,
          createdAt: now,
          updatedAt: now,
        };
        db.customers.push(existingCust);
      }
      targetCustomerId = existingCust.id;
    }

    if (targetCustomerId) {
      const cust = db.customers.find((c) => c.id === targetCustomerId);
      if (cust) {
        cust.totalPurchases += grandTotal;
        if (balanceAmount > 0) {
          cust.outstandingBalance += balanceAmount;
        }
        cust.updatedAt = now;
      }
    }

    // 5. Create Payment record(s)
    const payments: Payment[] = [];
    if (finalPaid > 0) {
      if (paymentMethod === 'SPLIT' && splitDetails) {
        for (const [method, amount] of Object.entries(splitDetails)) {
          if (Number(amount) > 0) {
            payments.push({
              id: generateId(),
              invoiceId,
              customerId: targetCustomerId || null,
              amount: Number(amount),
              paymentMethod: method as any,
              notes: `Split payment (${method}) on invoice ${invoiceNumber}`,
              userName: user.name,
              createdAt: now,
            });
          }
        }
      } else {
        payments.push({
          id: generateId(),
          invoiceId,
          customerId: targetCustomerId || null,
          amount: finalPaid,
          paymentMethod: paymentMethod as any,
          notes: `Payment on invoice ${invoiceNumber}`,
          userName: user.name,
          createdAt: now,
        });
      }
    }

    // 6. Build Invoice
    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      customerId: targetCustomerId || null,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || null,
      customerAddress: customerAddress || null,
      customerGstin: customerGstin || null,
      subtotal,
      taxAmount: totalTaxAmount,
      discountAmount: overallDiscount,
      grandTotal,
      paidAmount: finalPaid,
      balanceAmount,
      paymentStatus,
      paymentMethod,
      splitDetails: splitDetails || null,
      status: 'COMPLETED',
      notes: notes || null,
      createdById: user.id,
      createdByName: user.name,
      items: invoiceItems,
      payments,
      createdAt: now,
      updatedAt: now,
    };

    db.invoices.unshift(newInvoice);

    // Audit Log
    db.auditLogs.unshift({
      id: generateId(),
      userId: user.id,
      userName: user.name,
      action: 'INVOICE_CREATED',
      entity: 'INVOICE',
      entityId: invoiceId,
      details: `Generated invoice ${invoiceNumber} for ₹${grandTotal.toFixed(2)} (${paymentMethod})`,
      createdAt: now,
    });

    saveDatabase(db);

    return successResponse(
      {
        invoice: newInvoice,
        business: db.businessProfile,
      },
      'Invoice created successfully',
      201
    );
  } catch (err: any) {
    console.error('Error creating invoice:', err);
    return errorResponse(err.message || 'Failed to generate invoice', 500);
  }
}
