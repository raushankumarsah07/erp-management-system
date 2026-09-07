import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';

// Helper to generate next unique PO number
const generatePONumber = async () => {
  const count = await PurchaseOrder.countDocuments();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `PO-${dateStr}-${String(count + 1).padStart(4, '0')}`;
};

// @desc    Get all purchase orders
// @route   GET /api/purchase-orders
// @access  Private
export const getPurchaseOrders = async (req, res, next) => {
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
        { poNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [orders, total] = await Promise.all([
      PurchaseOrder.find(query)
        .populate('supplier', 'name email company phone paymentTerms')
        .populate('createdBy', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      PurchaseOrder.countDocuments(query),
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

// @desc    Get single purchase order
// @route   GET /api/purchase-orders/:id
// @access  Private
export const getPurchaseOrderById = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id)
      .populate('supplier')
      .populate('createdBy', 'name email')
      .populate('items.product', 'title sku price costPrice stock');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found',
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

// @desc    Create purchase order
// @route   POST /api/purchase-orders
// @access  Private (Admin, Purchase)
export const createPurchaseOrder = async (req, res, next) => {
  try {
    const { supplierId, items, expectedDeliveryDate, notes } = req.body;

    if (!supplierId || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Supplier and at least one item are required',
      });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

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
      const unitPrice = Number(item.unitPrice !== undefined ? item.unitPrice : (product.costPrice || product.price));
      const itemTotal = qty * unitPrice;

      subtotal += itemTotal;

      processedItems.push({
        product: product._id,
        title: product.title,
        sku: product.sku,
        quantity: qty,
        unitPrice: unitPrice,
        total: itemTotal,
        receivedQuantity: 0,
      });
    }

    const taxAmount = (subtotal * 10) / 100;
    const totalAmount = subtotal + taxAmount;
    const poNumber = await generatePONumber();

    const order = await PurchaseOrder.create({
      poNumber,
      supplier: supplierId,
      items: processedItems,
      subtotal,
      taxAmount,
      totalAmount,
      status: 'ordered',
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
      notes: notes || '',
      createdBy: req.user ? req.user._id : undefined,
    });

    const populated = await PurchaseOrder.findById(order._id).populate('supplier', 'name email company');

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update purchase order status
// @route   PUT /api/purchase-orders/:id
// @access  Private (Admin, Purchase)
export const updatePurchaseOrder = async (req, res, next) => {
  try {
    const { status, notes, expectedDeliveryDate } = req.body;

    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found',
      });
    }

    if (status) order.status = status;
    if (notes !== undefined) order.notes = notes;
    if (expectedDeliveryDate) order.expectedDeliveryDate = new Date(expectedDeliveryDate);

    await order.save();

    const updated = await PurchaseOrder.findById(order._id).populate('supplier');

    res.status(200).json({
      success: true,
      message: 'Purchase order updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete purchase order
// @route   DELETE /api/purchase-orders/:id
// @access  Private (Admin)
export const deletePurchaseOrder = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Purchase order deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
