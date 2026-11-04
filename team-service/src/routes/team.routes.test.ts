import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../app';

describe('Team Service - Routes & Health Unit Tests', () => {
  const app = buildApp();

  test('GET /health returns 200 ok and service identifier', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    assert.equal(response.statusCode, 200);
    const body = JSON.parse(response.payload);
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'team-service');
  });

  test('GET /api/teams/mine rejects unauthorized request without token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/teams/mine',
    });

    assert.equal(response.statusCode, 401);
  });

  test('POST /api/teams rejects unauthorized request without token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/teams',
      payload: {
        name: 'Engineering Team',
      },
    });

    assert.equal(response.statusCode, 401);
  });

  test('POST /api/teams with non-leader token returns 403 Forbidden', async () => {
    // Generate a valid JWT for a regular MEMBER
    const memberToken = app.jwt.sign({ id: 99, role: 'MEMBER' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/teams',
      headers: {
        authorization: `Bearer ${memberToken}`,
      },
      payload: {
        name: 'New Team',
      },
    });

    assert.equal(response.statusCode, 403);
    const body = JSON.parse(response.payload);
    assert.equal(body.error, 'Only team leaders can create teams');
  });

  test('POST /api/teams with team leader token validates required name', async () => {
    const leaderToken = app.jwt.sign({ id: 10, role: 'TEAM_LEADER' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/teams',
      headers: {
        authorization: `Bearer ${leaderToken}`,
      },
      payload: {
        name: '', // empty name fails validation
      },
    });

    assert.equal(response.statusCode, 400);
    const body = JSON.parse(response.payload);
    assert.ok(body.error);
  });
});
