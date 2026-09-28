import { describe, expect, it } from '@jest/globals';
import {
  calculatePortfolioValue,
  calculateTotalPnL,
  calculateHoldingPnL,
  calculatePnLPercentage,
  formatCurrency,
  formatPercentage,
} from '../frontend/utils/calculations.js';

describe('calculations', () => {
  describe('calculateHoldingPnL', () => {
    it('calculates P&L correctly for a simple holding', () => {
      const holding = {
        symbol: 'AAPL',
        quantity: 10,
        avgPrice: 100,
      };
      const currentPrice = 150;

      const pnl = calculateHoldingPnL(holding, currentPrice);

      expect(pnl).toBe(500);
    });

    it('calculates P&L correctly after partial sell', () => {
      const holding = {
        symbol: 'AAPL',
        quantity: 6,
        avgPrice: 100,
      };
      const currentPrice = 150;

      const pnl = calculateHoldingPnL(holding, currentPrice);

      expect(pnl).toBe(300);
    });

    it('calculates negative P&L correctly', () => {
      const holding = {
        symbol: 'AAPL',
        quantity: 10,
        avgPrice: 150,
      };
      const currentPrice = 100;

      const pnl = calculateHoldingPnL(holding, currentPrice);

      expect(pnl).toBe(-500);
    });
  });

  describe('calculateTotalPnL', () => {
    it('calculates total P&L correctly for multiple holdings', () => {
      const holdings = [
        { symbol: 'AAPL', quantity: 10, avgPrice: 100 },
        { symbol: 'GOOGL', quantity: 5, avgPrice: 200 },
      ];
      const currentPrices = {
        AAPL: 150,
        GOOGL: 180,
      };

      const totalPnL = calculateTotalPnL(holdings, currentPrices);

      expect(totalPnL).toBe(400);
    });

    it('calculates total P&L correctly after partial sell', () => {
      const holdings = [
        { symbol: 'AAPL', quantity: 6, avgPrice: 100 },
      ];
      const currentPrices = {
        AAPL: 150,
      };

      const totalPnL = calculateTotalPnL(holdings, currentPrices);

      expect(totalPnL).toBe(300);
    });

    it('uses avgPrice as fallback when currentPrice is missing', () => {
      const holdings = [
        { symbol: 'AAPL', quantity: 10, avgPrice: 100 },
      ];
      const currentPrices = {};

      const totalPnL = calculateTotalPnL(holdings, currentPrices);

      expect(totalPnL).toBe(0);
    });
  });

  describe('calculatePortfolioValue', () => {
    it('calculates portfolio value correctly', () => {
      const holdings = [
        { symbol: 'AAPL', quantity: 10, avgPrice: 100 },
        { symbol: 'GOOGL', quantity: 5, avgPrice: 200 },
      ];
      const currentPrices = {
        AAPL: 150,
        GOOGL: 180,
      };

      const value = calculatePortfolioValue(holdings, currentPrices);

      expect(value).toBe(2400);
    });

    it('calculates portfolio value correctly after partial sell', () => {
      const holdings = [
        { symbol: 'AAPL', quantity: 6, avgPrice: 100 },
      ];
      const currentPrices = {
        AAPL: 150,
      };

      const value = calculatePortfolioValue(holdings, currentPrices);

      expect(value).toBe(900);
    });
  });

  describe('calculatePnLPercentage', () => {
    it('calculates P&L percentage correctly', () => {
      const holding = {
        symbol: 'AAPL',
        quantity: 10,
        avgPrice: 100,
      };
      const currentPrice = 150;

      const pnlPercent = calculatePnLPercentage(holding, currentPrice);

      expect(pnlPercent).toBe(50);
    });

    it('handles zero avgPrice gracefully', () => {
      const holding = {
        symbol: 'AAPL',
        quantity: 10,
        avgPrice: 0,
      };
      const currentPrice = 150;

      const pnlPercent = calculatePnLPercentage(holding, currentPrice);

      expect(pnlPercent).toBe(0);
    });
  });

  describe('P&L calculation scenario from Issue #3', () => {
    it('calculates correct P&L after buying 100 shares and selling 25', () => {
      const holdings = [
        { symbol: 'AAPL', quantity: 75, avgPrice: 150 },
      ];
      const currentPrices = {
        AAPL: 160,
      };

      const portfolioValue = calculatePortfolioValue(holdings, currentPrices);
      const totalPnL = calculateTotalPnL(holdings, currentPrices);
      const costBasis = portfolioValue - totalPnL;
      const pnlPercent = costBasis > 0 ? (totalPnL / costBasis) * 100 : 0;

      expect(portfolioValue).toBe(12000);
      expect(totalPnL).toBe(750);
      expect(costBasis).toBe(11250);
      expect(pnlPercent).toBeCloseTo(6.67, 2);
    });
  });

  describe('Badge sign consistency', () => {
    it('formats positive P&L with positive sign in both currency and percentage', () => {
      const totalPnL = 1098.38;
      const pnlPercent = 3.78;

      const formattedCurrency = formatCurrency(totalPnL);
      const formattedPercent = formatPercentage(pnlPercent);

      expect(formattedCurrency).toBe('$1,098.38');
      expect(formattedPercent).toBe('+3.78%');
      expect(formattedCurrency.includes('-')).toBe(false);
      expect(formattedPercent.startsWith('+')).toBe(true);
    });

    it('formats negative P&L with negative sign in both currency and percentage', () => {
      const totalPnL = -1098.38;
      const pnlPercent = -3.78;

      const formattedCurrency = formatCurrency(totalPnL);
      const formattedPercent = formatPercentage(pnlPercent);

      expect(formattedCurrency).toBe('-$1,098.38');
      expect(formattedPercent).toBe('-3.78%');
      expect(formattedCurrency.startsWith('-')).toBe(true);
      expect(formattedPercent.startsWith('-')).toBe(true);
    });

    it('formats zero P&L with no sign in both currency and percentage', () => {
      const totalPnL = 0;
      const pnlPercent = 0;

      const formattedCurrency = formatCurrency(totalPnL);
      const formattedPercent = formatPercentage(pnlPercent);

      expect(formattedCurrency).toBe('$0.00');
      expect(formattedPercent).toBe('+0.00%');
      expect(formattedCurrency.includes('-')).toBe(false);
    });

    it('calculates portfolio P&L percentage relative to starting capital', () => {
      const holdings = [
        { symbol: 'AAPL', quantity: 100, avgPrice: 150 },
        { symbol: 'GOOGL', quantity: 50, avgPrice: 200 },
      ];
      const currentPrices = {
        AAPL: 140,
        GOOGL: 190,
      };
      const cash = 10000;
      const startingCapital = 100000;

      const portfolioValue = calculatePortfolioValue(holdings, currentPrices);
      const totalValue = cash + portfolioValue;
      const totalPnL = totalValue - startingCapital;
      const pnlPercent = (totalPnL / startingCapital) * 100;

      expect(totalValue).toBe(33500);
      expect(totalPnL).toBe(-66500);
      expect(pnlPercent).toBeCloseTo(-66.5, 1);
      expect(totalPnL < 0).toBe(pnlPercent < 0);
    });

    it('calculates quote change where dollar and percent have consistent sign', () => {
      const quote = {
        currentPrice: 150,
        change: -5.25,
        changePercent: -3.38,
      };

      const isPositive = quote.change > 0;
      const isNegative = quote.change < 0;

      expect(isPositive).toBe(quote.changePercent > 0);
      expect(isNegative).toBe(quote.changePercent < 0);
      expect(formatCurrency(quote.change)).toBe('-$5.25');
      expect(formatPercentage(quote.changePercent)).toBe('-3.38%');
    });
  });
});
