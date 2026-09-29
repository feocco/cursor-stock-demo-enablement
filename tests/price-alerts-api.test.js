import request from 'supertest';
import { beforeAll, describe, expect, it } from '@jest/globals';
import { loadTestApp } from './helpers/testConfig.js';

describe('Price alerts API', () => {
  let app;
  let ownerToken;
  let otherToken;
  let createdAlert;
  let requestCounter = 0;

  const nextIp = () => `198.51.100.${++requestCounter}`;

  const registerAndLogin = async (email) => {
    const password = 'Password123';

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', nextIp())
      .send({ email, password });

    expect(registerResponse.status).toBe(201);

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', nextIp())
      .send({ email, password });

    expect(loginResponse.status).toBe(200);
    return loginResponse.body.data.token;
  };

  const authed = (token) => (method, url) => request(app)[method](url)
    .set('Authorization', `Bearer ${token}`)
    .set('X-Forwarded-For', nextIp());

  beforeAll(async () => {
    app = await loadTestApp();
    const suffix = Date.now();
    ownerToken = await registerAndLogin(`price-alerts-owner-${suffix}@example.com`);
    otherToken = await registerAndLogin(`price-alerts-other-${suffix}@example.com`);
  });

  it('creates an alert for the caller', async () => {
    const response = await authed(ownerToken)('post', '/api/v1/alerts').send({
      symbol: 'aapl',
      condition: 'ABOVE',
      targetPrice: 200.5,
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.alert).toMatchObject({
      symbol: 'AAPL',
      condition: 'ABOVE',
      targetPrice: 200.5,
      triggered: false,
      triggeredAt: null,
    });
    expect(response.body.data.alert.id).toEqual(expect.any(String));
    expect(response.body.data.alert.createdAt).toEqual(expect.any(String));
    expect(response.body.data.alert).not.toHaveProperty('userId');
    createdAlert = response.body.data.alert;
  });

  it('lists that alert for the owner', async () => {
    const response = await authed(ownerToken)('get', '/api/v1/alerts');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    const alerts = response.body.data.alerts;
    expect(alerts[0]).toMatchObject({
      id: createdAlert.id,
      symbol: 'AAPL',
      condition: 'ABOVE',
      targetPrice: 200.5,
      triggered: false,
    });
    expect(alerts.every((alert) => !Object.prototype.hasOwnProperty.call(alert, 'userId'))).toBe(true);
  });

  it('omits the alert from another user list', async () => {
    const response = await authed(otherToken)('get', '/api/v1/alerts');

    expect(response.status).toBe(200);
    expect(response.body.data.alerts.find((alert) => alert.id === createdAlert.id)).toBeUndefined();
  });

  it('rejects delete by another user and keeps the owner alert', async () => {
    const deleteResponse = await authed(otherToken)('delete', `/api/v1/alerts/${createdAlert.id}`);

    expect(deleteResponse.status).toBe(403);
    expect(deleteResponse.body).toMatchObject({
      success: false,
    });

    const listResponse = await authed(ownerToken)('get', '/api/v1/alerts');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.alerts.some((alert) => alert.id === createdAlert.id)).toBe(true);
  });

  it('rejects create without a token', async () => {
    const response = await request(app)
      .post('/api/v1/alerts')
      .set('X-Forwarded-For', nextIp())
      .send({
        symbol: 'AAPL',
        condition: 'ABOVE',
        targetPrice: 10,
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('rejects a bad condition or a non-positive price', async () => {
    const badCondition = await authed(ownerToken)('post', '/api/v1/alerts').send({
      symbol: 'AAPL',
      condition: 'SIDEWAYS',
      targetPrice: 10,
    });

    expect(badCondition.status).toBe(400);
    expect(badCondition.body.success).toBe(false);

    const nonPositive = await authed(ownerToken)('post', '/api/v1/alerts').send({
      symbol: 'AAPL',
      condition: 'BELOW',
      targetPrice: 0,
    });

    expect(nonPositive.status).toBe(400);
    expect(nonPositive.body.success).toBe(false);

    const negative = await authed(ownerToken)('post', '/api/v1/alerts').send({
      symbol: 'AAPL',
      condition: 'BELOW',
      targetPrice: -5,
    });

    expect(negative.status).toBe(400);
    expect(negative.body.success).toBe(false);
  });

  it('marks an alert triggered for the owner and rejects another user', async () => {
    const otherResponse = await authed(otherToken)('patch', `/api/v1/alerts/${createdAlert.id}`).send({
      triggered: true,
    });

    expect(otherResponse.status).toBe(403);
    expect(otherResponse.body.success).toBe(false);

    const response = await authed(ownerToken)('patch', `/api/v1/alerts/${createdAlert.id}`).send({
      triggered: true,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.alert).toMatchObject({
      id: createdAlert.id,
      triggered: true,
    });
    expect(response.body.data.alert.triggeredAt).toEqual(expect.any(String));
    expect(response.body.data.alert).not.toHaveProperty('userId');
  });
});
