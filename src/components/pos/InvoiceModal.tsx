'use client';

import React, { useState } from 'react';
import {
  Printer,
  Share2,
  X,
  FileText,
  CheckCircle,
  Copy,
  Receipt,
  Download,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { BusinessProfileData } from '@/types';

interface InvoiceModalProps {
  invoice: any;
  business?: BusinessProfileData | null;
  onClose: () => void;
  onNewSale: () => void;
}

export default function InvoiceModal({
  invoice,
  business,
  onClose,
  onNewSale,
}: InvoiceModalProps) {
  const [printFormat, setPrintFormat] = useState<'A4' | 'THERMAL'>(
    (business?.printPaperSize as any) || 'A4'
  );
  const [copied, setCopied] = useState(false);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const storeName = business?.name || 'Apex Retail';
    const total = formatCurrency(invoice.grandTotal);
    const text = encodeURIComponent(
      `Hello ${invoice.customerName || 'Valued Customer'},\n\nThank you for shopping at *${storeName}*.\n\n*Invoice No:* ${invoice.invoiceNumber}\n*Date:* ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}\n*Grand Total:* ${total}\n*Payment Status:* ${invoice.paymentStatus}\n\nFor any queries, please call us at ${business?.phone || ''}.\nHave a wonderful day!`
    );
    const phone = invoice.customerPhone ? invoice.customerPhone.replace(/\D/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = () => {
    const text = `Invoice #${invoice.invoiceNumber} - Total: ${formatCurrency(invoice.grandTotal)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      {/* Container */}
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Action Toolbar (Never Printed) */}
        <div className="no-print p-4 bg-charcoal-50 border-b border-charcoal-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-charcoal-800">
                Invoice {invoice.invoiceNumber} Generated
              </span>
              <p className="text-[11px] text-charcoal-500">
                Payment: <strong className="text-charcoal-800">{invoice.paymentStatus}</strong> via {invoice.paymentMethod}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle */}
            <div className="flex items-center bg-white border border-charcoal-300 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPrintFormat('A4')}
                className={`px-2.5 py-1 rounded font-medium ${
                  printFormat === 'A4'
                    ? 'bg-brand-700 text-white shadow-xs'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                A4 Tax Invoice
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('THERMAL')}
                className={`px-2.5 py-1 rounded font-medium ${
                  printFormat === 'THERMAL'
                    ? 'bg-brand-700 text-white shadow-xs'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                80mm Thermal
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill</span>
            </button>

            {/* WhatsApp Share */}
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-charcoal-400 hover:text-charcoal-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white print:p-0">
          {printFormat === 'A4' ? (
            /* ========================================================
               A4 PROFESSIONAL GST TAX INVOICE FORMAT
               ======================================================== */
            <div className="max-w-3xl mx-auto border border-charcoal-300 print:border-black rounded-lg p-6 sm:p-8 bg-white text-charcoal-900 text-xs">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-charcoal-300 pb-5">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-charcoal-900 uppercase">
                    {business?.name || 'Apex Supermart & Retail'}
                  </h1>
                  <p className="text-xs text-charcoal-600 font-medium">
                    {business?.tagline || 'Quality Products & Smart Billing'}
                  </p>
                  <p className="text-[11px] text-charcoal-600 mt-1 max-w-sm">
                    {business?.address}, {business?.city}, {business?.state} - {business?.pincode}
                  </p>
                  <p className="text-[11px] text-charcoal-600">
                    Phone: {business?.phone} • Email: {business?.email}
                  </p>
                  <p className="text-[11px] font-bold text-charcoal-800 mt-0.5">
                    GSTIN: {business?.gstin || '27AABCU9603R1ZM'}
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-block bg-charcoal-100 print:bg-transparent px-3 py-1 rounded text-xs font-bold uppercase tracking-wider text-charcoal-800 border border-charcoal-300">
                    TAX INVOICE
                  </div>
                  <div className="mt-3 text-xs">
                    <span className="text-charcoal-500 font-medium">Invoice No:</span>{' '}
                    <strong className="text-charcoal-900 font-bold text-sm">
                      {invoice.invoiceNumber}
                    </strong>
                  </div>
                  <div className="text-xs text-charcoal-600">
                    <span className="text-charcoal-500 font-medium">Date & Time:</span>{' '}
                    <span>{formatDateTime(invoice.createdAt)}</span>
                  </div>
                  <div className="text-xs text-charcoal-600">
                    <span className="text-charcoal-500 font-medium">Cashier:</span>{' '}
                    <span>{invoice.createdByName || 'Terminal 1'}</span>
                  </div>
                </div>
              </div>

              {/* Customer / Billed To Section */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-charcoal-300 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-charcoal-400 tracking-wider">
                    Billed To:
                  </span>
                  <div className="font-bold text-sm text-charcoal-900 mt-0.5">
                    {invoice.customerName || 'Walk-in Customer'}
                  </div>
                  {invoice.customerPhone && (
                    <div className="text-charcoal-600 mt-0.5">
                      Phone: +91 {invoice.customerPhone}
                    </div>
                  )}
                  {invoice.customerAddress && (
                    <div className="text-charcoal-600 mt-0.5">
                      {invoice.customerAddress}
                    </div>
                  )}
                  {invoice.customerGstin && (
                    <div className="font-semibold text-charcoal-800 mt-0.5">
                      Customer GSTIN: {invoice.customerGstin}
                    </div>
                  )}
                </div>

                <div className="text-right flex flex-col justify-end">
                  <div className="text-xs">
                    <span className="text-charcoal-500">Payment Channel:</span>{' '}
                    <strong className="uppercase text-charcoal-800">
                      {invoice.paymentMethod}
                    </strong>
                  </div>
                  <div className="text-xs">
                    <span className="text-charcoal-500">Payment Status:</span>{' '}
                    <strong
                      className={
                        invoice.paymentStatus === 'PAID'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }
                    >
                      {invoice.paymentStatus}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-charcoal-300 bg-charcoal-50 font-bold text-charcoal-800">
                      <th className="py-2 px-2 text-center w-8">#</th>
                      <th className="py-2 px-2">Item Description</th>
                      <th className="py-2 px-2">SKU</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-2 text-right">Unit Price</th>
                      <th className="py-2 px-2 text-right">Taxable</th>
                      <th className="py-2 px-2 text-center">GST %</th>
                      <th className="py-2 px-2 text-right">Tax Amt</th>
                      <th className="py-2 px-2 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal-200">
                    {invoice.items.map((item: any, idx: number) => {
                      const taxable = item.lineTotal - item.taxAmount;
                      return (
                        <tr key={item.id || idx}>
                          <td className="py-2 px-2 text-center font-medium text-charcoal-500">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-2 font-semibold text-charcoal-900">
                            {item.productName}
                          </td>
                          <td className="py-2 px-2 text-charcoal-500 font-mono text-[11px]">
                            {item.productSku}
                          </td>
                          <td className="py-2 px-2 text-center font-semibold">
                            {item.quantity}
                          </td>
                          <td className="py-2 px-2 text-right">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="py-2 px-2 text-right">
                            {formatCurrency(taxable)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {item.taxRate}%
                          </td>
                          <td className="py-2 px-2 text-right">
                            {formatCurrency(item.taxAmount)}
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-charcoal-900">
                            {formatCurrency(item.lineTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation & GST Split */}
              <div className="mt-4 pt-4 border-t-2 border-charcoal-300 grid grid-cols-2 gap-6">
                {/* GST Split Box */}
                <div className="border border-charcoal-200 rounded p-3 bg-charcoal-50/50">
                  <span className="font-bold text-[11px] text-charcoal-700 uppercase tracking-wider block mb-1">
                    GST Summary Breakdown
                  </span>
                  <div className="space-y-1 text-[11px] text-charcoal-600">
                    <div className="flex justify-between">
                      <span>Central GST (CGST):</span>
                      <span className="font-semibold">{formatCurrency(invoice.taxAmount / 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>State GST (SGST):</span>
                      <span className="font-semibold">{formatCurrency(invoice.taxAmount / 2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-charcoal-200 pt-1 text-charcoal-800">
                      <span>Total Tax Amount:</span>
                      <span>{formatCurrency(invoice.taxAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Final Total Computations */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-charcoal-600">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {invoice.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Total Discount:</span>
                      <span>-{formatCurrency(invoice.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-charcoal-600">
                    <span>Applicable GST:</span>
                    <span className="font-medium">+{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-charcoal-900 border-t-2 border-charcoal-300 pt-1.5 mt-1.5">
                    <span>Grand Total:</span>
                    <span className="text-brand-800 font-extrabold">
                      {formatCurrency(invoice.grandTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-charcoal-600 pt-1 text-[11px]">
                    <span>Amount Paid:</span>
                    <span className="font-semibold text-charcoal-800">
                      {formatCurrency(invoice.paidAmount)}
                    </span>
                  </div>
                  {invoice.balanceAmount > 0 && (
                    <div className="flex justify-between text-amber-800 font-bold pt-0.5 text-xs">
                      <span>Outstanding Balance Owed:</span>
                      <span>{formatCurrency(invoice.balanceAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Terms & Signature */}
              <div className="mt-8 pt-4 border-t border-charcoal-300 flex justify-between items-end text-[11px] text-charcoal-500">
                <div className="max-w-md space-y-1">
                  <p className="font-semibold text-charcoal-700">
                    Terms & Return Policy:
                  </p>
                  <p>{business?.returnPolicy || 'Exchange within 7 days with invoice.'}</p>
                  <p>{business?.termsAndConditions || 'Thank you for your business!'}</p>
                </div>

                <div className="text-center w-48">
                  <div className="h-10 border-b border-charcoal-400 mb-1" />
                  <span className="font-semibold text-charcoal-700">
                    Authorized Signatory
                  </span>
                  <div className="text-[10px] text-charcoal-400">
                    {business?.name}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================
               80MM THERMAL RECEIPT FORMAT (Compact retail standard)
               ======================================================== */
            <div className="max-w-xs mx-auto bg-white p-4 border border-charcoal-300 rounded font-mono text-[11px] leading-tight text-black">
              <div className="text-center space-y-1 mb-3">
                <div className="font-bold text-sm uppercase">{business?.name}</div>
                <div>{business?.address}</div>
                <div>Ph: {business?.phone}</div>
                <div className="font-bold">GSTIN: {business?.gstin}</div>
                <div className="border-t border-dashed border-black my-2" />
                <div className="font-bold">*** RETAIL CASH MEMO ***</div>
                <div className="text-[10px]">
                  Bill No: {invoice.invoiceNumber} • {new Date(invoice.createdAt).toLocaleDateString('en-IN')}
                </div>
                <div>Customer: {invoice.customerName}</div>
                <div className="border-t border-dashed border-black my-2" />
              </div>

              {/* Items */}
              <div className="space-y-1.5">
                {invoice.items.map((item: any, i: number) => (
                  <div key={i}>
                    <div className="font-bold">{item.productName}</div>
                    <div className="flex justify-between text-[10px]">
                      <span>
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </span>
                      <span className="font-bold">{formatCurrency(item.lineTotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Totals */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tax (GST):</span>
                  <span>{formatCurrency(invoice.taxAmount)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(invoice.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span>Paid ({invoice.paymentMethod}):</span>
                  <span>{formatCurrency(invoice.paidAmount)}</span>
                </div>
                {invoice.balanceAmount > 0 && (
                  <div className="flex justify-between font-bold text-[11px]">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(invoice.balanceAmount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-black my-3" />

              <div className="text-center space-y-1 text-[10px]">
                <div>Total Items: {invoice.items.length}</div>
                <div className="font-semibold">*** THANK YOU! VISIT AGAIN ***</div>
                <div>{business?.returnPolicy}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="no-print p-4 bg-charcoal-50 border-t border-charcoal-200 flex justify-between items-center">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs text-charcoal-600 hover:text-charcoal-900"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Summary Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            type="button"
            onClick={onNewSale}
            className="px-5 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            + Create Next Bill (Enter)
          </button>
        </div>
      </div>
    </div>
  );
}
