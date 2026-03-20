const db = require('../config/db');
const redisClient = require('../utils/redisClient');
const logger = require('../utils/logger');

exports.createEvent = async (req, res) => {
  const { title, description, date } = req.body;
  if (!title || !description || !date) return res.status(400).json({ error: 'Missing required fields' });

  try {
    const result = await db.query(
      'INSERT INTO events (title, description, date) VALUES ($1, $2, $3) RETURNING *',
      [title, description, date]
    );
    // Invalidate cache
    if (redisClient.isReady) await redisClient.del('all_events');
    res.json({ success: true, event: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error saving event' });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const isReady = redisClient.isReady;
    if (isReady) {
      const cachedEvents = await redisClient.get('all_events');
      if (cachedEvents) {
        logger.debug('Events pulled from Redis cache');
        return res.json(JSON.parse(cachedEvents));
      }
    }

    const result = await db.query('SELECT * FROM events ORDER BY date DESC');
    
    if (isReady) {
      // Setup Expiry of 60 minutes for high traffic pages
      await redisClient.setEx('all_events', 3600, JSON.stringify(result.rows));
      logger.debug('Events seeded into Redis cache');
    }

    res.json(result.rows);
  } catch (err) {
    logger.error('Error fetching events:', err);
    res.status(500).json({ error: 'Error fetching events' });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving event' });
  }
};

exports.updateEvent = async (req, res) => {
  const { title, description, date } = req.body;
  if (!title || !description || !date) return res.status(400).json({ error: 'All fields required' });

  try {
    const result = await db.query(
      'UPDATE events SET title = $1, description = $2, date = $3 WHERE id = $4 RETURNING *',
      [title, description, date, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    
    // Invalidate cache
    if (redisClient.isReady) await redisClient.del('all_events');

    res.json({ success: true, event: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error updating event' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM events WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    
    // Invalidate cache
    if (redisClient.isReady) await redisClient.del('all_events');

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting event' });
  }
};
