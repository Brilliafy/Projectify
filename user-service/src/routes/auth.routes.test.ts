import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../app';

describe('User Service - Auth Routes & Health Unit Tests', () => {
  const app = buildApp();

  test('GET /health returns status ok and service identifier', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    assert.equal(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'user-service');
  });

  test('POST /api/users/register rejects malformed email address', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/users/register',
      payload: {
        email: 'not-an-email',
        password: 'password123',
        fullName: 'Test User',
      },
    });

    assert.equal(response.statusCode, 400);
    const body = JSON.parse(response.payload);
    assert.ok(body.error);
  });

  test('POST /api/users/register rejects password under 6 characters', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/users/register',
      payload: {
        email: 'test@example.com',
        password: '123',
        fullName: 'Test User',
      },
    });

    assert.equal(response.statusCode, 400);
    const body = JSON.parse(response.payload);
    assert.ok(body.error);
  });

  test('POST /api/users/login rejects empty payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/users/login',
      payload: {},
    });

    assert.equal(response.statusCode, 400);
    const body = JSON.parse(response.payload);
    assert.ok(body.error);
  });
});
