import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import SalesOrder from '../models/SalesOrder.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import GRN from '../models/GRN.js';
import Invoice from '../models/Invoice.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/erp_management';

const seedDatabase = async () => {
  try {
    console.log('[Seeder] Connecting to MongoDB at', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('[Seeder] Connected successfully.');

    // Clear existing data
    console.log('[Seeder] Clearing old records...');
    await Promise.all([
      User.deleteMany(),
      Product.deleteMany(),
      Customer.deleteMany(),
      Supplier.deleteMany(),
      SalesOrder.deleteMany(),
      PurchaseOrder.deleteMany(),
      GRN.deleteMany(),
      Invoice.deleteMany(),
    ]);

    // 1. Create Users for all roles
    console.log('[Seeder] Creating users...');
    const users = await User.create([
      {
        name: 'Alexander Wright (Admin)',
        email: 'admin@erp.com',
        password: 'password123',
        role: 'admin',
        department: 'Executive Management',
        phone: '+1 (555) 019-2834',
        status: 'active',
      },
      {
        name: 'Sarah Jenkins (Sales Rep)',
        email: 'sales@erp.com',
        password: 'password123',
        role: 'sales',
        department: 'Sales & Marketing',
        phone: '+1 (555) 019-5821',
        status: 'active',
      },
      {
        name: 'David Miller (Procurement)',
        email: 'purchase@erp.com',
        password: 'password123',
        role: 'purchase',
        department: 'Supply Chain',
        phone: '+1 (555) 019-9482',
        status: 'active',
      },
      {
        name: 'Elena Rostova (Warehouse)',
        email: 'inventory@erp.com',
        password: 'password123',
        role: 'inventory',
        department: 'Logistics & Inventory',
        phone: '+1 (555) 019-1123',
        status: 'active',
      },
      {
        name: 'Marcus Chen (Finance)',
        email: 'finance@erp.com',
        password: 'password123',
        role: 'finance',
        department: 'Accounting',
        phone: '+1 (555) 019-4491',
        status: 'active',
      },
    ]);

    const adminUser = users[0];
    const salesUser = users[1];
    const purchaseUser = users[2];
    const inventoryUser = users[3];

    // 2. Create Products
    console.log('[Seeder] Creating products...');
    const products = await Product.create([
      {
        title: 'Industrial Heavy Duty Drill',
        sku: 'PWR-DRL-001',
        category: 'Power Tools',
        price: 249.99,
        costPrice: 150.00,
        stock: 45,
        reorderLevel: 15,
        unit: 'pcs',
        description: '18V Brushless cordless drill with variable speed trigger.',
      },
      {
        title: 'Precision Laser Measurement Device',
        sku: 'MSR-LSR-002',
        category: 'Measurement',
        price: 129.50,
        costPrice: 75.00,
        stock: 8,
        reorderLevel: 12,
        unit: 'pcs',
        description: '60-meter high accuracy laser distance meter.',
      },
      {
        title: 'Steel Safety Helmet (ANSI Certified)',
        sku: 'PPE-HLM-003',
        category: 'Safety Equipment',
        price: 34.00,
        costPrice: 18.00,
        stock: 120,
        reorderLevel: 30,
        unit: 'pcs',
        description: 'Impact-resistant construction hard hat with ventilation.',
      },
      {
        title: 'Hydraulic Floor Jack 3-Ton',
        sku: 'HYD-JCK-004',
        category: 'Machinery',
        price: 380.00,
        costPrice: 240.00,
        stock: 4,
        reorderLevel: 8,
        unit: 'pcs',
        description: 'Dual pump rapid lift low profile car floor jack.',
      },
      {
        title: 'High-Torque Impact Wrench Set',
        sku: 'PWR-WRC-005',
        category: 'Power Tools',
        price: 199.99,
        costPrice: 120.00,
        stock: 22,
        reorderLevel: 10,
        unit: 'sets',
        description: '1/2-inch cordless impact wrench with socket attachments.',
      },
      {
        title: 'Heavy Duty Workbench 72-Inch',
        sku: 'WRK-BNH-006',
        category: 'Storage & Workstations',
        price: 599.00,
        costPrice: 380.00,
        stock: 2,
        reorderLevel: 5,
        unit: 'units',
        description: 'Solid hardwood top workbench with steel legs and drawers.',
      },
    ]);

    // 3. Create Customers
    console.log('[Seeder] Creating customers...');
    const customers = await Customer.create([
      {
        name: 'Apex Industrial Solutions',
        company: 'Apex Industries Inc.',
        contact: 'Robert Taylor',
        email: 'orders@apexindustrial.com',
        phone: '+1 (555) 234-5678',
        address: {
          street: '100 Industrial Parkway',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60607',
          country: 'USA',
        },
        taxNumber: 'TX-982341-IL',
        balance: 4500.00,
        status: 'active',
      },
      {
        name: 'Vanguard Contracting & Builds',
        company: 'Vanguard Builders LLC',
        contact: 'Samantha Green',
        email: 'procure@vanguardbuilds.com',
        phone: '+1 (555) 345-6789',
        address: {
          street: '450 North Harbor Dr',
          city: 'Seattle',
          state: 'WA',
          zipCode: '98101',
          country: 'USA',
        },
        taxNumber: 'TX-448192-WA',
        balance: 1200.00,
        status: 'active',
      },
      {
        name: 'Summit Engineering Works',
        company: 'Summit Works Corp',
        contact: 'Liam O’Connor',
        email: 'contact@summitworks.io',
        phone: '+1 (555) 890-1234',
        address: {
          street: '88 Tech Boulevard',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          country: 'USA',
        },
        taxNumber: 'TX-109283-TX',
        balance: 0,
        status: 'active',
      },
    ]);

    // 4. Create Suppliers
    console.log('[Seeder] Creating suppliers...');
    const suppliers = await Supplier.create([
      {
        name: 'Global Machineries Corp',
        company: 'Global Machineries Inc.',
        contact: 'Klaus Schmidt',
        email: 'sales@globalmachineries.com',
        phone: '+1 (555) 678-9012',
        address: {
          street: '250 Factory Lane',
          city: 'Detroit',
          state: 'MI',
          zipCode: '48201',
          country: 'USA',
        },
        taxNumber: 'SUP-991823-MI',
        paymentTerms: 'Net 30',
        status: 'active',
      },
      {
        name: 'Titanium Hardware & Fasteners',
        company: 'Titanium Hardware Ltd',
        contact: 'Mei Ling',
        email: 'supply@titaniumhard.com',
        phone: '+1 (555) 789-0123',
        address: {
          street: '550 Pacific Commerce Way',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'USA',
        },
        taxNumber: 'SUP-442819-CA',
        paymentTerms: 'Net 15',
        status: 'active',
      },
    ]);

    // 5. Create Sales Orders
    console.log('[Seeder] Creating sales orders...');
    const salesOrder1 = await SalesOrder.create({
      orderNumber: 'SO-20250901-0001',
      customer: customers[0]._id,
      items: [
        {
          product: products[0]._id,
          title: products[0].title,
          sku: products[0].sku,
          quantity: 4,
          unitPrice: 249.99,
          total: 999.96,
        },
        {
          product: products[2]._id,
          title: products[2].title,
          sku: products[2].sku,
          quantity: 10,
          unitPrice: 34.00,
          total: 340.00,
        },
      ],
      subtotal: 1339.96,
      taxRate: 10,
      taxAmount: 134.00,
      discount: 0,
      totalPrice: 1473.96,
      status: 'approved',
      paymentStatus: 'paid',
      shippingAddress: '100 Industrial Parkway, Chicago, IL 60607',
      notes: 'Urgent delivery requested for Site 4.',
      createdBy: salesUser._id,
      invoiced: true,
    });

    const salesOrder2 = await SalesOrder.create({
      orderNumber: 'SO-20250903-0002',
      customer: customers[1]._id,
      items: [
        {
          product: products[4]._id,
          title: products[4].title,
          sku: products[4].sku,
          quantity: 3,
          unitPrice: 199.99,
          total: 599.97,
        },
      ],
      subtotal: 599.97,
      taxRate: 10,
      taxAmount: 60.00,
      discount: 20.00,
      totalPrice: 639.97,
      status: 'pending',
      paymentStatus: 'unpaid',
      shippingAddress: '450 North Harbor Dr, Seattle, WA 98101',
      notes: 'Customer discount coupon applied.',
      createdBy: salesUser._id,
      invoiced: false,
    });

    // 6. Create Purchase Orders
    console.log('[Seeder] Creating purchase orders...');
    const purchaseOrder1 = await PurchaseOrder.create({
      poNumber: 'PO-20250820-0001',
      supplier: suppliers[0]._id,
      items: [
        {
          product: products[1]._id,
          title: products[1].title,
          sku: products[1].sku,
          quantity: 15,
          unitPrice: 75.00,
          total: 1125.00,
          receivedQuantity: 15,
        },
        {
          product: products[3]._id,
          title: products[3].title,
          sku: products[3].sku,
          quantity: 5,
          unitPrice: 240.00,
          total: 1200.00,
          receivedQuantity: 5,
        },
      ],
      subtotal: 2325.00,
      taxAmount: 232.50,
      totalAmount: 2557.50,
      status: 'received',
      expectedDeliveryDate: new Date('2025-08-28'),
      notes: 'Scheduled monthly restock batch.',
      createdBy: purchaseUser._id,
      grnGenerated: true,
    });

    const purchaseOrder2 = await PurchaseOrder.create({
      poNumber: 'PO-20250905-0002',
      supplier: suppliers[1]._id,
      items: [
        {
          product: products[5]._id,
          title: products[5].title,
          sku: products[5].sku,
          quantity: 5,
          unitPrice: 380.00,
          total: 1900.00,
          receivedQuantity: 0,
        },
      ],
      subtotal: 1900.00,
      taxAmount: 190.00,
      totalAmount: 2090.00,
      status: 'ordered',
      expectedDeliveryDate: new Date('2025-09-15'),
      notes: 'Workbench restocking batch.',
      createdBy: purchaseUser._id,
      grnGenerated: false,
    });

    // 7. Create Goods Receipt Note (GRN)
    console.log('[Seeder] Creating GRN record...');
    await GRN.create({
      grnNumber: 'GRN-20250828-0001',
      purchaseOrder: purchaseOrder1._id,
      supplier: suppliers[0]._id,
      receivedItems: [
        {
          product: products[1]._id,
          title: products[1].title,
          sku: products[1].sku,
          orderedQuantity: 15,
          receivedQuantity: 15,
          acceptedQuantity: 15,
          rejectedQuantity: 0,
          batchNumber: 'BAT-202508-892',
          remarks: 'All 15 laser units passed calibration test.',
        },
        {
          product: products[3]._id,
          title: products[3].title,
          sku: products[3].sku,
          orderedQuantity: 5,
          receivedQuantity: 5,
          acceptedQuantity: 5,
          rejectedQuantity: 0,
          batchNumber: 'BAT-202508-441',
          remarks: 'Hydraulic seals inspected and certified.',
        },
      ],
      receivedDate: new Date('2025-08-28'),
      status: 'accepted',
      stockUpdated: true,
      notes: 'Warehouse delivery received by dock 2.',
      receivedBy: inventoryUser._id,
    });

    // 8. Create Invoices
    console.log('[Seeder] Creating invoices...');
    await Invoice.create({
      invoiceNumber: 'INV-20250901-0001',
      salesOrder: salesOrder1._id,
      customer: customers[0]._id,
      items: [
        {
          product: products[0]._id,
          title: products[0].title,
          sku: products[0].sku,
          quantity: 4,
          unitPrice: 249.99,
          total: 999.96,
        },
        {
          product: products[2]._id,
          title: products[2].title,
          sku: products[2].sku,
          quantity: 10,
          unitPrice: 34.00,
          total: 340.00,
        },
      ],
      subtotal: 1339.96,
      taxRate: 10,
      taxAmount: 134.00,
      discount: 0,
      totalAmount: 1473.96,
      status: 'paid',
      issueDate: new Date('2025-09-01'),
      dueDate: new Date('2025-09-16'),
      paymentMethod: 'bank_transfer',
      paymentDate: new Date('2025-09-03'),
      notes: 'Payment settled via ACH Transfer Ref #992384.',
      createdBy: adminUser._id,
    });

    await Invoice.create({
      invoiceNumber: 'INV-20250904-0002',
      customer: customers[1]._id,
      items: [
        {
          product: products[4]._id,
          title: products[4].title,
          sku: products[4].sku,
          quantity: 3,
          unitPrice: 199.99,
          total: 599.97,
        },
      ],
      subtotal: 599.97,
      taxRate: 10,
      taxAmount: 60.00,
      discount: 20.00,
      totalAmount: 639.97,
      status: 'unpaid',
      issueDate: new Date('2025-09-04'),
      dueDate: new Date('2025-09-19'),
      paymentMethod: 'credit_card',
      notes: 'Net 15 terms apply.',
      createdBy: adminUser._id,
    });

    console.log('--------------------------------------------------');
    console.log('✅ Database Seeding Completed Successfully!');
    console.log('--------------------------------------------------');
    console.log('Demo Credentials for Login:');
    console.log('  👑 Admin:     admin@erp.com     / password123');
    console.log('  💼 Sales:     sales@erp.com     / password123');
    console.log('  📦 Purchase:  purchase@erp.com  / password123');
    console.log('  🏭 Inventory: inventory@erp.com / password123');
    console.log('  💵 Finance:   finance@erp.com   / password123');
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder Error:', error);
    process.exit(1);
  }
};

seedDatabase();
