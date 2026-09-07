import express from 'express';
import { body } from 'express-validator';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getCustomers)
  .post(
    authorize('admin', 'sales'),
    [
      body('name').notEmpty().withMessage('Customer name is required'),
      body('email').isEmail().withMessage('Valid customer email is required'),
      body('phone').notEmpty().withMessage('Customer phone is required'),
      validate,
    ],
    createCustomer
  );

router.route('/:id')
  .get(getCustomerById)
  .put(authorize('admin', 'sales'), updateCustomer)
  .delete(authorize('admin'), deleteCustomer);

export default router;
