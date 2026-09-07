import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'General',
    },
    price: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      default: 0,
      min: 0,
    },
    reorderLevel: {
      type: Number,
      required: [true, 'Reorder level is required'],
      default: 10,
      min: 0,
    },
    unit: {
      type: String,
      default: 'pcs',
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['in_stock', 'low_stock', 'out_of_stock'],
      default: 'in_stock',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-update status before saving
productSchema.pre('save', function (next) {
  if (this.stock <= 0) {
    this.status = 'out_of_stock';
  } else if (this.stock <= this.reorderLevel) {
    this.status = 'low_stock';
  } else {
    this.status = 'in_stock';
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;
