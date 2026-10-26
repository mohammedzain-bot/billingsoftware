import { NextRequest } from 'next/server';
import {
  getDatabase,
  saveDatabase,
  generateId,
  Purchase,
  PurchaseItem,
  StockMovement,
} from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const db = getDatabase();
  const purchases = [...db.purchases].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return successResponse({
    purchases,
    total: purchases.length,
    suppliers: db.suppliers,
    products: db.products,
  });
}

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();
  if (user.role === 'CASHIER') {
    return forbiddenResponse('Cashiers do not have permission to record purchases');
  }

  try {
    const body = await request.json();
    const {
      supplierId,
      items, // array of { productId, variantId, quantity, unitCost }
      paidAmount = 0,
      paymentMethod = 'BANK_TRANSFER',
      notes,
    } = body;

    if (!supplierId) return errorResponse('Supplier is required', 400);
    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse('Purchase must contain at least one item', 400);
    }

    const db = getDatabase();
    const supplier = db.suppliers.find((s) => s.id === supplierId);
    if (!supplier) return errorResponse('Supplier not found', 404);

    const now = new Date().toISOString();
    const purchaseId = generateId();
    const purchaseCounter = db.purchases.length + 1;
    const purchaseNumber = `PUR-${new Date().getFullYear()}-${String(purchaseCounter).padStart(3, '0')}`;

    let totalAmount = 0;
    const purchaseItems: PurchaseItem[] = [];

    // Process items and replenish stock
    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId);
      if (!product) return errorResponse(`Product with ID "${item.productId}" not found`, 404);

      const qty = Number(item.quantity);
      const cost = Number(item.unitCost ?? product.purchaseCost);
      if (qty <= 0) return errorResponse(`Invalid quantity for ${product.name}`, 400);

      const lineTotal = qty * cost;
      totalAmount += lineTotal;

      // Replenish stock
      product.stock += qty;
      product.purchaseCost = cost; // update to latest cost
      product.updatedAt = now;

      // Handle variant if specified
      if (item.variantId && product.variants) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (variant) {
          variant.stock += qty;
          variant.purchaseCost = cost;
        }
      }

      // Stock movement audit
      const movement: StockMovement = {
        id: generateId(),
        productId: product.id,
        productName: product.name,
        variantId: item.variantId || null,
        type: 'PURCHASE',
        quantity: qty,
        balanceAfter: product.stock,
        unitCost: cost,
        reason: `Purchase receipt: ${purchaseNumber}`,
        referenceId: purchaseId,
        userName: user.name,
        createdAt: now,
      };
      db.stockMovements.unshift(movement);

      purchaseItems.push({
        id: generateId(),
        purchaseId,
        productId: product.id,
        variantId: item.variantId || null,
        productName: product.name,
        quantity: qty,
        unitCost: cost,
        lineTotal,
      });
    }

    const paid = Number(paidAmount);
    const balance = Math.max(0, totalAmount - paid);

    // Update supplier ledger
    supplier.totalPurchases += totalAmount;
    if (balance > 0) {
      supplier.balance += balance;
    }
    supplier.updatedAt = now;

    const newPurchase: Purchase = {
      id: purchaseId,
      purchaseNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      totalAmount,
      paidAmount: paid,
      balanceAmount: balance,
      paymentMethod,
      status: 'COMPLETED',
      notes: notes || null,
      items: purchaseItems,
      createdById: user.id,
      createdByName: user.name,
      createdAt: now,
      updatedAt: now,
    };

    db.purchases.unshift(newPurchase);

    db.auditLogs.unshift({
      id: generateId(),
      userId: user.id,
      userName: user.name,
      action: 'PURCHASE_CONFIRMED',
      entity: 'PURCHASE',
      entityId: purchaseId,
      details: `Purchased goods worth ₹${totalAmount.toFixed(2)} from ${supplier.name} (${purchaseNumber})`,
      createdAt: now,
    });

    saveDatabase(db);
    return successResponse(newPurchase, 'Purchase recorded and stock added successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to record purchase', 500);
  }
}
