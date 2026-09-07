import express from 'express';
import { body } from 'express-validator';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
} from '../controllers/productController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

router.use(protect);

router.get('/alerts/low-stock', getLowStockProducts);

router.route('/')
  .get(getProducts)
  .post(
    authorize('admin', 'inventory'),
    [
      body('title').notEmpty().withMessage('Product title is required'),
      body('sku').notEmpty().withMessage('SKU is required'),
      body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
      body('stock').isInt({ min: 0 }).withMessage('Stock must be 0 or greater'),
      validate,
    ],
    createProduct
  );

router.route('/:id')
  .get(getProductById)
  .put(authorize('admin', 'inventory'), updateProduct)
  .delete(authorize('admin'), deleteProduct);

export default router;
