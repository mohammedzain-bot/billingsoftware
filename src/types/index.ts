export type UserRole = 'OWNER' | 'MANAGER' | 'CASHIER' | 'INVENTORY';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT' | 'SPLIT';
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';
export type InvoiceStatus = 'COMPLETED' | 'CANCELLED' | 'RETURNED';

export interface BusinessProfileData {
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
}

export interface CartItem {
  productId: string;
  variantId?: string | null;
  name: string;
  sku: string;
  barcode?: string | null;
  unit: string;
  purchaseCost: number;
  unitPrice: number;
  quantity: number;
  taxRate: number; // e.g. 5, 12, 18
  discountPercent: number; // item-level discount %
  availableStock: number;
}
