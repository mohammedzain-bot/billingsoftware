import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase, generateId, Product, StockMovement } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const categoryId = searchParams.get('categoryId') || '';
  const stockFilter = searchParams.get('stockFilter') || 'all'; // all, low, out
  const sortBy = searchParams.get('sortBy') || 'name'; // name, price_asc, price_desc, stock_asc, stock_desc

  const db = getDatabase();

  let filtered = db.products.filter((p) => {
    // Search by name, SKU, or barcode
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search) ||
      p.sku.toLowerCase().includes(search) ||
      (p.barcode && p.barcode.toLowerCase().includes(search));

    // Category filter
    const matchCategory = !categoryId || p.categoryId === categoryId;

    // Stock filter
    let matchStock = true;
    if (stockFilter === 'low') {
      matchStock = p.stock <= p.minStockAlert && p.stock > 0;
    } else if (stockFilter === 'out') {
      matchStock = p.stock <= 0;
    }

    return matchSearch && matchCategory && matchStock;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === 'price_asc') return a.sellingPrice - b.sellingPrice;
    if (sortBy === 'price_desc') return b.sellingPrice - a.sellingPrice;
    if (sortBy === 'stock_asc') return a.stock - b.stock;
    if (sortBy === 'stock_desc') return b.stock - a.stock;
    return a.name.localeCompare(b.name);
  });

  return successResponse({
    products: filtered,
    total: filtered.length,
    categories: db.categories,
  });
}

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();
  if (user.role === 'CASHIER') {
    return forbiddenResponse('Cashiers do not have permission to add or modify products');
  }

  try {
    const body = await request.json();
    const {
      name,
      sku,
      barcode,
      description,
      categoryId,
      purchaseCost,
      sellingPrice,
      taxRate = 18,
      stock = 0,
      minStockAlert = 5,
      unit = 'pcs',
      imageUrl,
      hasVariants = false,
      variants = [],
    } = body;

    if (!name || !sku) {
      return errorResponse('Product name and SKU are required', 400);
    }

    const db = getDatabase();

    // Check SKU uniqueness
    const existingSku = db.products.find(
      (p) => p.sku.toLowerCase() === sku.toLowerCase().trim()
    );
    if (existingSku) {
      return errorResponse(`Product with SKU "${sku}" already exists`, 400);
    }

    const newProductId = generateId();
    const now = new Date().toISOString();

    // Process variants if any
    const processedVariants = hasVariants && Array.isArray(variants)
      ? variants.map((v: any, index: number) => ({
          id: generateId(),
          productId: newProductId,
          name: v.name || `Variant ${index + 1}`,
          sku: v.sku || `${sku}-V${index + 1}`,
          barcode: v.barcode || null,
          purchaseCost: Number(v.purchaseCost) || Number(purchaseCost) || 0,
          sellingPrice: Number(v.sellingPrice) || Number(sellingPrice) || 0,
          stock: Number(v.stock) || 0,
          createdAt: now,
        }))
      : [];

    const totalStock = hasVariants && processedVariants.length > 0
      ? processedVariants.reduce((sum, v) => sum + v.stock, 0)
      : Number(stock) || 0;

    const newProduct: Product = {
      id: newProductId,
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      barcode: barcode ? barcode.trim() : null,
      description: description || null,
      categoryId: categoryId || null,
      purchaseCost: Number(purchaseCost) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      taxRate: Number(taxRate) || 0,
      stock: totalStock,
      minStockAlert: Number(minStockAlert) || 5,
      unit: unit || 'pcs',
      imageUrl: imageUrl || null,
      hasVariants: Boolean(hasVariants),
      variants: processedVariants,
      createdAt: now,
      updatedAt: now,
    };

    db.products.push(newProduct);

    // Record initial stock movement
    if (totalStock > 0) {
      const movement: StockMovement = {
        id: generateId(),
        productId: newProductId,
        productName: newProduct.name,
        type: 'INITIAL',
        quantity: totalStock,
        balanceAfter: totalStock,
        unitCost: Number(purchaseCost) || 0,
        reason: 'Initial product stock creation',
        userName: user.name,
        createdAt: now,
      };
      db.stockMovements.unshift(movement);
    }

    // Audit log
    db.auditLogs.unshift({
      id: generateId(),
      userId: user.id,
      userName: user.name,
      action: 'PRODUCT_CREATED',
      entity: 'PRODUCT',
      entityId: newProductId,
      details: `Created product "${newProduct.name}" (SKU: ${newProduct.sku}) with ${totalStock} initial stock`,
      createdAt: now,
    });

    saveDatabase(db);

    return successResponse(newProduct, 'Product created successfully', 201);
  } catch (err: any) {
    console.error('Error creating product:', err);
    return errorResponse(err.message || 'Failed to create product', 500);
  }
}
