'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  X,
  Package,
  Minus,
  Check,
  ChevronDown,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function PurchasesPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);

  // Purchase form state
  const [supplierId, setSupplierId] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<
    { productId: string; quantity: number; unitCost: number }[]
  >([{ productId: '', quantity: 1, unitCost: 0 }]);

  // New Supplier form
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [purRes, prodRes] = await Promise.all([
        fetch('/api/purchases'),
        fetch('/api/products'),
      ]);
      const purJson = await purRes.json();
      const prodJson = await prodRes.json();

      if (purJson.success) {
        setPurchases(purJson.data.purchases);
        setSuppliers(purJson.data.suppliers);
      }
      if (prodJson.success) {
        setProducts(prodJson.data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    const res = await fetch('/api/suppliers');
    const json = await res.json();
    if (json.success) setSuppliers(json.data.suppliers);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addPurchaseItemRow = () => {
    setPurchaseItems([...purchaseItems, { productId: '', quantity: 1, unitCost: 0 }]);
  };

  const removePurchaseItemRow = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const updatePurchaseItem = (index: number, key: string, value: any) => {
    const updated = [...purchaseItems];
    (updated[index] as any)[key] = value;

    // Auto-fill unit cost from product purchase cost
    if (key === 'productId') {
      const prod = products.find((p) => p.id === value);
      if (prod) updated[index].unitCost = prod.purchaseCost;
    }

    setPurchaseItems(updated);
  };

  const purchaseTotal = purchaseItems.reduce(
    (sum, i) => sum + (i.quantity || 0) * (i.unitCost || 0),
    0
  );

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      alert('Please select a supplier');
      return;
    }
    const validItems = purchaseItems.filter((i) => i.productId && i.quantity > 0 && i.unitCost >= 0);
    if (validItems.length === 0) {
      alert('Please add at least one product');
      return;
    }

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          items: validItems,
          paidAmount: Number(paidAmount) || purchaseTotal,
          paymentMethod,
          notes: purchaseNotes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddPurchase(false);
        setSupplierId('');
        setPurchaseItems([{ productId: '', quantity: 1, unitCost: 0 }]);
        setPaidAmount('');
        setPurchaseNotes('');
        fetchData();
      } else {
        alert(json.message);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddSupplier(false);
        setSupplierForm({ name: '', contactPerson: '', phone: '', email: '', address: '', gstin: '' });
        fetchSuppliers();
      } else {
        alert(json.message);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-charcoal-900 tracking-tight">
            Purchases & Supplier Management
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Record inventory purchases, replenish stock, and manage supplier balances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddSupplier(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-charcoal-300 hover:bg-charcoal-50 text-charcoal-700 rounded-lg text-xs font-semibold shadow-xs"
          >
            <Truck className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
          <button
            onClick={() => setShowAddPurchase(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Suppliers Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {suppliers.slice(0, 3).map((s) => (
          <div key={s.id} className="bg-white border border-charcoal-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-charcoal-900">{s.name}</div>
                <div className="text-xs text-charcoal-500 mt-0.5">
                  {s.contactPerson && <span>{s.contactPerson} · </span>}
                  {s.phone}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-charcoal-100 flex items-center justify-between text-xs">
              <span className="text-charcoal-500">
                Total: <strong className="text-charcoal-800">{formatCurrency(s.totalPurchases)}</strong>
              </span>
              {s.balance > 0 && (
                <span className="text-amber-700 font-semibold">
                  Due: {formatCurrency(s.balance)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-xl border border-charcoal-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-charcoal-200">
          <h2 className="text-sm font-bold text-charcoal-900">Purchase Orders History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-charcoal-50 text-charcoal-600 font-semibold border-b border-charcoal-200">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100 text-charcoal-700">
              {loading ? (
                <tr><td colSpan={8} className="py-8 text-center text-charcoal-400">Loading purchase orders...</td></tr>
              ) : purchases.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-charcoal-400">No purchase orders recorded yet.</td></tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-charcoal-50/70">
                    <td className="py-3 px-4 font-bold text-charcoal-900">{p.purchaseNumber}</td>
                    <td className="py-3 px-4 font-medium text-charcoal-800">{p.supplierName}</td>
                    <td className="py-3 px-4 text-center text-charcoal-600">{p.items?.length || 0} SKUs</td>
                    <td className="py-3 px-4 text-right font-bold text-charcoal-900">{formatCurrency(p.totalAmount)}</td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-semibold">{formatCurrency(p.paidAmount)}</td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {p.balanceAmount > 0
                        ? <span className="text-amber-700 font-bold">{formatCurrency(p.balanceAmount)}</span>
                        : <span className="text-charcoal-400">₹0.00</span>}
                    </td>
                    <td className="py-3 px-4 text-charcoal-500">{formatDateTime(p.createdAt)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200 uppercase">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW PURCHASE ORDER MODAL */}
      {showAddPurchase && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-charcoal-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-4">
              <h3 className="text-sm font-bold text-charcoal-900">Create New Purchase Order</h3>
              <button onClick={() => setShowAddPurchase(false)} className="text-charcoal-400 hover:text-charcoal-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block font-semibold text-charcoal-700 mb-1">Supplier *</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / IMPS</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CREDIT">Credit (Pay Later)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Amount Paid Now (₹)
                  </label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder={`Full: ₹${purchaseTotal.toFixed(2)}`}
                    className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                  />
                </div>
              </div>

              {/* Purchase Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-charcoal-700">Products Received *</label>
                  <button
                    type="button"
                    onClick={addPurchaseItemRow}
                    className="text-brand-700 hover:underline text-[11px] font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Row
                  </button>
                </div>

                <div className="space-y-2">
                  {purchaseItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => updatePurchaseItem(index, 'productId', e.target.value)}
                          className="w-full border border-charcoal-300 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-brand-600"
                        >
                          <option value="">Select Product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => updatePurchaseItem(index, 'quantity', Number(e.target.value))}
                          placeholder="Qty"
                          className="w-full border border-charcoal-300 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-brand-600"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.unitCost}
                          onChange={(e) => updatePurchaseItem(index, 'unitCost', Number(e.target.value))}
                          placeholder="Unit Cost ₹"
                          className="w-full border border-charcoal-300 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-brand-600"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {purchaseItems.length > 1 && (
                          <button type="button" onClick={() => removePurchaseItemRow(index)}
                            className="text-red-500 hover:text-red-700">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 p-3 bg-brand-50 rounded-lg border border-brand-200 flex justify-between text-xs font-bold text-brand-900">
                  <span>Purchase Total:</span>
                  <span>{formatCurrency(purchaseTotal)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Notes / Reference</label>
                <textarea
                  rows={2}
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  placeholder="Invoice reference number, delivery challan, etc."
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div className="pt-3 border-t border-charcoal-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPurchase(false)}
                  className="px-4 py-2 border border-charcoal-300 rounded-lg text-charcoal-700 hover:bg-charcoal-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Confirm Purchase & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SUPPLIER MODAL */}
      {showAddSupplier && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-charcoal-200">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-3">
              <h3 className="text-sm font-bold text-charcoal-900">Register New Supplier</h3>
              <button onClick={() => setShowAddSupplier(false)} className="text-charcoal-400 hover:text-charcoal-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSupplier} className="space-y-3 text-xs">
              {[
                { key: 'name', label: 'Supplier / Company Name *', type: 'text', required: true, placeholder: 'e.g. Metro Cash & Carry' },
                { key: 'contactPerson', label: 'Contact Person', type: 'text', required: false, placeholder: 'e.g. Suresh Menon' },
                { key: 'phone', label: 'Phone Number *', type: 'tel', required: true, placeholder: '+91 98765 43210' },
                { key: 'email', label: 'Email', type: 'email', required: false, placeholder: 'orders@supplier.com' },
                { key: 'gstin', label: 'GSTIN', type: 'text', required: false, placeholder: '27AABCM3312R1ZZ' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block font-semibold text-charcoal-700 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    required={f.required}
                    value={(supplierForm as any)[f.key]}
                    onChange={(e) => setSupplierForm({ ...supplierForm, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                  />
                </div>
              ))}
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  placeholder="Warehouse/business address"
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddSupplier(false)}
                  className="px-3 py-1.5 border border-charcoal-300 rounded-lg text-charcoal-700 hover:bg-charcoal-50 font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg font-bold">
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
