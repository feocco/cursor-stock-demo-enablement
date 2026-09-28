import { describe, it, expect, beforeAll } from '@jest/globals';
import * as stockService from '../backend/services/stockService.js';

describe('Stock History Alignment', () => {
  it('returns history where last close matches deterministic quote for each period', async () => {
    const periods = ['1d', '1w', '1m', '3m', '1y'];
    
    for (const period of periods) {
      const history = await stockService.getStockHistory('TSLA', period);
      
      expect(history).toBeInstanceOf(Array);
      expect(history.length).toBeGreaterThan(0);
      
      // Get the last data point
      const lastPoint = history[history.length - 1];
      expect(lastPoint).toHaveProperty('close');
      
      // Calculate expected price using same deterministic logic
      const symbol = 'TSLA';
      const seed = Array.from(symbol).reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const basePrice = 100 + (seed % 200);
      const intervalsSinceEpoch = Math.floor(Date.now() / 5000);
      const driftSeed = seed + intervalsSinceEpoch;
      const driftPercent = ((driftSeed % 60) - 30) / 10000;
      const expectedPrice = basePrice * (1 + driftPercent);
      
      // Last close should be within ~1% of deterministic quote
      const priceDiff = Math.abs(lastPoint.close - expectedPrice);
      const percentDiff = (priceDiff / expectedPrice) * 100;
      
      expect(percentDiff).toBeLessThan(1.5); // Allow 1.5% tolerance for small variations
    }
  });

  it('generates different base prices for different symbols', async () => {
    const history1 = await stockService.getStockHistory('AAPL', '1m');
    const history2 = await stockService.getStockHistory('GOOGL', '1m');
    
    const lastPrice1 = history1[history1.length - 1].close;
    const lastPrice2 = history2[history2.length - 1].close;
    
    // Different symbols should have different base prices
    expect(Math.abs(lastPrice1 - lastPrice2)).toBeGreaterThan(10);
  });
});
