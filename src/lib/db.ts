import fs from 'fs';
import path from 'path';
import os from 'os';
import bcrypt from 'bcryptjs';

// In-memory global cache so serverless functions reuse data without constant disk access
const globalForDb = global as unknown as { cachedDb?: DatabaseSchema };

function getStoragePaths() {
  const isVercel = Boolean(process.env.VERCEL) || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

  // Try local project directory first if not running in a serverless environment
  if (!isVercel) {
    try {
      const localDataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(localDataDir)) {
        fs.mkdirSync(localDataDir, { recursive: true });
      }
      const testFile = path.join(localDataDir, '.write_test');
      fs.writeFileSync(testFile, 'ok');
      fs.unlinkSync(testFile);
      return {
        dataDir: localDataDir,
        dbFile: path.join(localDataDir, 'retail_database.json'),
        seedFile: path.join(localDataDir, 'retail_database.json'),
      };
    } catch {
      // Local dir is read-only, fallback to tmpdir below
    }
  }

  // Serverless / Vercel: /tmp is the only writable directory in Lambda
  const tmpDir = os.tmpdir();
  const bundledSeed = path.join(process.cwd(), 'data', 'retail_database.json');
  return {
    dataDir: tmpDir,
    dbFile: path.join(tmpDir, 'retail_database.json'),
    seedFile: bundledSeed,
  };
}

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
  const { dataDir } = getStoragePaths();
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch (err) {
    console.warn('Could not ensure data directory:', err);
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
  // Return cached in-memory database if already loaded in this process
  if (globalForDb.cachedDb) {
    return globalForDb.cachedDb;
  }

  const { dbFile, seedFile } = getStoragePaths();
  ensureDataDirectory();

  // 1. Try reading existing database from writable location
  if (fs.existsSync(dbFile)) {
    try {
      const raw = fs.readFileSync(dbFile, 'utf-8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      globalForDb.cachedDb = parsed;
      return parsed;
    } catch (err) {
      console.warn('Error reading dbFile, checking fallback:', err);
    }
  }

  // 2. If not found in writable path, try loading bundled seed from repository
  if (seedFile && fs.existsSync(seedFile)) {
    try {
      const raw = fs.readFileSync(seedFile, 'utf-8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      globalForDb.cachedDb = parsed;
      try {
        fs.writeFileSync(dbFile, raw, 'utf-8');
      } catch (e) {
        console.warn('Could not mirror seed to dbFile:', e);
      }
      return parsed;
    } catch (err) {
      console.warn('Error reading seedFile:', err);
    }
  }

  // 3. Fallback to clean default initial database
  const initial = getInitialDatabase();
  globalForDb.cachedDb = initial;
  try {
    fs.writeFileSync(dbFile, JSON.stringify(initial, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write initial DB to disk (running in-memory):', err);
  }
  return initial;
}

export function saveDatabase(data: DatabaseSchema) {
  // Always update in-memory state immediately
  globalForDb.cachedDb = data;

  const { dbFile } = getStoragePaths();
  ensureDataDirectory();

  const tempFile = `${dbFile}.tmp`;
  try {
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, dbFile);
  } catch (err) {
    console.warn('Atomic file write failed, trying direct write:', err);
    try {
      fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e2) {
      console.warn('Direct file write also failed (data preserved in memory):', e2);
    }
  }
}

export { generateId };
