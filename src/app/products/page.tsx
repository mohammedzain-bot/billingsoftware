'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  History,
  ArrowUpDown,
  X,
  Check,
  Tag,
  Boxes,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function ProductsPage() {
  const { user, permissions } = useAuth();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all, low, out
  const [sortBy, setSortBy] = useState('name');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<any>(null);
  const [stockAdjustData, setStockAdjustData] = useState({
    delta: 0,
    reason: 'Inventory Audit Verification',
  });
  const [historyProduct, setHistoryProduct] = useState<any>(null);
  const [historyMovements, setHistoryMovements] = useState<any[]>([]);

  // Product Form state
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    categoryId: '',
    purchaseCost: '',
    sellingPrice: '',
    taxRate: '18',
    stock: '',
    minStockAlert: '5',
    unit: 'pcs',
    hasVariants: false,
    variants: [] as any[],
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/api/products?stockFilter=${stockFilter}&sortBy=${sortBy}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (selectedCategory) url += `&categoryId=${selectedCategory}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data.products);
        setCategories(json.data.categories);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [stockFilter, sortBy, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  // Add / Edit submission
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = Boolean(editingProduct);
      const url = isEdit ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        ...productForm,
        purchaseCost: Number(productForm.purchaseCost) || 0,
        sellingPrice: Number(productForm.sellingPrice) || 0,
        taxRate: Number(productForm.taxRate) || 0,
        stock: Number(productForm.stock) || 0,
        minStockAlert: Number(productForm.minStockAlert) || 5,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setEditingProduct(null);
        resetForm();
        fetchProducts();
      } else {
        alert(json.message);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Execute Stock Adjustment
  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustProduct) return;

    try {
      const res = await fetch(`/api/products/${stockAdjustProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockAdjustment: Number(stockAdjustData.delta),
          adjustmentReason: stockAdjustData.reason,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStockAdjustProduct(null);
        setStockAdjustData({ delta: 0, reason: 'Inventory Audit Verification' });
        fetchProducts();
      } else {
        alert(json.message);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // View Stock History
  const handleViewHistory = async (prod: any) => {
    setHistoryProduct(prod);
    try {
      const res = await fetch(`/api/products/${prod.id}`);
      const json = await res.json();
      if (json.success) {
        setHistoryMovements(json.data.movements || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete product "${name}"?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchProducts();
      } else {
        alert(json.message);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      sku: '',
      barcode: '',
      description: '',
      categoryId: '',
      purchaseCost: '',
      sellingPrice: '',
      taxRate: '18',
      stock: '',
      minStockAlert: '5',
      unit: 'pcs',
      hasVariants: false,
      variants: [],
    });
  };

  const startEdit = (p: any) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      description: p.description || '',
      categoryId: p.categoryId || '',
      purchaseCost: String(p.purchaseCost),
      sellingPrice: String(p.sellingPrice),
      taxRate: String(p.taxRate),
      stock: String(p.stock),
      minStockAlert: String(p.minStockAlert),
      unit: p.unit || 'pcs',
      hasVariants: p.hasVariants || false,
      variants: p.variants || [],
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-charcoal-900 tracking-tight">
            Products & Inventory Catalog
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Configure retail products, variants, barcode tags, tax rates, and safety stock
          </p>
        </div>

        {user?.role !== 'CASHIER' && (
          <button
            onClick={() => {
              resetForm();
              setEditingProduct(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-charcoal-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by product name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-charcoal-300 rounded-lg text-xs focus:ring-1 focus:ring-brand-600"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-2.5 border border-charcoal-300 rounded-lg text-xs text-charcoal-700 focus:ring-1 focus:ring-brand-600"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full py-2 px-2.5 border border-charcoal-300 rounded-lg text-xs text-charcoal-700 focus:ring-1 focus:ring-brand-600"
            >
              <option value="all">All Stock Status</option>
              <option value="low">Low Stock Alerts</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2 px-2.5 border border-charcoal-300 rounded-lg text-xs text-charcoal-700 focus:ring-1 focus:ring-brand-600"
            >
              <option value="name">Sort by Name</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="stock_asc">Stock: Low to High</option>
              <option value="stock_desc">Stock: High to Low</option>
            </select>
          </div>
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-charcoal-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-charcoal-50 text-charcoal-600 font-semibold border-b border-charcoal-200">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-center">GST Slab</th>
                <th className="py-3 px-4 text-center">Stock Level</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100 text-charcoal-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal-400">
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal-400">
                    No products matching your search.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const catName =
                    categories.find((c) => c.id === p.categoryId)?.name ||
                    'General';
                  const isOutOfStock = p.stock <= 0;
                  const isLow = p.stock <= p.minStockAlert && !isOutOfStock;

                  return (
                    <tr key={p.id} className="hover:bg-charcoal-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-charcoal-900">{p.name}</div>
                        <div className="text-[11px] text-charcoal-400 flex items-center gap-2 mt-0.5">
                          <span>SKU: {p.sku}</span>
                          {p.barcode && <span>• Barcode: {p.barcode}</span>}
                          {p.hasVariants && (
                            <span className="text-brand-700 font-semibold">
                              • ({p.variants?.length || 0} Variants)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-charcoal-600">
                        <span className="px-2 py-0.5 bg-charcoal-100 rounded text-[11px] font-medium">
                          {catName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-charcoal-600">
                        {formatCurrency(p.purchaseCost)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-charcoal-900">
                        {formatCurrency(p.sellingPrice)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium text-charcoal-700">
                          {p.taxRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full font-bold text-[11px] border',
                              isOutOfStock
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : isLow
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            )}
                          >
                            {p.stock} {p.unit}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Stock Movement History */}
                          <button
                            onClick={() => handleViewHistory(p)}
                            className="p-1.5 text-charcoal-500 hover:text-brand-700 hover:bg-brand-50 rounded"
                            title="Stock Movement Audit Trail"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Quick Stock Adjustment */}
                          {user?.role !== 'CASHIER' && (
                            <button
                              onClick={() => {
                                setStockAdjustProduct(p);
                                setStockAdjustData({ delta: 0, reason: 'Physical stock audit correction' });
                              }}
                              className="p-1.5 text-charcoal-500 hover:text-amber-700 hover:bg-amber-50 rounded"
                              title="Adjust Stock"
                            >
                              <ArrowUpDown className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit Product */}
                          {user?.role !== 'CASHIER' && (
                            <button
                              onClick={() => startEdit(p)}
                              className="p-1.5 text-charcoal-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Product */}
                          {(user?.role === 'OWNER' || user?.role === 'MANAGER') && (
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-1.5 text-charcoal-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-charcoal-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-4">
              <h3 className="text-base font-bold text-charcoal-900">
                {editingProduct ? 'Edit Product Details' : 'Add New Retail Product'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-charcoal-400 hover:text-charcoal-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Daawat Basmati Rice 5kg"
                    className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    placeholder="e.g. GRO-RICE-001"
                    className="w-full border border-charcoal-300 rounded-lg p-2 font-mono uppercase focus:ring-1 focus:ring-brand-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Barcode (EAN / UPC)
                  </label>
                  <input
                    type="text"
                    value={productForm.barcode}
                    onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                    placeholder="e.g. 8901234001011"
                    className="w-full border border-charcoal-300 rounded-lg p-2 font-mono focus:ring-1 focus:ring-brand-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Category
                  </label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Purchase Cost (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.purchaseCost}
                    onChange={(e) => setProductForm({ ...productForm, purchaseCost: e.target.value })}
                    placeholder="340.00"
                    className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Retail Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.sellingPrice}
                    onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                    placeholder="460.00"
                    className="w-full border border-charcoal-300 rounded-lg p-2 font-bold focus:ring-1 focus:ring-brand-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    GST Tax Slab Rate
                  </label>
                  <select
                    value={productForm.taxRate}
                    onChange={(e) => setProductForm({ ...productForm, taxRate: e.target.value })}
                    className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                  >
                    <option value="0">0% (Nil / Exempted)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST (Standard)</option>
                    <option value="28">28% GST</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Unit of Measure
                  </label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="pack">Pack</option>
                    <option value="box">Box</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="ltr">Liter (ltr)</option>
                    <option value="mtr">Meter (mtr)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Initial Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    placeholder="50"
                    className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Low Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    value={productForm.minStockAlert}
                    onChange={(e) => setProductForm({ ...productForm, minStockAlert: e.target.value })}
                    placeholder="5"
                    className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Product Description
                </label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Optional item details, size specs, or storage notes..."
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div className="pt-3 border-t border-charcoal-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-charcoal-300 rounded-lg text-charcoal-700 hover:bg-charcoal-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg font-bold shadow-xs"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK STOCK ADJUSTMENT MODAL */}
      {stockAdjustProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-charcoal-200">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-3">
              <h3 className="text-sm font-bold text-charcoal-900">
                Adjust Product Stock
              </h3>
              <button
                onClick={() => setStockAdjustProduct(null)}
                className="text-charcoal-400 hover:text-charcoal-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-charcoal-600 mb-3">
              Product: <strong className="text-charcoal-900">{stockAdjustProduct.name}</strong>
              <br />
              Current Stock: <strong className="text-brand-800">{stockAdjustProduct.stock} {stockAdjustProduct.unit}</strong>
            </p>

            <form onSubmit={handleStockAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Stock Change (+ to add, - to reduce)
                </label>
                <input
                  type="number"
                  required
                  value={stockAdjustData.delta || ''}
                  onChange={(e) =>
                    setStockAdjustData({ ...stockAdjustData, delta: Number(e.target.value) })
                  }
                  placeholder="e.g. +10 or -3"
                  className="w-full border border-charcoal-300 rounded-lg p-2 font-bold focus:ring-1 focus:ring-brand-600"
                />
                <span className="text-[11px] text-charcoal-500">
                  New stock will be: {Math.max(0, stockAdjustProduct.stock + Number(stockAdjustData.delta || 0))}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Reason for Adjustment *
                </label>
                <select
                  value={stockAdjustData.reason}
                  onChange={(e) =>
                    setStockAdjustData({ ...stockAdjustData, reason: e.target.value })
                  }
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                >
                  <option value="Physical Stock Audit Correction">Physical Stock Audit Correction</option>
                  <option value="Damaged / Broken in Store">Damaged / Broken in Store</option>
                  <option value="Expired / Past Best Before">Expired / Past Best Before</option>
                  <option value="Found Unrecorded Stock">Found Unrecorded Stock</option>
                  <option value="Internal Store Consumption">Internal Store Consumption</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStockAdjustProduct(null)}
                  className="px-3 py-1.5 border border-charcoal-300 rounded-lg text-charcoal-700 hover:bg-charcoal-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg font-bold"
                >
                  Apply Stock Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK MOVEMENT AUDIT TRAIL MODAL */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-5 border border-charcoal-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-3">
              <div>
                <h3 className="text-sm font-bold text-charcoal-900">
                  Stock Movement Audit Log
                </h3>
                <p className="text-xs text-charcoal-500">
                  {historyProduct.name} (SKU: {historyProduct.sku})
                </p>
              </div>
              <button
                onClick={() => setHistoryProduct(null)}
                className="text-charcoal-400 hover:text-charcoal-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-charcoal-50 text-charcoal-600 font-semibold border-b border-charcoal-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Change</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Reason / Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100 text-charcoal-700">
                  {historyMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-charcoal-400">
                        No recorded movements for this product.
                      </td>
                    </tr>
                  ) : (
                    historyMovements.map((m) => (
                      <tr key={m.id}>
                        <td className="py-2 px-3 text-charcoal-500 whitespace-nowrap">
                          {formatDateTime(m.createdAt)}
                        </td>
                        <td className="py-2 px-3 font-semibold">
                          <span
                            className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded font-bold uppercase',
                              m.type === 'SALE'
                                ? 'bg-blue-50 text-blue-700'
                                : m.type === 'PURCHASE'
                                ? 'bg-emerald-50 text-emerald-700'
                                : m.type === 'RETURN'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-charcoal-100 text-charcoal-700'
                            )}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td
                          className={cn(
                            'py-2 px-3 text-right font-bold',
                            m.quantity > 0 ? 'text-emerald-700' : 'text-red-600'
                          )}
                        >
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-charcoal-900">
                          {m.balanceAfter}
                        </td>
                        <td className="py-2 px-3 text-charcoal-600">
                          {m.userName || 'System'}
                        </td>
                        <td className="py-2 px-3 text-charcoal-500 max-w-xs truncate">
                          {m.reason || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
