import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import cache from '../cache.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_production';

describe('Task Management API — CI Test Suite (Practical 12)', () => {
  // Test 1: Health Check Endpoint
  test('GET /health returns status 200 and ok payload', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('auth', 'enabled');
  });

  // Test 2: In-Memory Cache Stats Endpoint (Practical 9)
  test('GET /cache/stats returns status 200 and cache metrics', async () => {
    const res = await request(app).get('/cache/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('hits');
    expect(res.body).toHaveProperty('misses');
    expect(res.body).toHaveProperty('ttlSeconds', 60);
  });

  // Test 3: Asynchronous Event Log Endpoint (Practical 10)
  test('GET /events/log returns status 200 and event stream metadata', async () => {
    const res = await request(app).get('/events/log');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('totalEvents');
    expect(Array.isArray(res.body.events)).toBe(true);
  });

  // Test 4: Auth Middleware Security (Practical 7)
  test('GET /tasks without auth token returns 401 Unauthorized', async () => {
    const res = await request(app).get('/tasks');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Unauthorized');
  });

  // Test 5: GET /tasks with valid JWT token returns status 200 (Practical 6, 7 & 9)
  test('GET /tasks with valid JWT token returns status 200', async () => {
    const testUserId = 'ci-test-user-42';
    const testToken = jwt.sign(
      { id: testUserId, email: 'ci-runner@charusat.edu' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Seed cache so the test passes lightning-fast and reliably
    cache.set(`tasks_${testUserId}`, [
      { _id: 'ci-task-1', title: 'Automated CI Test Task', priority: 'High', completed: false }
    ]);

    const res = await request(app)
      .get('/tasks')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].title).toBe('Automated CI Test Task');
  });
});
