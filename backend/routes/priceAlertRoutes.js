import express from 'express';
import * as priceAlertController from '../controllers/priceAlertController.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import {
  createPriceAlertValidator,
  deletePriceAlertValidator,
  markPriceAlertTriggeredValidator,
} from '../validators/priceAlertValidators.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);
router.use(apiLimiter);

router.get('/', priceAlertController.listAlerts);
router.post('/', createPriceAlertValidator, handleValidationErrors, priceAlertController.createAlert);
router.patch('/:id', markPriceAlertTriggeredValidator, handleValidationErrors, priceAlertController.markAlertTriggered);
router.delete('/:id', deletePriceAlertValidator, handleValidationErrors, priceAlertController.deleteAlert);

export default router;
