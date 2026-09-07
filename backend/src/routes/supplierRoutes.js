import express from 'express';
import { body } from 'express-validator';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplierController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getSuppliers)
  .post(
    authorize('admin', 'purchase'),
    [
      body('name').notEmpty().withMessage('Supplier name is required'),
      body('email').isEmail().withMessage('Valid supplier email is required'),
      body('phone').notEmpty().withMessage('Supplier phone is required'),
      validate,
    ],
    createSupplier
  );

router.route('/:id')
  .get(getSupplierById)
  .put(authorize('admin', 'purchase'), updateSupplier)
  .delete(authorize('admin'), deleteSupplier);

export default router;
