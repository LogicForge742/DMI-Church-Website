const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');

describe('Auth Middleware', () => {
  it('should block requests without a token on protected routes', async () => {
    const res = await request(app).get('/admin');
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error', 'Access denied. No token provided.');
  });

  it('should block requests with an invalid token', async () => {
    const res = await request(app)
      .get('/admin')
      .set('Authorization', 'Bearer invalid.token.str');
    
    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty('error', 'Invalid token.');
  });

  it('should allow request with valid token', async () => {
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign({ id: 1, email: 'admin@test.com' }, secret);
    const res = await request(app)
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);
      
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Hello admin@test.com');
  });
});
