const request = require('supertest');
const app = require('../src/app');

// Mock external SDKs natively so tests do not incur real network latency or costs
jest.mock('../mpesa', () => ({
  generateAccessToken: jest.fn().mockResolvedValue('fake-access-token'),
  initiateStkPush: jest.fn().mockResolvedValue({ CheckoutRequestID: 'ws_123', ResponseCode: '0' })
}));

jest.mock('stripe', () => {
  return jest.fn(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/fake-url' })
      }
    },
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ client_secret: 'fake-secret' })
    }
  }));
});

describe('Payment Controllers Integration', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/mpesa/token retrieves a mocked token successfully', async () => {
    const res = await request(app).get('/api/mpesa/token');
    expect(res.statusCode).toEqual(200);
    expect(res.body.access_token).toBe('fake-access-token');
  });

  it('POST /api/donate (Mpesa) returns 400 if phone/amount missing', async () => {
    const res = await request(app).post('/api/donate').send({ amount: 100 });
    expect(res.statusCode).toEqual(400);
  });

  it('POST /api/donate (Mpesa) succeeds with valid inputs', async () => {
    const res = await request(app)
      .post('/api/donate')
      .set('idempotency-key', 'test-key-1')
      .send({ phone: '254712345678', amount: 100 });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.CheckoutRequestID).toBe('ws_123');
  });

  it('POST /api/donate (Mpesa) refuses duplicate idempotency key', async () => {
    const res = await request(app)
      .post('/api/donate')
      .set('idempotency-key', 'test-key-1')
      .send({ phone: '254712345678', amount: 100 });
    
    expect(res.statusCode).toEqual(409);
    expect(res.body.error).toContain('already processed');
  });

  it('POST /api/stripe-checkout creates a Stripe session', async () => {
    const res = await request(app)
      .post('/api/stripe-checkout')
      .set('idempotency-key', 'test-key-stripe')
      .send({ amount: 50 });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.checkoutUrl).toBe('https://checkout.stripe.com/fake-url');
  });
});
