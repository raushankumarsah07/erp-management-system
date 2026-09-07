import express from 'express';
import { body } from 'express-validator';
import {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from '../controllers/purchaseOrderController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getPurchaseOrders)
  .post(
    authorize('admin', 'purchase'),
    [
      body('supplierId').notEmpty().withMessage('Supplier ID is required'),
      body('items').isArray({ min: 1 }).withMessage('At least one item is required in order'),
      validate,
    ],
    createPurchaseOrder
  );

router.route('/:id')
  .get(getPurchaseOrderById)
  .put(authorize('admin', 'purchase', 'inventory'), updatePurchaseOrder)
  .delete(authorize('admin'), deletePurchaseOrder);

export default router;
