'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  IndianRupee,
  Smartphone,
  Landmark,
  Layers,
  UserPlus,
  Check,
  AlertCircle,
  X,
  FileCheck,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { CartItem, PaymentMethod } from '@/types';
import { useAuth } from '@/context/AuthContext';
import InvoiceModal from '@/components/pos/InvoiceModal';

export default function POSPage() {
  const { business } = useAuth();

  // State
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [billDiscount, setBillDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Customer
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
  });

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitDetails, setSplitDetails] = useState<{ [key: string]: number }>({
    CASH: 0,
    UPI: 0,
  });

  // Invoice success modal
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [prodRes, custRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/customers'),
      ]);
      const prodJson = await prodRes.json();
      const custJson = await custRes.json();

      if (prodJson.success) {
        setProducts(prodJson.data.products);
        setCategories(prodJson.data.categories);
      }
      if (custJson.success) {
        setCustomers(custJson.data.customers);
      }
    } catch (err) {
      console.error('POS fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    return matchesCat && matchesSearch;
  });

  // Barcode enter handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const term = barcodeInput.trim().toLowerCase();
    const found = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === term) ||
        p.sku.toLowerCase() === term
    );

    if (found) {
      addToCart(found);
      setBarcodeInput('');
    } else {
      setErrorMsg(`No product found with barcode or SKU "${barcodeInput}"`);
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  // Add item to cart
  const addToCart = (product: any, variant?: any) => {
    setErrorMsg(null);
    if (product.stock <= 0) {
      setErrorMsg(`"${product.name}" is out of stock!`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.productId === product.id &&
          (variant ? item.variantId === variant.id : !item.variantId)
      );

      if (existingIdx > -1) {
        const item = prev[existingIdx];
        if (item.quantity + 1 > item.availableStock) {
          setErrorMsg(`Only ${item.availableStock} in stock for ${product.name}`);
          setTimeout(() => setErrorMsg(null), 3000);
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx] = {
          ...item,
          quantity: item.quantity + 1,
        };
        return updated;
      }

      const newItem: CartItem = {
        productId: product.id,
        variantId: variant?.id || null,
        name: variant ? `${product.name} (${variant.name})` : product.name,
        sku: variant?.sku || product.sku,
        barcode: variant?.barcode || product.barcode,
        unit: product.unit || 'pcs',
        purchaseCost: variant?.purchaseCost ?? product.purchaseCost,
        unitPrice: variant?.sellingPrice ?? product.sellingPrice,
        quantity: 1,
        taxRate: product.taxRate || 0,
        discountPercent: 0,
        availableStock: variant?.stock ?? product.stock,
      };

      return [newItem, ...prev];
    });
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    const item = cart[index];
    if (newQty > item.availableStock) {
      setErrorMsg(`Cannot exceed available stock of ${item.availableStock}`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    setCart((prev) => {
      const updated = [...prev];
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const updateItemDiscount = (index: number, discPercent: number) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index].discountPercent = Math.max(0, Math.min(100, discPercent));
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setBillDiscount(0);
    setPaidAmount('');
    setSelectedCustomer(null);
    setNotes('');
  };

  // Calculations
  const calculateCartTotals = () => {
    let subtotal = 0;
    let totalTax = 0;
    let itemDiscounts = 0;

    cart.forEach((item) => {
      const rawPrice = item.unitPrice * item.quantity;
      const discount = (rawPrice * item.discountPercent) / 100;
      const base = rawPrice - discount;
      const tax = (base * item.taxRate) / 100;

      subtotal += base;
      totalTax += tax;
      itemDiscounts += discount;
    });

    const grandTotal = Math.max(0, subtotal + totalTax - Number(billDiscount || 0));

    return {
      subtotal,
      totalTax,
      itemDiscounts,
      grandTotal,
    };
  };

  const totals = calculateCartTotals();

  // Create Invoice / Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMsg('Please add products to cart before billing');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const finalPaid =
        paymentMethod === 'CREDIT'
          ? 0
          : paidAmount === ''
          ? totals.grandTotal
          : Number(paidAmount);

      const payload = {
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        customerPhone: selectedCustomer?.phone || null,
        customerAddress: selectedCustomer?.address || null,
        customerGstin: selectedCustomer?.gstin || null,
        items: cart.map((item) => {
          const rawPrice = item.unitPrice * item.quantity;
          const discount = (rawPrice * item.discountPercent) / 100;
          return {
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            discountAmount: discount,
          };
        }),
        discountAmount: Number(billDiscount) || 0,
        paymentMethod,
        splitDetails: paymentMethod === 'SPLIT' ? splitDetails : null,
        paidAmount: finalPaid,
        notes,
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setCreatedInvoice(json.data.invoice);
        fetchData(); // Refresh product stock
      } else {
        setErrorMsg(json.message || 'Billing transaction failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete transaction');
    } finally {
      setLoading(false);
    }
  };

  // Add customer handler
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name || !newCustomerForm.phone) return;

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomerForm),
      });
      const json = await res.json();
      if (json.success) {
        setCustomers((prev) => [json.data, ...prev]);
        setSelectedCustomer(json.data);
        setShowAddCustomerModal(false);
        setNewCustomerForm({ name: '', phone: '', email: '', address: '', gstin: '' });
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main POS Layout: Left 65% Catalog & Search, Right 35% Active Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Search, Categories & Products (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Top Barcode Gun & Search bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Barcode scanner input */}
            <form onSubmit={handleBarcodeSubmit} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-400">
                <Barcode className="w-4 h-4" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan barcode or type SKU + Enter..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-charcoal-300 rounded-lg text-xs placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 shadow-2xs font-mono"
              />
            </form>

            {/* Product text search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search item by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-charcoal-300 rounded-lg text-xs placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 shadow-2xs"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors',
                selectedCategory === 'ALL'
                  ? 'bg-brand-700 text-white shadow-xs'
                  : 'bg-white text-charcoal-700 border border-charcoal-200 hover:bg-charcoal-50'
              )}
            >
              All Items
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors',
                  selectedCategory === c.id
                    ? 'bg-brand-700 text-white shadow-xs'
                    : 'bg-white text-charcoal-700 border border-charcoal-200 hover:bg-charcoal-50'
                )}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.stock <= 0;
              const isLowStock = p.stock <= p.minStockAlert && !isOutOfStock;

              return (
                <div
                  key={p.id}
                  className={cn(
                    'bg-white border rounded-xl p-3 flex flex-col justify-between shadow-xs transition-all relative group',
                    isOutOfStock
                      ? 'border-charcoal-200 opacity-60 bg-charcoal-50'
                      : 'border-charcoal-200 hover:border-brand-600 hover:shadow-sm cursor-pointer'
                  )}
                  onClick={() => !isOutOfStock && !p.hasVariants && addToCart(p)}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[10px] font-mono text-charcoal-400 uppercase">
                        {p.sku}
                      </span>
                      {isOutOfStock ? (
                        <span className="text-[9px] bg-red-100 text-red-800 font-bold px-1.5 py-0.2 rounded">
                          Out
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                          {p.stock} left
                        </span>
                      ) : (
                        <span className="text-[9px] text-charcoal-500 font-medium">
                          {p.stock} {p.unit}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-semibold text-charcoal-900 mt-1 line-clamp-2 leading-tight">
                      {p.name}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2 border-t border-charcoal-100 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-brand-800">
                        {formatCurrency(p.sellingPrice)}
                      </div>
                      <div className="text-[10px] text-charcoal-400">
                        +{p.taxRate}% GST
                      </div>
                    </div>

                    {p.hasVariants ? (
                      <div className="relative">
                        <select
                          className="text-[11px] bg-charcoal-50 border border-charcoal-300 rounded px-1.5 py-1 text-charcoal-800 focus:ring-1 focus:ring-brand-600"
                          onChange={(e) => {
                            const v = p.variants?.find((vr: any) => vr.id === e.target.value);
                            if (v) addToCart(p, v);
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Select Size
                          </option>
                          {p.variants?.map((v: any) => (
                            <option key={v.id} value={v.id}>
                              {v.name} - ₹{v.sellingPrice}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className="w-7 h-7 rounded-lg bg-brand-50 hover:bg-brand-700 text-brand-700 hover:text-white flex items-center justify-center transition-colors disabled:opacity-40"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Bill & Cart Panel (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-charcoal-200 rounded-xl shadow-xs flex flex-col min-h-[620px]">
          {/* Cart Header */}
          <div className="p-3.5 border-b border-charcoal-200 flex items-center justify-between bg-charcoal-50/60 rounded-t-xl">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-brand-700" />
              <span className="text-xs font-bold text-charcoal-800 uppercase tracking-wider">
                Current Bill ({cart.reduce((s, i) => s + i.quantity, 0)} items)
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Customer Selection Box */}
          <div className="p-3 border-b border-charcoal-200 bg-white">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-charcoal-700">Customer:</span>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(true)}
                className="text-brand-700 hover:underline flex items-center gap-0.5 font-medium text-[11px]"
              >
                <UserPlus className="w-3 h-3" />
                <span>+ New Customer</span>
              </button>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedCustomer?.id || ''}
                onChange={(e) => {
                  const cust = customers.find((c) => c.id === e.target.value);
                  setSelectedCustomer(cust || null);
                }}
                className="w-full text-xs border border-charcoal-300 rounded-lg px-2.5 py-1.5 bg-white text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-600"
              >
                <option value="">Walk-in Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) {c.outstandingBalance > 0 ? `[Bal: ₹${c.outstandingBalance}]` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 divide-y divide-charcoal-100 max-h-[280px]">
            {cart.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-charcoal-400 text-xs">
                <ShoppingCart className="w-8 h-8 stroke-1 mb-2 text-charcoal-300" />
                <span>Cart is empty</span>
                <span className="text-[11px] text-charcoal-400 mt-0.5">
                  Scan barcode or click items to add
                </span>
              </div>
            ) : (
              cart.map((item, index) => {
                const lineTotal =
                  item.unitPrice * item.quantity * (1 - item.discountPercent / 100);
                return (
                  <div key={index} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-charcoal-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-charcoal-500 flex items-center gap-2 mt-0.5">
                        <span>{formatCurrency(item.unitPrice)}</span>
                        <span>•</span>
                        <span>GST: {item.taxRate}%</span>
                        {item.discountPercent > 0 && (
                          <span className="text-emerald-700 font-medium">
                            (-{item.discountPercent}%)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-charcoal-300 rounded-lg overflow-hidden bg-charcoal-50">
                      <button
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="px-2 py-1 text-charcoal-600 hover:bg-charcoal-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.availableStock}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, Number(e.target.value))}
                        className="w-10 text-center text-xs font-semibold bg-white border-x border-charcoal-300 py-0.5 focus:outline-none"
                      />
                      <button
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="px-2 py-1 text-charcoal-600 hover:bg-charcoal-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right w-16">
                      <div className="font-bold text-charcoal-900">
                        {formatCurrency(lineTotal)}
                      </div>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-[10px] text-charcoal-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Payment Method Selector & Totals */}
          <div className="p-3.5 bg-charcoal-50 border-t border-charcoal-200 space-y-3">
            {/* Payment Method Tabs */}
            <div>
              <label className="block text-[11px] font-semibold text-charcoal-600 uppercase tracking-wider mb-1.5">
                Payment Method (Manual Record)
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-medium">
                {(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CREDIT', 'SPLIT'] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m);
                      if (m === 'SPLIT') setShowSplitModal(true);
                    }}
                    className={cn(
                      'py-1.5 px-2 rounded-lg border text-center transition-colors text-[11px]',
                      paymentMethod === m
                        ? 'bg-brand-700 text-white border-brand-700 font-bold shadow-xs'
                        : 'bg-white text-charcoal-700 border-charcoal-300 hover:bg-charcoal-100'
                    )}
                  >
                    {m === 'BANK_TRANSFER' ? 'Transfer' : m}
                  </button>
                ))}
              </div>
            </div>

            {/* Bill Discount & Summary */}
            <div className="space-y-1 text-xs border-t border-charcoal-200 pt-2.5">
              <div className="flex justify-between text-charcoal-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-charcoal-600">
                <span>GST Tax:</span>
                <span>+{formatCurrency(totals.totalTax)}</span>
              </div>

              {/* Bill Discount Input */}
              <div className="flex justify-between items-center text-charcoal-600">
                <span>Bill Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={billDiscount || ''}
                  onChange={(e) => setBillDiscount(Number(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-20 text-right border border-charcoal-300 rounded px-1.5 py-0.5 text-xs focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div className="flex justify-between text-base font-bold text-charcoal-900 border-t border-charcoal-300 pt-1.5 mt-1">
                <span>Payable Amount:</span>
                <span className="text-brand-800 text-lg">
                  {formatCurrency(totals.grandTotal)}
                </span>
              </div>

              {/* Partial Payment Amount Input if not credit/full */}
              {paymentMethod !== 'CREDIT' && paymentMethod !== 'SPLIT' && (
                <div className="flex justify-between items-center pt-1 text-[11px] text-charcoal-600">
                  <span>Paid Amount:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder={`Full (${totals.grandTotal.toFixed(2)})`}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-24 text-right border border-charcoal-300 rounded px-1.5 py-0.5 text-xs font-semibold text-charcoal-800 focus:ring-1 focus:ring-brand-600"
                  />
                </div>
              )}
            </div>

            {/* Complete Billing Button */}
            <button
              type="button"
              disabled={loading || cart.length === 0}
              onClick={handleCheckout}
              className="w-full py-3 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                'Processing Transaction...'
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Generate Invoice ({formatCurrency(totals.grandTotal)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ADD CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-charcoal-200">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-4">
              <h3 className="text-sm font-bold text-charcoal-900">
                Register New Customer
              </h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-charcoal-400 hover:text-charcoal-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustomerForm.name}
                  onChange={(e) =>
                    setNewCustomerForm({ ...newCustomerForm, name: e.target.value })
                  }
                  placeholder="e.g. Ramesh Patel"
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={newCustomerForm.phone}
                  onChange={(e) =>
                    setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })
                  }
                  placeholder="10-digit mobile number"
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  value={newCustomerForm.gstin}
                  onChange={(e) =>
                    setNewCustomerForm({ ...newCustomerForm, gstin: e.target.value })
                  }
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600 uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Address
                </label>
                <textarea
                  rows={2}
                  value={newCustomerForm.address}
                  onChange={(e) =>
                    setNewCustomerForm({ ...newCustomerForm, address: e.target.value })
                  }
                  placeholder="Billing address..."
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-3 py-1.5 border border-charcoal-300 rounded-lg text-charcoal-700 hover:bg-charcoal-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg font-semibold"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPLIT PAYMENT MODAL */}
      {showSplitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-charcoal-200">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-3">
              <h3 className="text-sm font-bold text-charcoal-900">
                Split Payment Breakdown
              </h3>
              <button
                onClick={() => setShowSplitModal(false)}
                className="text-charcoal-400 hover:text-charcoal-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-charcoal-500 mb-3">
              Total Payable: <strong className="text-charcoal-800">{formatCurrency(totals.grandTotal)}</strong>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-charcoal-700 font-semibold mb-1">
                  Cash Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={splitDetails.CASH || ''}
                  onChange={(e) =>
                    setSplitDetails({ ...splitDetails, CASH: Number(e.target.value) || 0 })
                  }
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block text-charcoal-700 font-semibold mb-1">
                  UPI Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={splitDetails.UPI || ''}
                  onChange={(e) =>
                    setSplitDetails({ ...splitDetails, UPI: Number(e.target.value) || 0 })
                  }
                  className="w-full border border-charcoal-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div className="p-2 bg-charcoal-50 rounded-lg text-charcoal-700 flex justify-between font-bold">
                <span>Total Split:</span>
                <span>
                  {formatCurrency((splitDetails.CASH || 0) + (splitDetails.UPI || 0))}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPaidAmount((splitDetails.CASH || 0) + (splitDetails.UPI || 0));
                  setShowSplitModal(false);
                }}
                className="w-full py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg font-bold"
              >
                Confirm Split Amounts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE SUCCESS & PRINT MODAL */}
      {createdInvoice && (
        <InvoiceModal
          invoice={createdInvoice}
          business={business}
          onClose={() => setCreatedInvoice(null)}
          onNewSale={() => {
            setCreatedInvoice(null);
            clearCart();
            barcodeInputRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}
