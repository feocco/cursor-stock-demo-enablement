import { api } from './api';
import { formatCurrency } from './calculations';

export const AlertCondition = {
  ABOVE: 'ABOVE',
  BELOW: 'BELOW',
};

/**
 * Load the signed-in user's alerts from the server.
 */
export const getAlerts = async () => {
  const alerts = await api.getPriceAlerts();
  return Array.isArray(alerts) ? alerts : [];
};

/**
 * Create a new price alert
 */
export const createAlert = async (symbol, condition, targetPrice) => {
  return api.createPriceAlert(symbol, condition, Number(targetPrice));
};

/**
 * Delete an alert by ID
 */
export const deleteAlert = async (alertId) => {
  await api.deletePriceAlert(alertId);
};

/**
 * Check if an alert should trigger based on current price
 */
const shouldTrigger = (alert, currentPrice) => {
  if (alert.triggered) {
    return false;
  }

  if (alert.condition === AlertCondition.ABOVE) {
    return currentPrice >= alert.targetPrice;
  }

  if (alert.condition === AlertCondition.BELOW) {
    return currentPrice <= alert.targetPrice;
  }

  return false;
};

/**
 * Persist that an alert has fired so a later reload does not fire it again.
 */
const markAlertTriggered = async (alertId) => {
  return api.markPriceAlertTriggered(alertId);
};

/**
 * Show browser notification for triggered alert
 */
const showNotification = (alert, currentPrice) => {
  const conditionText = alert.condition === AlertCondition.ABOVE ? 'above' : 'below';
  const title = `${alert.symbol} Alert Triggered`;
  const body = `${alert.symbol} is now ${conditionText} ${formatCurrency(alert.targetPrice)} (current: ${formatCurrency(currentPrice)})`;

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: alert.id,
    });
  }
};

/**
 * Check all alerts against current prices
 */
export const checkAlerts = async (quotes, onAlertTriggered) => {
  const alerts = (await getAlerts()).filter((alert) => !alert.triggered);

  if (alerts.length === 0) {
    return [];
  }

  const triggeredAlerts = [];

  for (const alert of alerts) {
    const quote = quotes[alert.symbol];

    if (quote && quote.currentPrice) {
      const currentPrice = Number(quote.currentPrice);

      if (shouldTrigger(alert, currentPrice)) {
        const result = await markAlertTriggered(alert.id);
        if (!result?.changed) {
          continue;
        }
        showNotification(alert, currentPrice);
        triggeredAlerts.push({ ...alert, currentPrice });

        if (onAlertTriggered) {
          onAlertTriggered(alert, currentPrice);
        }
      }
    }
  }

  return triggeredAlerts;
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

/**
 * Remove triggered alerts for the signed-in user.
 */
export const clearTriggeredAlerts = async () => {
  const alerts = await getAlerts();
  const triggered = alerts.filter((alert) => alert.triggered);
  await Promise.all(triggered.map((alert) => deleteAlert(alert.id)));
};

/**
 * Get active alerts for a specific symbol
 */
export const getAlertsForSymbol = async (symbol) => {
  const alerts = await getAlerts();
  return alerts.filter(
    (alert) => alert.symbol === symbol.toUpperCase() && !alert.triggered
  );
};
