import prisma from '../config/database.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors.js';

const toPublicAlert = (alert) => ({
  id: alert.id,
  symbol: alert.symbol,
  condition: alert.condition,
  targetPrice: alert.targetPrice,
  triggered: alert.triggered,
  triggeredAt: alert.triggeredAt,
  createdAt: alert.createdAt,
});

const findAlertForUser = async (alertId, userId) => {
  const alert = await prisma.priceAlert.findUnique({
    where: { id: alertId },
  });

  if (!alert) {
    throw new NotFoundError('Price alert');
  }

  if (alert.userId !== userId) {
    throw new ForbiddenError('Not authorized to access this price alert');
  }

  return alert;
};

export const createAlert = async (userId, { symbol, condition, targetPrice }) => {
  const normalizedSymbol = String(symbol || '').trim().toUpperCase();

  if (!/^[A-Z0-9.]{1,10}$/.test(normalizedSymbol)) {
    throw new ValidationError('Stock symbol must contain only letters, numbers, and dots');
  }

  if (condition !== 'ABOVE' && condition !== 'BELOW') {
    throw new ValidationError('Condition must be ABOVE or BELOW');
  }

  const price = Number(targetPrice);
  if (!Number.isFinite(price) || price <= 0) {
    throw new ValidationError('Target price must be a number greater than 0');
  }

  const alert = await prisma.priceAlert.create({
    data: {
      userId,
      symbol: normalizedSymbol,
      condition,
      targetPrice: price,
    },
  });

  return toPublicAlert(alert);
};

export const listAlerts = async (userId) => {
  const alerts = await prisma.priceAlert.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return alerts.map(toPublicAlert);
};

export const deleteAlert = async (alertId, userId) => {
  await findAlertForUser(alertId, userId);

  await prisma.priceAlert.delete({
    where: { id: alertId },
  });
};

export const markAlertTriggered = async (alertId, userId) => {
  const existing = await findAlertForUser(alertId, userId);

  if (existing.triggered) {
    return toPublicAlert(existing);
  }

  const alert = await prisma.priceAlert.update({
    where: { id: alertId },
    data: {
      triggered: true,
      triggeredAt: new Date(),
    },
  });

  return toPublicAlert(alert);
};
