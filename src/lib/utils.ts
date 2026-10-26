import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStringOrDate: string | Date | undefined | null): string {
  if (!dateStringOrDate) return '-';
  const d = new Date(dateStringOrDate);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStringOrDate: string | Date | undefined | null): string {
  if (!dateStringOrDate) return '-';
  const d = new Date(dateStringOrDate);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// Calculate Indian GST breakdown (CGST + SGST for intrastate, or IGST)
export function calculateTaxBreakdown(taxableAmount: number, taxRate: number, isInterstate = false) {
  const taxAmount = (taxableAmount * taxRate) / 100;
  if (isInterstate) {
    return {
      igstRate: taxRate,
      igstAmount: taxAmount,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      totalTax: taxAmount,
    };
  }
  const halfRate = taxRate / 2;
  const halfTax = taxAmount / 2;
  return {
    igstRate: 0,
    igstAmount: 0,
    cgstRate: halfRate,
    cgstAmount: halfTax,
    sgstRate: halfRate,
    sgstAmount: halfTax,
    totalTax: taxAmount,
  };
}
