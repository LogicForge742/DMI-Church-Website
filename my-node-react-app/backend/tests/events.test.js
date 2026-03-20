const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const redisClient = require('../src/utils/redisClient');

describe('Events API Caching', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/events should return cached data if available without slamming DB', async () => {
    const cachedData = [{ id: 1, title: 'Cached Event' }];
    redisClient.get.mockResolvedValueOnce(JSON.stringify(cachedData));

    const res = await request(app).get('/api/events');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(cachedData);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('GET /api/events should query DB if cache misses and successfully set cache', async () => {
    redisClient.get.mockResolvedValueOnce(null);
    const dbData = [{ id: 2, title: 'DB Event' }];
    db.query.mockResolvedValueOnce({ rows: dbData });

    const res = await request(app).get('/api/events');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(dbData);
    expect(db.query).toHaveBeenCalledWith('SELECT * FROM events ORDER BY date DESC');
    expect(redisClient.setEx).toHaveBeenCalledWith('all_events', 3600, JSON.stringify(dbData));
  });
});
