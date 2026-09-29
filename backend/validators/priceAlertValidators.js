import { body, param } from 'express-validator';

export const createPriceAlertValidator = [
  body('symbol')
    .trim()
    .notEmpty()
    .withMessage('Stock symbol is required')
    .isLength({ min: 1, max: 10 })
    .withMessage('Stock symbol must be between 1 and 10 characters')
    .matches(/^[A-Za-z0-9.]+$/)
    .withMessage('Stock symbol must contain only letters, numbers, and dots'),
  body('condition')
    .isIn(['ABOVE', 'BELOW'])
    .withMessage('Condition must be ABOVE or BELOW'),
  body('targetPrice')
    .isFloat({ gt: 0, max: 1000000 })
    .withMessage('Target price must be greater than 0 and at most 1000000')
    .custom((value) => {
      const price = Number(value);
      const scaled = price * 10000;
      return Number.isFinite(scaled) && Math.abs(scaled - Math.round(scaled)) < 1e-6;
    })
    .withMessage('Target price must have at most 4 decimal places'),
];

export const deletePriceAlertValidator = [
  param('id').isUUID().withMessage('Invalid price alert ID'),
];

export const markPriceAlertTriggeredValidator = [
  param('id').isUUID().withMessage('Invalid price alert ID'),
  body('triggered')
    .custom((value) => value === true)
    .withMessage('triggered must be true'),
];
