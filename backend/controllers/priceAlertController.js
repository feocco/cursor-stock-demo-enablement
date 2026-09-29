import * as priceAlertService from '../services/priceAlertService.js';

export const listAlerts = async (req, res, next) => {
  try {
    const alerts = await priceAlertService.listAlerts(req.user.id);

    res.status(200).json({
      success: true,
      data: { alerts },
    });
  } catch (error) {
    next(error);
  }
};

export const createAlert = async (req, res, next) => {
  try {
    const { symbol, condition, targetPrice } = req.body;
    const alert = await priceAlertService.createAlert(req.user.id, {
      symbol,
      condition,
      targetPrice,
    });

    res.status(201).json({
      success: true,
      data: { alert },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    await priceAlertService.deleteAlert(id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Price alert deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const markAlertTriggered = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alert = await priceAlertService.markAlertTriggered(id, req.user.id);

    res.status(200).json({
      success: true,
      data: { alert },
    });
  } catch (error) {
    next(error);
  }
};
