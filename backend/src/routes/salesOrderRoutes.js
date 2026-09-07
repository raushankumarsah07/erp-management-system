import express from 'express';
import { body } from 'express-validator';
import {
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
} from '../controllers/salesOrderController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getSalesOrders)
  .post(
    authorize('admin', 'sales'),
    [
      body('customerId').notEmpty().withMessage('Customer ID is required'),
      body('items').isArray({ min: 1 }).withMessage('At least one item is required in order'),
      validate,
    ],
    createSalesOrder
  );

router.route('/:id')
  .get(getSalesOrderById)
  .put(authorize('admin', 'sales', 'inventory'), updateSalesOrder)
  .delete(authorize('admin'), deleteSalesOrder);

export default router;
