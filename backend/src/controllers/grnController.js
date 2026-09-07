import GRN from '../models/GRN.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';

// Helper to generate next unique GRN number
const generateGRNNumber = async () => {
  const count = await GRN.countDocuments();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `GRN-${dateStr}-${String(count + 1).padStart(4, '0')}`;
};

// @desc    Get all GRN records with pagination & filters
// @route   GET /api/grn
// @access  Private
export const getGRNs = async (req, res, next) => {
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
      query.grnNumber = { $regex: search, $options: 'i' };
    }

    const [grns, total] = await Promise.all([
      GRN.find(query)
        .populate('purchaseOrder', 'poNumber totalAmount status createdAt')
        .populate('supplier', 'name email company')
        .populate('receivedBy', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      GRN.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: grns.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: grns,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single GRN record
// @route   GET /api/grn/:id
// @access  Private
export const getGRNById = async (req, res, next) => {
  try {
    const grn = await GRN.findById(req.params.id)
      .populate('purchaseOrder')
      .populate('supplier')
      .populate('receivedBy', 'name email')
      .populate('receivedItems.product', 'title sku stock reorderLevel');

    if (!grn) {
      return res.status(404).json({
        success: false,
        message: 'Goods Receipt Note not found',
      });
    }

    res.status(200).json({
      success: true,
      data: grn,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Goods Receipt Note (GRN) linked to Purchase Order
// @route   POST /api/grn
// @access  Private (Admin, Inventory, Purchase)
export const createGRN = async (req, res, next) => {
  try {
    const { purchaseOrderId, receivedItems, status = 'accepted', notes } = req.body;

    if (!purchaseOrderId || !receivedItems || !receivedItems.length) {
      return res.status(400).json({
        success: false,
        message: 'Purchase order ID and received items are required',
      });
    }

    const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId);
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase Order not found',
      });
    }

    const processedItems = [];
    let allReceivedFully = true;

    for (const item of receivedItems) {
      const product = await Product.findById(item.productId || item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.productId || item.product} not found`,
        });
      }

      const orderedQty = Number(item.orderedQuantity);
      const receivedQty = Number(item.receivedQuantity);
      const acceptedQty = Number(item.acceptedQuantity !== undefined ? item.acceptedQuantity : receivedQty);
      const rejectedQty = Number(item.rejectedQuantity || (receivedQty - acceptedQty));

      if (acceptedQty < orderedQty) {
        allReceivedFully = false;
      }

      // If status is accepted, automatically increment product stock
      if (status === 'accepted' || status === 'partially_accepted') {
        product.stock += acceptedQty;
        await product.save();
      }

      processedItems.push({
        product: product._id,
        title: product.title,
        sku: product.sku,
        orderedQuantity: orderedQty,
        receivedQuantity: receivedQty,
        acceptedQuantity: acceptedQty,
        rejectedQuantity: rejectedQty,
        batchNumber: item.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
        remarks: item.remarks || '',
      });
    }

    const grnNumber = await generateGRNNumber();

    const grn = await GRN.create({
      grnNumber,
      purchaseOrder: purchaseOrder._id,
      supplier: purchaseOrder.supplier,
      receivedItems: processedItems,
      status: status,
      stockUpdated: status === 'accepted' || status === 'partially_accepted',
      notes: notes || '',
      receivedBy: req.user ? req.user._id : undefined,
    });

    // Update Purchase Order status
    purchaseOrder.grnGenerated = true;
    purchaseOrder.status = allReceivedFully ? 'received' : 'partially_received';
    await purchaseOrder.save();

    const populatedGRN = await GRN.findById(grn._id)
      .populate('purchaseOrder', 'poNumber totalAmount')
      .populate('supplier', 'name company email');

    res.status(201).json({
      success: true,
      message: 'Goods Receipt Note created and inventory stock updated successfully',
      data: populatedGRN,
    });
  } catch (error) {
    next(error);
  }
};
