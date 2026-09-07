import mongoose from 'mongoose';

const grnItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    default: '',
  },
  orderedQuantity: {
    type: Number,
    required: true,
  },
  receivedQuantity: {
    type: Number,
    required: true,
    min: 0,
  },
  acceptedQuantity: {
    type: Number,
    required: true,
    min: 0,
  },
  rejectedQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  batchNumber: {
    type: String,
    default: '',
  },
  remarks: {
    type: String,
    default: '',
  },
});

const grnSchema = new mongoose.Schema(
  {
    grnNumber: {
      type: String,
      required: true,
      unique: true,
    },
    purchaseOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: [true, 'Purchase Order link is required'],
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    receivedItems: [grnItemSchema],
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending_inspection', 'accepted', 'partially_accepted', 'rejected'],
      default: 'accepted',
    },
    stockUpdated: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: '',
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const GRN = mongoose.model('GRN', grnSchema);
export default GRN;
