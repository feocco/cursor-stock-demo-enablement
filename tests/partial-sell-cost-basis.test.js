import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import { loadTestApp } from './helpers/testConfig.js';

describe('Partial Sell Cost Basis', () => {
  let app;
  let authHeader;

  beforeAll(async () => {
    app = await loadTestApp();

    const authResponse = await request(app)
      .post('/api/v1/auth/default')
      .send({});

    expect(authResponse.status).toBe(200);
    authHeader = `Bearer ${authResponse.body.data.token}`;
  });

  beforeEach(async () => {
    // Reset before each test for isolation
    await request(app)
      .post('/api/v1/portfolio/reset')
      .set('Authorization', authHeader);
  });

  it('partial sell keeps average price constant (regression guard)', async () => {
    // Buy 10 shares at $150 each (cost $1,500)
    const buyResponse = await request(app)
      .post('/api/v1/portfolio/buy')
      .set('Authorization', authHeader)
      .send({
        symbol: 'TEST',
        quantity: 10,
        price: 150
      });

    expect(buyResponse.status).toBe(200);
    const afterBuy = buyResponse.body.data.portfolio;
    expect(afterBuy.holdings).toHaveLength(1);
    expect(afterBuy.holdings[0].quantity).toBe(10);
    expect(afterBuy.holdings[0].avgPrice).toBe(150);
    expect(afterBuy.cash).toBe(100000 - 1500);

    // Sell 4 shares at $200 each (proceeds $800)
    const sellResponse = await request(app)
      .post('/api/v1/portfolio/sell')
      .set('Authorization', authHeader)
      .send({
        symbol: 'TEST',
        quantity: 4,
        price: 200
      });

    expect(sellResponse.status).toBe(200);
    const afterSell = sellResponse.body.data.portfolio;
    
    // Remaining: 6 shares at unchanged $150 avg price
    expect(afterSell.holdings).toHaveLength(1);
    expect(afterSell.holdings[0].quantity).toBe(6);
    expect(afterSell.holdings[0].avgPrice).toBe(150);
    
    // Total basis: 6 * $150 = $900 (down from original $1500)
    const remainingCostBasis = afterSell.holdings[0].quantity * afterSell.holdings[0].avgPrice;
    expect(remainingCostBasis).toBe(900);
    
    // Cash: $98,500 (after buy) + $800 (proceeds) = $99,300
    expect(afterSell.cash).toBe(99300);
  });

  it('removes holding completely when selling entire position', async () => {
    await request(app)
      .post('/api/v1/portfolio/reset')
      .set('Authorization', authHeader);

    // Buy 5 shares
    await request(app)
      .post('/api/v1/portfolio/buy')
      .set('Authorization', authHeader)
      .send({
        symbol: 'FULL',
        quantity: 5,
        price: 100
      });

    // Sell all 5 shares
    const sellResponse = await request(app)
      .post('/api/v1/portfolio/sell')
      .set('Authorization', authHeader)
      .send({
        symbol: 'FULL',
        quantity: 5,
        price: 120
      });

    expect(sellResponse.status).toBe(200);
    const portfolio = sellResponse.body.data.portfolio;
    
    // Holding should be removed
    expect(portfolio.holdings).toHaveLength(0);
    
    // Cash: $100,000 - $500 (buy) + $600 (sell) = $100,100
    expect(portfolio.cash).toBe(100100);
  });
});
