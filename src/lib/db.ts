import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'retail_database.json');

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'INVENTORY';
  phone?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessProfile {
  id: string;
  name: string;
  tagline: string;
  logoUrl?: string | null;
  gstin?: string | null;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  currency: string;
  currencySymbol: string;
  invoicePrefix: string;
  invoiceCounter: number;
  defaultTaxRate: number;
  printPaperSize: 'A4' | 'THERMAL_80MM';
  returnPolicy?: string | null;
  termsAndConditions?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode?: string | null;
  purchaseCost: number;
  sellingPrice: number;
  stock: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  description?: string | null;
  categoryId?: string | null;
  purchaseCost: number;
  sellingPrice: number;
  taxRate: number; // 0, 5, 12, 18, 28
  stock: number;
  minStockAlert: number;
  unit: string;
  imageUrl?: string | null;
  hasVariants: boolean;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  variantId?: string | null;
  type: 'SALE' | 'PURCHASE' | 'RETURN' | 'ADJUSTMENT' | 'INITIAL';
  quantity: number; // +/- delta
  balanceAfter: number;
  unitCost?: number | null;
  reason?: string | null;
  referenceId?: string | null;
  userName?: string | null;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  totalPurchases: number;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  totalPurchases: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  productSku: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  lineTotal: number;
}

export interface Payment {
  id: string;
  invoiceId?: string | null;
  customerId?: string | null;
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT' | 'SPLIT';
  referenceNumber?: string | null;
  notes?: string | null;
  userName?: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  customerGstin?: string | null;
  customerAddress?: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT' | 'SPLIT';
  splitDetails?: { [method: string]: number } | null;
  status: 'COMPLETED' | 'CANCELLED' | 'RETURNED';
  returnReason?: string | null;
  returnedAt?: string | null;
  notes?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  items: InvoiceItem[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  notes?: string | null;
  items: PurchaseItem[];
  createdById?: string | null;
  createdByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  date: string;
  receiptUrl?: string | null;
  createdByName?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userName: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface DatabaseSchema {
  businessProfile: BusinessProfile;
  users: User[];
  categories: Category[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  purchases: Purchase[];
  stockMovements: StockMovement[];
  expenses: Expense[];
  auditLogs: AuditLog[];
}

function generateId(): string {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getInitialDatabase(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();

  const users: User[] = [
    {
      id: 'usr_owner',
      name: 'Rajesh Sharma',
      email: 'owner@apexretail.in',
      passwordHash: bcrypt.hashSync('Admin@123', salt),
      role: 'OWNER',
      phone: '+91 98200 11223',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_manager',
      name: 'Neha Kapoor',
      email: 'manager@apexretail.in',
      passwordHash: bcrypt.hashSync('Manager@123', salt),
      role: 'MANAGER',
      phone: '+91 98200 44556',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_cashier',
      name: 'Vikas Kumar',
      email: 'cashier@apexretail.in',
      passwordHash: bcrypt.hashSync('Cashier@123', salt),
      role: 'CASHIER',
      phone: '+91 98200 77889',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_inventory',
      name: 'Anil Jadhav',
      email: 'inventory@apexretail.in',
      passwordHash: bcrypt.hashSync('Staff@123', salt),
      role: 'INVENTORY',
      phone: '+91 98200 99001',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const businessProfile: BusinessProfile = {
    id: 'default',
    name: 'Apex Supermart & Retail',
    tagline: 'Quality Products & Smart Billing Solutions',
    gstin: '27AABCU9603R1ZM',
    phone: '+91 98765 43210',
    email: 'store@apexretail.in',
    address: 'Shop No. 12-14, Ground Floor, Phoenix Marketcity, Kurla West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400070',
    currency: 'INR',
    currencySymbol: '₹',
    invoicePrefix: 'INV-',
    invoiceCounter: 1046,
    defaultTaxRate: 18.0,
    printPaperSize: 'A4',
    returnPolicy: 'Items in sellable condition with original tags can be exchanged within 7 days.',
    termsAndConditions: 'Thank you for shopping with us! In case of disputes, Mumbai jurisdiction applies.',
    createdAt: now,
    updatedAt: now,
  };

  const categories: Category[] = [
    { id: 'cat_gen', name: 'General', description: 'General retail items', createdAt: now },
    { id: 'cat_groc', name: 'Groceries & Staples', description: 'Grains, pulses, oils and daily essentials', createdAt: now },
    { id: 'cat_elec', name: 'Electronics & Audio', description: 'Cables, chargers, gadgets and accessories', createdAt: now },
    { id: 'cat_app', name: 'Clothing & Apparel', description: 'Shirts, t-shirts, and apparel', createdAt: now },
    { id: 'cat_pc', name: 'Personal Care & Hygiene', description: 'Soaps, handwashes, and personal care', createdAt: now },
    { id: 'cat_home', name: 'Home & Kitchen', description: 'Bottles, utensils, and home storage', createdAt: now },
  ];

  const products: Product[] = [];
  const customers: Customer[] = [];
  const suppliers: Supplier[] = [];
  const invoices: Invoice[] = [];
  const purchases: Purchase[] = [];
  const stockMovements: StockMovement[] = [];
  const expenses: Expense[] = [];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud_1',
      userName: 'System Administrator',
      action: 'SYSTEM_BOOTSTRAP',
      entity: 'DATABASE',
      details: 'Retail POS Database initialized with clean catalog and accounts',
      createdAt: now,
    },
  ];

  return {
    businessProfile,
    users,
    categories,
    products,
    customers,
    suppliers,
    invoices,
    purchases,
    stockMovements,
    expenses,
    auditLogs,
  };
}

export function getDatabase(): DatabaseSchema {
  ensureDataDirectory();
  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch (err) {
    console.error('Error reading DB, re-initializing:', err);
    const initial = getInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

export function saveDatabase(data: DatabaseSchema) {
  ensureDataDirectory();
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

export { generateId };
