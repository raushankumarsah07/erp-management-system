import SalesOrder from '../models/SalesOrder.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';

// Helper to generate next unique order number
const generateOrderNumber = async () => {
  const count = await SalesOrder.countDocuments();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `SO-${dateStr}-${String(count + 1).padStart(4, '0')}`;
};

// @desc    Get all sales orders with pagination & filters
// @route   GET /api/sales-orders
// @access  Private
export const getSalesOrders = async (req, res, next) => {
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
        { orderNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [orders, total] = await Promise.all([
      SalesOrder.find(query)
        .populate('customer', 'name email company phone address')
        .populate('createdBy', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      SalesOrder.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single sales order
// @route   GET /api/sales-orders/:id
// @access  Private
export const getSalesOrderById = async (req, res, next) => {
  try {
    const order = await SalesOrder.findById(req.params.id)
      .populate('customer')
      .populate('createdBy', 'name email')
      .populate('items.product', 'title sku price stock');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create sales order
// @route   POST /api/sales-orders
// @access  Private (Admin, Sales)
export const createSalesOrder = async (req, res, next) => {
  try {
    const { customerId, items, taxRate = 10, discount = 0, shippingAddress, notes } = req.body;

    if (!customerId || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Customer and at least one order item are required',
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Process and validate items
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId || item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId || item.product} not found`,
        });
      }

      const qty = Number(item.quantity);
      const unitPrice = Number(item.unitPrice !== undefined ? item.unitPrice : product.price);
      const itemTotal = qty * unitPrice;

      subtotal += itemTotal;

      processedItems.push({
        product: product._id,
        title: product.title,
        sku: product.sku,
        quantity: qty,
        unitPrice: unitPrice,
        total: itemTotal,
      });
    }

    const calculatedTax = (subtotal * Number(taxRate)) / 100;
    const totalPrice = subtotal + calculatedTax - Number(discount || 0);
    const orderNumber = await generateOrderNumber();

    const order = await SalesOrder.create({
      orderNumber,
      customer: customerId,
      items: processedItems,
      subtotal,
      taxRate: Number(taxRate),
      taxAmount: calculatedTax,
      discount: Number(discount),
      totalPrice: Math.max(0, totalPrice),
      shippingAddress: shippingAddress || (customer.address ? `${customer.address.street || ''} ${customer.address.city || ''}` : ''),
      notes: notes || '',
      createdBy: req.user ? req.user._id : undefined,
    });

    const populatedOrder = await SalesOrder.findById(order._id).populate('customer', 'name email company phone');

    res.status(201).json({
      success: true,
      message: 'Sales order created successfully',
      data: populatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update sales order status
// @route   PUT /api/sales-orders/:id
// @access  Private (Admin, Sales)
export const updateSalesOrder = async (req, res, next) => {
  try {
    const { status, paymentStatus, shippingAddress, notes } = req.body;

    const order = await SalesOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found',
      });
    }

    // If order transitions to delivered or shipped, deduct stock if not already deducted
    if (status && status !== order.status) {
      if (status === 'shipped' || status === 'delivered') {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity },
          });
        }
      }
      order.status = status;
    }

    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (shippingAddress) order.shippingAddress = shippingAddress;
    if (notes !== undefined) order.notes = notes;

    await order.save();

    const updated = await SalesOrder.findById(order._id).populate('customer');

    res.status(200).json({
      success: true,
      message: 'Sales order updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete sales order
// @route   DELETE /api/sales-orders/:id
// @access  Private (Admin)
export const deleteSalesOrder = async (req, res, next) => {
  try {
    const order = await SalesOrder.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sales order deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
