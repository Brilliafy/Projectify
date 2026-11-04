import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../app';

describe('Task Service - Routes & Health Unit Tests', () => {
  const app = buildApp();

  test('GET /health returns 200 ok and service identifier', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    assert.equal(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'task-service');
  });

  test('GET /api/tasks rejects unauthenticated request without token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/tasks',
    });

    assert.equal(response.statusCode, 401);
  });

  test('POST /api/tasks rejects unauthenticated request without token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/tasks',
    });

    assert.equal(response.statusCode, 401);
  });

  test('POST /api/tasks with MEMBER token returns 403 Forbidden', async () => {
    const memberToken = app.jwt.sign({ id: 101, role: 'MEMBER' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: {
        authorization: `Bearer ${memberToken}`,
      },
    });

    assert.equal(response.statusCode, 403);
    const body = JSON.parse(response.payload);
    assert.equal(body.error, 'Only Team Leaders can create tasks');
  });

  test('PATCH /api/tasks/:id/status rejects invalid status enum', async () => {
    const userToken = app.jwt.sign({ id: 101, role: 'MEMBER' });

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/tasks/507f1f77bcf86cd799439011/status',
      headers: {
        authorization: `Bearer ${userToken}`,
      },
      payload: {
        status: 'INVALID_STATUS',
      },
    });

    assert.equal(response.statusCode, 400);
    const body = JSON.parse(response.payload);
    assert.ok(body.error);
  });
});
