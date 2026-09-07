import express from 'express';
import { body } from 'express-validator';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from '../controllers/invoiceController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getInvoices)
  .post(
    authorize('admin', 'sales', 'finance'),
    [
      body('dueDate').notEmpty().withMessage('Invoice due date is required'),
      validate,
    ],
    createInvoice
  );

router.route('/:id')
  .get(getInvoiceById)
  .put(authorize('admin', 'sales', 'finance'), updateInvoice)
  .delete(authorize('admin'), deleteInvoice);

export default router;
