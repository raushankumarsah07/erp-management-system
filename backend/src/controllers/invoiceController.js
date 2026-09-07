import Invoice from '../models/Invoice.js';
import SalesOrder from '../models/SalesOrder.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';

// Helper to generate next unique invoice number
const generateInvoiceNumber = async () => {
  const count = await Invoice.countDocuments();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `INV-${dateStr}-${String(count + 1).padStart(4, '0')}`;
};

// @desc    Get all invoices with pagination & filters
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('customer', 'name email company phone address')
        .populate('salesOrder', 'orderNumber status createdAt')
        .populate('createdBy', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Invoice.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('salesOrder')
      .populate('createdBy', 'name email')
      .populate('items.product', 'title sku price');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create invoice (either standalone or from SalesOrder)
// @route   POST /api/invoices
// @access  Private (Admin, Sales, Finance)
export const createInvoice = async (req, res, next) => {
  try {
    const { salesOrderId, customerId, items, dueDate, paymentMethod = 'bank_transfer', taxRate = 10, discount = 0, notes } = req.body;

    let targetCustomerId = customerId;
    let targetItems = [];
    let subtotal = 0;

    if (salesOrderId) {
      const salesOrder = await SalesOrder.findById(salesOrderId).populate('items.product');
      if (!salesOrder) {
        return res.status(404).json({
          success: false,
          message: 'Sales Order not found',
        });
      }

      targetCustomerId = salesOrder.customer;
      targetItems = salesOrder.items.map((item) => ({
        product: item.product?._id || item.product,
        title: item.title,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      }));
      subtotal = salesOrder.subtotal;

      salesOrder.invoiced = true;
      await salesOrder.save();
    } else {
      if (!customerId || !items || !items.length) {
        return res.status(400).json({
          success: false,
          message: 'Customer and items are required when creating a standalone invoice',
        });
      }

      for (const item of items) {
        const product = await Product.findById(item.productId || item.product);
        const qty = Number(item.quantity);
        const unitPrice = Number(item.unitPrice !== undefined ? item.unitPrice : (product ? product.price : 0));
        const itemTotal = qty * unitPrice;
        subtotal += itemTotal;

        targetItems.push({
          product: product ? product._id : undefined,
          title: item.title || (product ? product.title : 'Item'),
          sku: item.sku || (product ? product.sku : ''),
          quantity: qty,
          unitPrice: unitPrice,
          total: itemTotal,
        });
      }
    }

    const calculatedTax = (subtotal * Number(taxRate)) / 100;
    const totalAmount = subtotal + calculatedTax - Number(discount || 0);
    const invoiceNumber = await generateInvoiceNumber();

    // Default due date to 15 days from now if not specified
    const finalDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const invoice = await Invoice.create({
      invoiceNumber,
      salesOrder: salesOrderId || undefined,
      customer: targetCustomerId,
      items: targetItems,
      subtotal,
      taxRate: Number(taxRate),
      taxAmount: calculatedTax,
      discount: Number(discount),
      totalAmount: Math.max(0, totalAmount),
      status: 'unpaid',
      dueDate: finalDueDate,
      paymentMethod,
      notes: notes || '',
      createdBy: req.user ? req.user._id : undefined,
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('customer', 'name email company phone address')
      .populate('salesOrder', 'orderNumber');

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice status (mark as paid, etc.)
// @route   PUT /api/invoices/:id
// @access  Private (Admin, Finance, Sales)
export const updateInvoice = async (req, res, next) => {
  try {
    const { status, paymentMethod, paymentDate, notes, dueDate } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    if (status) {
      invoice.status = status;
      if (status === 'paid' && !invoice.paymentDate) {
        invoice.paymentDate = new Date();
      }
    }

    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (paymentDate) invoice.paymentDate = new Date(paymentDate);
    if (notes !== undefined) invoice.notes = notes;
    if (dueDate) invoice.dueDate = new Date(dueDate);

    await invoice.save();

    // If invoice is linked to sales order and status is paid, update sales order paymentStatus
    if (invoice.salesOrder && invoice.status === 'paid') {
      await SalesOrder.findByIdAndUpdate(invoice.salesOrder, { paymentStatus: 'paid' });
    }

    const updated = await Invoice.findById(invoice._id).populate('customer').populate('salesOrder');

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private (Admin)
export const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
