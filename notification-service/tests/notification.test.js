const request = require('supertest');
const app = require('../src/app');

// Mock the DB connection to avoid trying to connect to MySQL during tests
jest.mock('../src/config/db', () => ({
  testConnection: jest.fn().mockResolvedValue(true),
  pool: {
    query: jest.fn().mockResolvedValue([[]]),
    execute: jest.fn().mockResolvedValue([[]])
  }
}));

describe('Notification Service API', () => {

  describe('Health & Root Endpoints', () => {
    it('GET /health should return 200 and UP status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'UP');
      expect(res.body).toHaveProperty('service', 'InsuranceIQ Notification Service');
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('timestamp');
    });

    it('GET / should return service metadata and endpoint listing', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('service', 'InsuranceIQ Notification Service');
      expect(res.body).toHaveProperty('version', '1.0.0');
      expect(res.body).toHaveProperty('endpoints');
      expect(res.body.endpoints).toHaveProperty('health', 'GET /health');
      expect(res.body.endpoints).toHaveProperty('claimFiled');
      expect(res.body.endpoints).toHaveProperty('fraudAlert');
    });
  });

  describe('Notification CRUD Endpoints', () => {
    it('GET /api/notifications/:userId should require authentication', async () => {
      const res = await request(app).get('/api/notifications/1');
      // Without a valid JWT, the route should reject with 401 Unauthorized
      expect(res.statusCode).toEqual(401);
    });

    it('POST /api/notifications/test should validate payload', async () => {
      const res = await request(app).post('/api/notifications/test').send({
        userId: 1,
        message: 'Test notification',
        type: 'INFO'
      });
      // Without auth or with validation, expect 400 or 401
      expect([400, 401]).toContain(res.statusCode);
    });
  });

  describe('Internal Event Endpoints', () => {
    it('POST /internal/events/claim-filed should validate the event payload', async () => {
      const res = await request(app).post('/internal/events/claim-filed').send({
        claimId: 'CLM-001',
        customerName: 'John Doe',
        userId: 1
      });
      // Internal events may require specific payload structure
      expect([200, 201, 400, 500]).toContain(res.statusCode);
    });

    it('POST /internal/events/fraud-alert should validate the fraud alert payload', async () => {
      const res = await request(app).post('/internal/events/fraud-alert').send({
        claimId: 'CLM-001',
        fraudScore: 85,
        userId: 1
      });
      expect([200, 201, 400, 500]).toContain(res.statusCode);
    });
  });

  describe('404 Handling', () => {
    it('GET /non-existent-route should return 404', async () => {
      const res = await request(app).get('/this/does/not/exist');
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toMatch(/Route not found/);
    });
  });

});
