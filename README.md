# Apex Retail POS & Inventory Management System

A complete, production-ready retail billing, Point-of-Sale (POS), and inventory management web application tailored for retail businesses in India.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and a persistent relational database engine with transactional consistency.

---

## 🌟 Key Features

### 1. Minimal SaaS Design System
- Pure white background, subtle grey borders (`#E2E8F0`), dark charcoal text (`#0F172A`), and muted green accent (`#15803D`).
- Responsive layout with collapsible sidebar, navigation drawer on mobile, and compact top navigation bar.
- High-contrast typography and clear visual indicators for employee ergonomics throughout the day.

### 2. Role-Based Access Control (RBAC) & Authentication
- **Owner (`owner@apexretail.in` / `Admin@123`)**: Complete store access, settings, employee accounts, backup export/restore.
- **Store Manager (`manager@apexretail.in` / `Manager@123`)**: Sales, products, inventory, expenses, reports, refunds & cancellations.
- **Cashier (`cashier@apexretail.in` / `Cashier@123`)**: Fast POS billing, manual payment recording, customer management.
- **Inventory Staff (`inventory@apexretail.in` / `Staff@123`)**: Product catalog, variant stock, purchases, suppliers, and stock movement logs.
- Includes a 1-click **Role Switcher** in the top navigation bar for testing permissions.

### 3. Real-Time Dashboard
- **4 Primary Metric Cards**: Today's Sales, Today's Profit, Total Products, and Outstanding Payments.
- **Sales & Profit Trend Chart**: Recharts area graph tracking gross sales revenue vs. gross profit over the last 7 days.
- **Date Filters**: Today, Yesterday, Last 7 Days, This Month, and Custom Date Range.
- **Recent Transactions & Low-Stock Alerts**: Real-time alerts when inventory drops below safety thresholds.
- **Payment Method Breakdown**: Cash, UPI, Card, Transfer, and Split payment distribution.

### 4. Fast Point of Sale (POS) Billing
- **Barcode & SKU Scanner**: Instant item scan via keyboard gun or simulated search.
- **Category Filter Pills**: Rapid catalog browsing.
- **Item Variant Support**: Size and color selection (e.g., M / L, Navy / Charcoal).
- **Cart Management**: Quantity steppers, line discounts, automatic GST calculation (CGST + SGST).
- **Payment Recording**: Cash, UPI (GPay/PhonePe), Card, Bank Transfer, Credit (Pay Later), and Split payments.
- **Dual Invoice Formats**:
  - **A4 Tax Invoice**: GSTIN, customer details, tax breakdown table, authorized signature.
  - **80mm Thermal Receipt**: Compact thermal memo for receipt printers.
- **Export & Sharing**: Print dialog, WhatsApp invoice share link, and copy summary.
- **Transactional Stock Decrement**: Prevents overselling, records audit trail.

### 5. Products & Inventory Control
- Search, filter by category and stock level (Healthy, Low Stock, Out of Stock), and sorting.
- Add/Edit product details, SKU, EAN/UPC barcode, purchase cost, retail price, GST slab (0%, 5%, 12%, 18%, 28%).
- Product Variants: Multiple sizes and colors with distinct SKUs and stock.
- Stock Adjustment modal with audit reasons (Damage, Spoilage, Audit).
- Stock Movement Audit Log: Timestamps, delta change, user name, and reference invoice numbers.

### 6. Customer Credit & Supplier Purchases
- **Customer Ledger**: Track outstanding credit, purchase history, and direct credit settlement.
- **Supplier & Purchases**: Record bulk purchase consignments, add stock, track supplier balances.

### 7. Operating Expenses & Financial Reports
- **Expense Tracker**: Categorized costs (Rent, Salaries, Electricity, Stationery, Marketing) with Excel export.
- **Reports Module**:
  - **Profit & Loss**: Gross Sales, Tax Collected, Discounts, COGS, Gross Profit, Operating Expenses, Net Profit.
  - **Product Performance**: Top-selling products by revenue and profit margin.
  - **Inventory Valuation**: Total cost valuation vs. retail valuation.
  - **Customer Ledger**: Outstanding balances and billing history.
  - **GSTR-1 Tax Summary**: Taxable turnover and CGST/SGST by slab rate.
  - **Refunds & Cancellations**: Full refund and cancellation audit log.
  - One-click Excel exports (`.xlsx`) for all report types.

### 8. Store Settings & Employee Management
- Business profile, logo, address, GSTIN, currency (₹ INR default).
- Invoice prefix and numbering sequence control.
- Preferred print format toggle (A4 vs. Thermal 80mm).
- Employee account management (add staff, assign roles, toggle active status).
- Full database backup download (JSON) and restore capability.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested with Node.js v24)
- npm 9+

### Running the Application

```bash
# Production server (already built)
npm run start

# Or development mode
npm run dev
```

Terminal is available at: **`http://localhost:3000`**

---

## 🔑 Demo Login Credentials

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Owner** | `owner@apexretail.in` | `Admin@123` | Full access, settings, staff, backups |
| **Manager** | `manager@apexretail.in` | `Manager@123` | Sales, reports, stock, returns, expenses |
| **Cashier** | `cashier@apexretail.in` | `Cashier@123` | POS billing, customers, payments |
| **Inventory** | `inventory@apexretail.in` | `Staff@123` | Products, purchases, supplier ledger |

*(Use the 1-click test buttons on the `/login` screen or the top navigation bar "Switch" dropdown to change roles instantly)*

---

## 📐 Profit Calculation Methodology

$$\text{Net Sales} = \text{Gross Sales Revenue} - \text{Tax Collected (GST)}$$
$$\text{COGS} = \sum (\text{Quantity Sold} \times \text{Historical Item Purchase Cost})$$
$$\text{Gross Profit} = \text{Net Sales} - \text{COGS}$$
$$\text{Net Profit} = \text{Gross Profit} - \text{Total Operating Expenses}$$

*Tax collected is treated as a statutory tax liability to the government, not recognized as revenue. Historical cost snapshots on each invoice item preserve financial accuracy when vendor prices fluctuate.*
