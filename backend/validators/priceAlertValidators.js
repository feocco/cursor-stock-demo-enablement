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
    .isFloat({ gt: 0 })
    .withMessage('Target price must be a number greater than 0'),
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
