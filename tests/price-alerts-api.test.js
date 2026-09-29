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
    expect(response.body.data.changed).toBe(true);
    expect(response.body.data.alert).toMatchObject({
      id: createdAlert.id,
      triggered: true,
    });
    expect(response.body.data.alert.triggeredAt).toEqual(expect.any(String));
    expect(response.body.data.alert).not.toHaveProperty('userId');
  });

  it('returns changed false when the owner marks an already triggered alert', async () => {
    const response = await authed(ownerToken)('patch', `/api/v1/alerts/${createdAlert.id}`).send({
      triggered: true,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.changed).toBe(false);
    expect(response.body.data.alert).toMatchObject({
      id: createdAlert.id,
      triggered: true,
    });
    expect(response.body.data.alert.triggeredAt).toEqual(expect.any(String));
    expect(response.body.data.alert).not.toHaveProperty('userId');
  });

  it('returns 404 when deleting or marking an unknown alert', async () => {
    const unknownId = '11111111-1111-4111-8111-111111111111';

    const deleteResponse = await authed(ownerToken)('delete', `/api/v1/alerts/${unknownId}`);

    expect(deleteResponse.status).toBe(404);
    expect(deleteResponse.body).toMatchObject({
      success: false,
      error: 'Price alert not found',
    });

    const patchResponse = await authed(ownerToken)('patch', `/api/v1/alerts/${unknownId}`).send({
      triggered: true,
    });

    expect(patchResponse.status).toBe(404);
    expect(patchResponse.body).toMatchObject({
      success: false,
      error: 'Price alert not found',
    });
  });

  it('rejects an invalid alert id on delete and patch', async () => {
    const deleteResponse = await authed(ownerToken)('delete', '/api/v1/alerts/not-a-uuid');

    expect(deleteResponse.status).toBe(400);
    expect(deleteResponse.body).toMatchObject({
      success: false,
      error: 'Invalid price alert ID',
    });

    const patchResponse = await authed(ownerToken)('patch', '/api/v1/alerts/not-a-uuid').send({
      triggered: true,
    });

    expect(patchResponse.status).toBe(400);
    expect(patchResponse.body).toMatchObject({
      success: false,
      error: 'Invalid price alert ID',
    });
  });

  it('rejects list and delete without a token', async () => {
    const listResponse = await request(app)
      .get('/api/v1/alerts')
      .set('X-Forwarded-For', nextIp());

    expect(listResponse.status).toBe(401);
    expect(listResponse.body.success).toBe(false);

    const deleteResponse = await request(app)
      .delete('/api/v1/alerts/11111111-1111-4111-8111-111111111111')
      .set('X-Forwarded-For', nextIp());

    expect(deleteResponse.status).toBe(401);
    expect(deleteResponse.body.success).toBe(false);
  });

  it('deletes an alert for the owner', async () => {
    const createResponse = await authed(ownerToken)('post', '/api/v1/alerts').send({
      symbol: 'MSFT',
      condition: 'BELOW',
      targetPrice: 50,
    });

    expect(createResponse.status).toBe(201);
    const alertId = createResponse.body.data.alert.id;

    const deleteResponse = await authed(ownerToken)('delete', `/api/v1/alerts/${alertId}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toMatchObject({
      success: true,
      message: 'Price alert deleted successfully',
    });

    const listResponse = await authed(ownerToken)('get', '/api/v1/alerts');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.alerts.some((alert) => alert.id === alertId)).toBe(false);
    expect(listResponse.body.data.alerts.some((alert) => alert.id === createdAlert.id)).toBe(true);
  });

  it('rejects a target price above 1000000 or with more than 4 decimal places', async () => {
    const tooHigh = await authed(ownerToken)('post', '/api/v1/alerts').send({
      symbol: 'AAPL',
      condition: 'ABOVE',
      targetPrice: 1000001,
    });

    expect(tooHigh.status).toBe(400);
    expect(tooHigh.body.success).toBe(false);

    const tooPrecise = await authed(ownerToken)('post', '/api/v1/alerts').send({
      symbol: 'AAPL',
      condition: 'ABOVE',
      targetPrice: 1.23456,
    });

    expect(tooPrecise.status).toBe(400);
    expect(tooPrecise.body.success).toBe(false);
  });
});
