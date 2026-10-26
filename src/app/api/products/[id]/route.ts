import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase, generateId, StockMovement } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const db = getDatabase();
  const product = db.products.find((p) => p.id === params.id);
  if (!product) return errorResponse('Product not found', 404);

  // Get movements for this product
  const movements = db.stockMovements.filter((m) => m.productId === params.id);
  const category = db.categories.find((c) => c.id === product.categoryId);

  return successResponse({
    product,
    category,
    movements,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();
  if (user.role === 'CASHIER') {
    return forbiddenResponse('Cashiers cannot update product records');
  }

  try {
    const body = await request.json();
    const db = getDatabase();
    const index = db.products.findIndex((p) => p.id === params.id);
    if (index === -1) return errorResponse('Product not found', 404);

    const current = db.products[index];
    const now = new Date().toISOString();

    // Check SKU collision if changed
    if (body.sku && body.sku.toUpperCase() !== current.sku.toUpperCase()) {
      const collision = db.products.find(
        (p) => p.id !== params.id && p.sku.toLowerCase() === body.sku.toLowerCase().trim()
      );
      if (collision) {
        return errorResponse(`SKU "${body.sku}" is already in use by another product`, 400);
      }
    }

    // Handle manual stock adjustment if passed
    if (body.stockAdjustment !== undefined && body.stockAdjustment !== 0) {
      const delta = Number(body.stockAdjustment);
      const newStock = Math.max(0, current.stock + delta);
      const adjustmentReason = body.adjustmentReason || 'Manual inventory audit/correction';

      const movement: StockMovement = {
        id: generateId(),
        productId: current.id,
        productName: current.name,
        type: 'ADJUSTMENT',
        quantity: delta,
        balanceAfter: newStock,
        unitCost: current.purchaseCost,
        reason: adjustmentReason,
        userName: user.name,
        createdAt: now,
      };

      db.stockMovements.unshift(movement);
      current.stock = newStock;
    } else if (body.stock !== undefined && Number(body.stock) !== current.stock) {
      const targetStock = Number(body.stock);
      const delta = targetStock - current.stock;
      const movement: StockMovement = {
        id: generateId(),
        productId: current.id,
        productName: current.name,
        type: 'ADJUSTMENT',
        quantity: delta,
        balanceAfter: targetStock,
        unitCost: current.purchaseCost,
        reason: body.adjustmentReason || 'Inventory stock sync',
        userName: user.name,
        createdAt: now,
      };
      db.stockMovements.unshift(movement);
      current.stock = targetStock;
    }

    // Update fields
    if (body.name) current.name = body.name.trim();
    if (body.sku) current.sku = body.sku.trim().toUpperCase();
    if (body.barcode !== undefined) current.barcode = body.barcode ? body.barcode.trim() : null;
    if (body.description !== undefined) current.description = body.description;
    if (body.categoryId !== undefined) current.categoryId = body.categoryId;
    if (body.purchaseCost !== undefined) current.purchaseCost = Number(body.purchaseCost);
    if (body.sellingPrice !== undefined) current.sellingPrice = Number(body.sellingPrice);
    if (body.taxRate !== undefined) current.taxRate = Number(body.taxRate);
    if (body.minStockAlert !== undefined) current.minStockAlert = Number(body.minStockAlert);
    if (body.unit !== undefined) current.unit = body.unit;
    if (body.variants !== undefined) current.variants = body.variants;
    current.updatedAt = now;

    db.products[index] = current;

    // Audit log
    db.auditLogs.unshift({
      id: generateId(),
      userId: user.id,
      userName: user.name,
      action: 'PRODUCT_UPDATED',
      entity: 'PRODUCT',
      entityId: current.id,
      details: `Updated details for product ${current.name} (SKU: ${current.sku})`,
      createdAt: now,
    });

    saveDatabase(db);
    return successResponse(current, 'Product updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update product', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();
  if (user.role !== 'OWNER' && user.role !== 'MANAGER') {
    return forbiddenResponse('Only Owner or Manager can delete products');
  }

  const db = getDatabase();
  const product = db.products.find((p) => p.id === params.id);
  if (!product) return errorResponse('Product not found', 404);

  // Check if product is in any invoice
  const hasInvoices = db.invoices.some((inv) =>
    inv.items.some((item) => item.productId === params.id)
  );

  if (hasInvoices) {
    return errorResponse(
      'Cannot delete product because it has past sales records. You may set its stock to 0 instead.',
      400
    );
  }

  db.products = db.products.filter((p) => p.id !== params.id);
  db.stockMovements = db.stockMovements.filter((m) => m.productId !== params.id);

  db.auditLogs.unshift({
    id: generateId(),
    userId: user.id,
    userName: user.name,
    action: 'PRODUCT_DELETED',
    entity: 'PRODUCT',
    entityId: params.id,
    details: `Deleted product ${product.name} (SKU: ${product.sku})`,
    createdAt: new Date().toISOString(),
  });

  saveDatabase(db);
  return successResponse(null, 'Product deleted successfully');
}
