import Product from '../models/Product.js';

// @desc    Get all products with pagination, search, filter
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const status = req.query.status || '';
    const lowStock = req.query.lowStock === 'true';

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (lowStock) {
      query.$expr = { $lte: ['$stock', '$reorderLevel'] };
    }

    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin, Inventory)
export const createProduct = async (req, res, next) => {
  try {
    const { title, sku, category, price, costPrice, stock, reorderLevel, unit, description } = req.body;

    const existingSKU = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingSKU) {
      return res.status(400).json({
        success: false,
        message: `Product with SKU '${sku.toUpperCase()}' already exists`,
      });
    }

    const product = await Product.create({
      title,
      sku: sku.toUpperCase(),
      category: category || 'General',
      price: Number(price),
      costPrice: Number(costPrice || 0),
      stock: Number(stock || 0),
      reorderLevel: Number(reorderLevel || 10),
      unit: unit || 'pcs',
      description: description || '',
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin, Inventory)
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (req.body.sku && req.body.sku.toUpperCase() !== product.sku) {
      const existingSKU = await Product.findOne({ sku: req.body.sku.toUpperCase() });
      if (existingSKU) {
        return res.status(400).json({
          success: false,
          message: `Product with SKU '${req.body.sku.toUpperCase()}' already exists`,
        });
      }
      product.sku = req.body.sku.toUpperCase();
    }

    if (req.body.title) product.title = req.body.title;
    if (req.body.category) product.category = req.body.category;
    if (req.body.price !== undefined) product.price = Number(req.body.price);
    if (req.body.costPrice !== undefined) product.costPrice = Number(req.body.costPrice);
    if (req.body.stock !== undefined) product.stock = Number(req.body.stock);
    if (req.body.reorderLevel !== undefined) product.reorderLevel = Number(req.body.reorderLevel);
    if (req.body.unit) product.unit = req.body.unit;
    if (req.body.description !== undefined) product.description = req.body.description;

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock summary
// @route   GET /api/products/alerts/low-stock
// @access  Private
export const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stock', '$reorderLevel'] },
    }).sort({ stock: 1 }).limit(10);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};
