const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with realistic retail data...');

  // 1. Business Profile
  await prisma.businessProfile.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Apex Supermart & Retail',
      tagline: 'Your Trusted Daily Store for Everything',
      gstin: '27AABCU9603R1ZM',
      phone: '+91 98765 43210',
      email: 'store@apexretail.in',
      address: 'Shop No. 12-14, Ground Floor, Phoenix Marketcity',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400070',
      currency: 'INR',
      currencySymbol: '₹',
      invoicePrefix: 'INV-',
      invoiceCounter: 1045,
      defaultTaxRate: 18.0,
      printPaperSize: 'A4',
      returnPolicy: 'Exchange within 7 days with original invoice and tags intact.',
      termsAndConditions: 'Thank you for shopping with us! For queries WhatsApp: +91 98765 43210',
    },
  });

  // 2. Users (Owner, Manager, Cashier, Inventory Staff)
  const salt = await bcrypt.genSalt(10);
  const ownerPassword = await bcrypt.hash('Admin@123', salt);
  const managerPassword = await bcrypt.hash('Manager@123', salt);
  const cashierPassword = await bcrypt.hash('Cashier@123', salt);
  const inventoryPassword = await bcrypt.hash('Staff@123', salt);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@apexretail.in' },
    update: {},
    create: {
      name: 'Rajesh Sharma (Owner)',
      email: 'owner@apexretail.in',
      passwordHash: ownerPassword,
      role: 'OWNER',
      phone: '+91 98200 11223',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@apexretail.in' },
    update: {},
    create: {
      name: 'Neha Kapoor (Store Manager)',
      email: 'manager@apexretail.in',
      passwordHash: managerPassword,
      role: 'MANAGER',
      phone: '+91 98200 44556',
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@apexretail.in' },
    update: {},
    create: {
      name: 'Vikas Kumar (Cashier)',
      email: 'cashier@apexretail.in',
      passwordHash: cashierPassword,
      role: 'CASHIER',
      phone: '+91 98200 77889',
    },
  });

  const inventoryStaff = await prisma.user.upsert({
    where: { email: 'inventory@apexretail.in' },
    update: {},
    create: {
      name: 'Anil Jadhav (Inventory)',
      email: 'inventory@apexretail.in',
      passwordHash: inventoryPassword,
      role: 'INVENTORY',
      phone: '+91 98200 99001',
    },
  });

  // 3. Categories
  const catGroceries = await prisma.category.upsert({
    where: { name: 'Groceries & Staples' },
    update: {},
    create: { name: 'Groceries & Staples', description: 'Grains, oils, pulses, and pantry essentials' },
  });

  const catElectronics = await prisma.category.upsert({
    where: { name: 'Electronics & Accessories' },
    update: {},
    create: { name: 'Electronics & Accessories', description: 'Cables, chargers, audio, and gadgets' },
  });

  const catApparel = await prisma.category.upsert({
    where: { name: 'Clothing & Apparel' },
    update: {},
    create: { name: 'Clothing & Apparel', description: 'Shirts, t-shirts, and daily wear' },
  });

  const catPersonal = await prisma.category.upsert({
    where: { name: 'Personal Care & Hygiene' },
    update: {},
    create: { name: 'Personal Care & Hygiene', description: 'Soaps, handwashes, sanitizers, and care' },
  });

  const catHome = await prisma.category.upsert({
    where: { name: 'Home & Kitchen' },
    update: {},
    create: { name: 'Home & Kitchen', description: 'Bottles, utensils, and home storage' },
  });

  // 4. Products
  const p1 = await prisma.product.upsert({
    where: { sku: 'GRO-RICE-001' },
    update: {},
    create: {
      name: 'Daawat Rozana Gold Basmati Rice 5kg',
      sku: 'GRO-RICE-001',
      barcode: '8901234001011',
      description: 'Long grain aromatic basmati rice for daily delicacies',
      categoryId: catGroceries.id,
      purchaseCost: 340.0,
      sellingPrice: 460.0,
      taxRate: 5.0,
      stock: 45,
      minStockAlert: 10,
      unit: 'pack',
      hasVariants: false,
    },
  });

  const p2 = await prisma.product.upsert({
    where: { sku: 'GRO-OIL-002' },
    update: {},
    create: {
      name: 'Fortune Kachi Ghani Mustard Oil 1L Pouch',
      sku: 'GRO-OIL-002',
      barcode: '8901234001028',
      description: 'Pure cold pressed mustard oil with rich aroma',
      categoryId: catGroceries.id,
      purchaseCost: 118.0,
      sellingPrice: 155.0,
      taxRate: 5.0,
      stock: 8, // Low stock on purpose to trigger dashboard alerts!
      minStockAlert: 15,
      unit: 'ltr',
      hasVariants: false,
    },
  });

  const p3 = await prisma.product.upsert({
    where: { sku: 'GRO-DAL-003' },
    update: {},
    create: {
      name: 'Tata Sampann Organic Tur Dal 1kg',
      sku: 'GRO-DAL-003',
      barcode: '8901234001035',
      description: 'Unpolished protein-rich pigeon peas',
      categoryId: catGroceries.id,
      purchaseCost: 135.0,
      sellingPrice: 175.0,
      taxRate: 0.0,
      stock: 35,
      minStockAlert: 8,
      unit: 'kg',
      hasVariants: false,
    },
  });

  const p4 = await prisma.product.upsert({
    where: { sku: 'ELE-CBL-004' },
    update: {},
    create: {
      name: 'Portronics 65W Type-C Fast Charging Braided Cable 1.5m',
      sku: 'ELE-CBL-004',
      barcode: '8901234001042',
      description: 'High-speed PD compatible nylon braided sync cable',
      categoryId: catElectronics.id,
      purchaseCost: 140.0,
      sellingPrice: 299.0,
      taxRate: 18.0,
      stock: 28,
      minStockAlert: 5,
      unit: 'pcs',
      hasVariants: false,
    },
  });

  const p5 = await prisma.product.upsert({
    where: { sku: 'ELE-TWS-005' },
    update: {},
    create: {
      name: 'boAt Airdopes 141 True Wireless Earbuds',
      sku: 'ELE-TWS-005',
      barcode: '8901234001059',
      description: '42H playtime, ENx noise cancellation, Beast mode low latency',
      categoryId: catElectronics.id,
      purchaseCost: 750.0,
      sellingPrice: 1299.0,
      taxRate: 18.0,
      stock: 4, // Low stock on purpose!
      minStockAlert: 8,
      unit: 'pcs',
      hasVariants: false,
    },
  });

  const p6 = await prisma.product.upsert({
    where: { sku: 'HOM-BTL-006' },
    update: {},
    create: {
      name: 'Milton Thermosteel Flip Lid 1000ml Bottle',
      sku: 'HOM-BTL-006',
      barcode: '8901234001066',
      description: '24 hours hot and cold insulated stainless steel flask',
      categoryId: catHome.id,
      purchaseCost: 480.0,
      sellingPrice: 799.0,
      taxRate: 12.0,
      stock: 18,
      minStockAlert: 5,
      unit: 'pcs',
      hasVariants: false,
    },
  });

  const p7 = await prisma.product.upsert({
    where: { sku: 'PER-HW-007' },
    update: {},
    create: {
      name: 'Dettol Liquid Handwash Refill 750ml Germ Protection',
      sku: 'PER-HW-007',
      barcode: '8901234001073',
      description: 'Skincare moisture formula with 99.9% germ defense',
      categoryId: catPersonal.id,
      purchaseCost: 92.0,
      sellingPrice: 139.0,
      taxRate: 18.0,
      stock: 52,
      minStockAlert: 12,
      unit: 'pack',
      hasVariants: false,
    },
  });

  const p8 = await prisma.product.upsert({
    where: { sku: 'GRO-TEA-008' },
    update: {},
    create: {
      name: 'Tetley Pure Green Tea Bags Box of 100',
      sku: 'GRO-TEA-008',
      barcode: '8901234001080',
      description: 'Rich in antioxidants, zero calories without milk and sugar',
      categoryId: catGroceries.id,
      purchaseCost: 280.0,
      sellingPrice: 420.0,
      taxRate: 5.0,
      stock: 22,
      minStockAlert: 6,
      unit: 'box',
      hasVariants: false,
    },
  });

  // Product with Variants: Cotton Casual Shirt
  const p9 = await prisma.product.upsert({
    where: { sku: 'APP-SHT-009' },
    update: {},
    create: {
      name: 'Classic Oxford Cotton Casual Shirt',
      sku: 'APP-SHT-009',
      barcode: '8901234001097',
      description: '100% combed cotton regular fit full-sleeve shirt',
      categoryId: catApparel.id,
      purchaseCost: 450.0,
      sellingPrice: 899.0,
      taxRate: 12.0,
      stock: 30,
      minStockAlert: 8,
      unit: 'pcs',
      hasVariants: true,
      variants: {
        create: [
          { name: 'Navy Blue / M (38)', sku: 'APP-SHT-009-NV-M', barcode: '890123400911', purchaseCost: 450.0, sellingPrice: 899.0, stock: 8 },
          { name: 'Navy Blue / L (40)', sku: 'APP-SHT-009-NV-L', barcode: '890123400912', purchaseCost: 450.0, sellingPrice: 899.0, stock: 10 },
          { name: 'Charcoal Grey / M (38)', sku: 'APP-SHT-009-CG-M', barcode: '890123400913', purchaseCost: 450.0, sellingPrice: 899.0, stock: 5 },
          { name: 'Charcoal Grey / L (40)', sku: 'APP-SHT-009-CG-L', barcode: '890123400914', purchaseCost: 450.0, sellingPrice: 899.0, stock: 7 },
        ]
      }
    },
  });

  // 5. Customers
  const cust1 = await prisma.customer.upsert({
    where: { phone: '9820198201' },
    update: {},
    create: {
      name: 'Rahul Sharma',
      phone: '9820198201',
      email: 'rahul.sharma@gmail.com',
      address: 'Flat 402, Sea View Apartments, Bandra West, Mumbai',
      totalPurchases: 6850.0,
      outstandingBalance: 1200.0, // Credit balance
    },
  });

  const cust2 = await prisma.customer.upsert({
    where: { phone: '9833445566' },
    update: {},
    create: {
      name: 'Priya Patel',
      phone: '9833445566',
      email: 'priya.patel@hotmail.com',
      address: 'B-12, Green Park Society, Andheri East, Mumbai',
      totalPurchases: 4520.0,
      outstandingBalance: 0.0,
    },
  });

  const cust3 = await prisma.customer.upsert({
    where: { phone: '9769012345' },
    update: {},
    create: {
      name: 'Amit Verma (Catering Hub)',
      phone: '9769012345',
      email: 'amit@vermacaterers.com',
      address: 'Plot 55, MIDC Industrial Area, Kurla West',
      gstin: '27AACCA2244P1ZU',
      totalPurchases: 18400.0,
      outstandingBalance: 3450.0, // Credit balance
    },
  });

  const cust4 = await prisma.customer.upsert({
    where: { phone: '9920112233' },
    update: {},
    create: {
      name: 'Sunita Rao',
      phone: '9920112233',
      email: 'sunita.rao@yahoo.com',
      address: 'Flat 101, Palm Court, Ghatkopar East',
      totalPurchases: 2150.0,
      outstandingBalance: 0.0,
    },
  });

  // 6. Suppliers
  const sup1 = await prisma.supplier.upsert({
    where: { id: 'sup-metro' },
    update: {},
    create: {
      id: 'sup-metro',
      name: 'Metro Cash & Carry India Ltd',
      contactPerson: 'Suresh Menon',
      phone: '+91 22 2847 9000',
      email: 'orders.mumbai@metrocash.in',
      address: 'Bhandup Industrial Area, LBS Marg, Mumbai',
      gstin: '27AABCM3312R1ZZ',
      totalPurchases: 145000.0,
      balance: 12500.0,
    },
  });

  const sup2 = await prisma.supplier.upsert({
    where: { id: 'sup-techvibe' },
    update: {},
    create: {
      id: 'sup-techvibe',
      name: 'TechVibe Electronics Distribution',
      contactPerson: 'Dinesh Agarwal',
      phone: '+91 98210 99887',
      email: 'sales@techvibe.in',
      address: 'Lamington Road, Grant Road, Mumbai',
      gstin: '27AAACT9901M1ZQ',
      totalPurchases: 85000.0,
      balance: 0.0,
    },
  });

  const sup3 = await prisma.supplier.upsert({
    where: { id: 'sup-textile' },
    update: {},
    create: {
      id: 'sup-textile',
      name: 'Surat Fashion Textiles & Garments',
      contactPerson: 'Mahesh Solanki',
      phone: '+91 94260 55443',
      email: 'solanki.surat@textiles.co.in',
      address: 'Millennium Textile Market, Ring Road, Surat',
      gstin: '24AAECS7711B1ZX',
      totalPurchases: 62000.0,
      balance: 5400.0,
    },
  });

  // 7. Seed Initial Invoices (Today, Yesterday, Last few days)
  const today = new Date();
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000);
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 3600 * 1000);

  // Invoice 1 - Today (Completed, Paid by UPI)
  const inv1 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-1040' },
    update: {},
    create: {
      invoiceNumber: 'INV-1040',
      customerId: cust1.id,
      customerName: cust1.name,
      customerPhone: cust1.phone,
      subtotal: 1374.0,
      taxAmount: 85.0,
      discountAmount: 50.0,
      grandTotal: 1409.0,
      paidAmount: 1409.0,
      balanceAmount: 0.0,
      paymentStatus: 'PAID',
      paymentMethod: 'UPI',
      status: 'COMPLETED',
      createdById: cashier.id,
      createdAt: new Date(today.getTime() - 2 * 3600 * 1000),
      items: {
        create: [
          {
            productId: p1.id,
            productName: p1.name,
            productSku: p1.sku,
            quantity: 2,
            unitCost: p1.purchaseCost,
            unitPrice: p1.sellingPrice,
            taxRate: p1.taxRate,
            taxAmount: 43.8,
            discountAmount: 20.0,
            lineTotal: 900.0,
          },
          {
            productId: p4.id,
            productName: p4.name,
            productSku: p4.sku,
            quantity: 1,
            unitCost: p4.purchaseCost,
            unitPrice: p4.sellingPrice,
            taxRate: p4.taxRate,
            taxAmount: 41.2,
            discountAmount: 30.0,
            lineTotal: 509.0,
          },
        ],
      },
      payments: {
        create: [
          {
            customerId: cust1.id,
            amount: 1409.0,
            paymentMethod: 'UPI',
            referenceNumber: 'UPI/6291039481/GPay',
            notes: 'Paid via Google Pay scan',
            createdAt: new Date(today.getTime() - 2 * 3600 * 1000),
          },
        ],
      },
    },
  });

  // Invoice 2 - Today (Split Payment: Cash + UPI)
  const inv2 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-1041' },
    update: {},
    create: {
      invoiceNumber: 'INV-1041',
      customerId: cust2.id,
      customerName: cust2.name,
      customerPhone: cust2.phone,
      subtotal: 1299.0,
      taxAmount: 198.15,
      discountAmount: 100.0,
      grandTotal: 1397.15,
      paidAmount: 1397.15,
      balanceAmount: 0.0,
      paymentStatus: 'PAID',
      paymentMethod: 'SPLIT',
      splitDetails: JSON.stringify({ cash: 500, upi: 897.15 }),
      status: 'COMPLETED',
      createdById: cashier.id,
      createdAt: new Date(today.getTime() - 1 * 3600 * 1000),
      items: {
        create: [
          {
            productId: p5.id,
            productName: p5.name,
            productSku: p5.sku,
            quantity: 1,
            unitCost: p5.purchaseCost,
            unitPrice: p5.sellingPrice,
            taxRate: p5.taxRate,
            taxAmount: 198.15,
            discountAmount: 100.0,
            lineTotal: 1397.15,
          },
        ],
      },
      payments: {
        create: [
          {
            customerId: cust2.id,
            amount: 500.0,
            paymentMethod: 'CASH',
            notes: 'Split payment - Cash portion',
            createdAt: new Date(today.getTime() - 1 * 3600 * 1000),
          },
          {
            customerId: cust2.id,
            amount: 897.15,
            paymentMethod: 'UPI',
            referenceNumber: 'PhonePe/77102941',
            notes: 'Split payment - UPI portion',
            createdAt: new Date(today.getTime() - 1 * 3600 * 1000),
          },
        ],
      },
    },
  });

  // Invoice 3 - Today (Credit / Partial Payment)
  const inv3 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-1042' },
    update: {},
    create: {
      invoiceNumber: 'INV-1042',
      customerId: cust3.id,
      customerName: cust3.name,
      customerPhone: cust3.phone,
      subtotal: 4450.0,
      taxAmount: 220.0,
      discountAmount: 150.0,
      grandTotal: 4520.0,
      paidAmount: 2000.0,
      balanceAmount: 2520.0,
      paymentStatus: 'PARTIAL',
      paymentMethod: 'CREDIT',
      status: 'COMPLETED',
      notes: 'Balance ₹2520 to be settled in next billing cycle',
      createdById: cashier.id,
      createdAt: new Date(today.getTime() - 30 * 60 * 1000),
      items: {
        create: [
          {
            productId: p1.id,
            productName: p1.name,
            productSku: p1.sku,
            quantity: 5,
            unitCost: p1.purchaseCost,
            unitPrice: p1.sellingPrice,
            taxRate: p1.taxRate,
            taxAmount: 110.0,
            discountAmount: 100.0,
            lineTotal: 2310.0,
          },
          {
            productId: p3.id,
            productName: p3.name,
            productSku: p3.sku,
            quantity: 10,
            unitCost: p3.purchaseCost,
            unitPrice: p3.sellingPrice,
            taxRate: p3.taxRate,
            taxAmount: 0.0,
            discountAmount: 50.0,
            lineTotal: 1700.0,
          },
          {
            productId: p8.id,
            productName: p8.name,
            productSku: p8.sku,
            quantity: 1,
            unitCost: p8.purchaseCost,
            unitPrice: p8.sellingPrice,
            taxRate: p8.taxRate,
            taxAmount: 20.0,
            discountAmount: 0.0,
            lineTotal: 440.0,
          },
        ],
      },
      payments: {
        create: [
          {
            customerId: cust3.id,
            amount: 2000.0,
            paymentMethod: 'CASH',
            notes: 'Advance cash payment against bill',
            createdAt: new Date(today.getTime() - 30 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Invoice 4 - Yesterday (Paid by Card)
  const inv4 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-1038' },
    update: {},
    create: {
      invoiceNumber: 'INV-1038',
      customerId: cust4.id,
      customerName: cust4.name,
      customerPhone: cust4.phone,
      subtotal: 1697.0,
      taxAmount: 185.0,
      discountAmount: 50.0,
      grandTotal: 1832.0,
      paidAmount: 1832.0,
      balanceAmount: 0.0,
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
      status: 'COMPLETED',
      createdById: cashier.id,
      createdAt: yesterday,
      items: {
        create: [
          {
            productId: p6.id,
            productName: p6.name,
            productSku: p6.sku,
            quantity: 2,
            unitCost: p6.purchaseCost,
            unitPrice: p6.sellingPrice,
            taxRate: p6.taxRate,
            taxAmount: 171.0,
            discountAmount: 50.0,
            lineTotal: 1719.0,
          },
          {
            productId: p7.id,
            productName: p7.name,
            productSku: p7.sku,
            quantity: 1,
            unitCost: p7.purchaseCost,
            unitPrice: p7.sellingPrice,
            taxRate: p7.taxRate,
            taxAmount: 21.0,
            discountAmount: 0.0,
            lineTotal: 160.0,
          },
        ],
      },
      payments: {
        create: [
          {
            customerId: cust4.id,
            amount: 1832.0,
            paymentMethod: 'CARD',
            referenceNumber: 'HDFC-POS-882190',
            notes: 'HDFC Bank Visa debit card swipe',
            createdAt: yesterday,
          },
        ],
      },
    },
  });

  // Invoice 5 - Returned/Refunded example
  const inv5 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-1035' },
    update: {},
    create: {
      invoiceNumber: 'INV-1035',
      customerName: 'Kunal Singhal',
      customerPhone: '9819001122',
      subtotal: 799.0,
      taxAmount: 85.0,
      discountAmount: 0.0,
      grandTotal: 884.0,
      paidAmount: 884.0,
      balanceAmount: 0.0,
      paymentStatus: 'PAID',
      paymentMethod: 'CASH',
      status: 'RETURNED',
      returnReason: 'Customer requested size exchange / defective cap returned',
      returnedAt: new Date(Date.now() - 12 * 3600 * 1000),
      createdById: manager.id,
      createdAt: threeDaysAgo,
      items: {
        create: [
          {
            productId: p6.id,
            productName: p6.name,
            productSku: p6.sku,
            quantity: 1,
            unitCost: p6.purchaseCost,
            unitPrice: p6.sellingPrice,
            taxRate: p6.taxRate,
            taxAmount: 85.0,
            discountAmount: 0.0,
            lineTotal: 884.0,
          },
        ],
      },
    },
  });

  // 8. Realistic Expenses
  await prisma.expense.createMany({
    data: [
      {
        category: 'Rent',
        description: 'Retail Shop Monthly Rent for November',
        amount: 35000.0,
        paymentMethod: 'BANK_TRANSFER',
        date: new Date(Date.now() - 6 * 24 * 3600 * 1000),
      },
      {
        category: 'Electricity',
        description: 'Store Electricity Bill (Adani Electricity)',
        amount: 6420.0,
        paymentMethod: 'UPI',
        date: new Date(Date.now() - 4 * 24 * 3600 * 1000),
      },
      {
        category: 'Stationery',
        description: 'Thermal Paper Rolls 80mm (Pack of 50) & barcode labels',
        amount: 1450.0,
        paymentMethod: 'CASH',
        date: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      },
      {
        category: 'Salaries',
        description: 'Staff overtime allowance and incentive payout',
        amount: 8000.0,
        paymentMethod: 'BANK_TRANSFER',
        date: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      },
      {
        category: 'Marketing',
        description: 'Local Diwali promotion pamphlets & WhatsApp broadcast',
        amount: 2200.0,
        paymentMethod: 'UPI',
        date: new Date(),
      },
    ],
  });

  // 9. Initial Purchases from Suppliers
  const pur1 = await prisma.purchase.upsert({
    where: { purchaseNumber: 'PUR-2026-001' },
    update: {},
    create: {
      purchaseNumber: 'PUR-2026-001',
      supplierId: sup1.id,
      totalAmount: 18500.0,
      paidAmount: 18500.0,
      balanceAmount: 0.0,
      status: 'COMPLETED',
      notes: 'Bulk stock replenishment for staples',
      createdById: inventoryStaff.id,
      createdAt: fiveDaysAgo,
      items: {
        create: [
          {
            productId: p1.id,
            productName: p1.name,
            quantity: 50,
            unitCost: 340.0,
            lineTotal: 17000.0,
          },
          {
            productId: p3.id,
            productName: p3.name,
            quantity: 10,
            unitCost: 135.0,
            lineTotal: 1350.0,
          },
        ],
      },
    },
  });

  // 10. Audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        userName: 'Rajesh Sharma (Owner)',
        action: 'STORE_CONFIGURED',
        entity: 'SETTINGS',
        details: 'Initial GST and store parameters configured',
      },
      {
        userName: 'Anil Jadhav (Inventory)',
        action: 'STOCK_PURCHASED',
        entity: 'PURCHASE',
        entityId: 'PUR-2026-001',
        details: 'Received purchase consignment from Metro Cash & Carry',
      },
      {
        userName: 'Vikas Kumar (Cashier)',
        action: 'INVOICE_GENERATED',
        entity: 'INVOICE',
        entityId: 'INV-1040',
        details: 'Invoice INV-1040 completed via UPI for ₹1409',
      },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
