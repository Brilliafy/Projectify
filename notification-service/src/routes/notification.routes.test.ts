import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../app';

describe('Notification Service - Routes & Health Unit Tests', () => {
  const app = buildApp();

  test('GET /health returns 200 ok and service identifier', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    assert.equal(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'notification-service');
  });

  test('GET /api/notifications rejects unauthenticated request without token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/notifications',
    });

    assert.equal(response.statusCode, 401);
  });

  test('PATCH /api/notifications/read-all rejects unauthenticated request', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/notifications/read-all',
    });

    assert.equal(response.statusCode, 401);
  });

  test('PATCH /api/notifications/:id/read rejects invalid ObjectId format', async () => {
    const userToken = app.jwt.sign({ id: 10, role: 'MEMBER' });

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/notifications/invalid-id/read',
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });

    assert.equal(response.statusCode, 400);
    const body = JSON.parse(response.payload);
    assert.equal(body.error, 'Invalid ID');
  });
});
