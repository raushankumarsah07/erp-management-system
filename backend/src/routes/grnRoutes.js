import express from 'express';
import { body } from 'express-validator';
import {
  getGRNs,
  getGRNById,
  createGRN,
} from '../controllers/grnController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getGRNs)
  .post(
    authorize('admin', 'inventory', 'purchase'),
    [
      body('purchaseOrderId').notEmpty().withMessage('Purchase Order ID is required'),
      body('receivedItems').isArray({ min: 1 }).withMessage('At least one item is required in GRN receipt'),
      validate,
    ],
    createGRN
  );

router.route('/:id')
  .get(getGRNById);

export default router;
