const db = require('../config/db');
const { Queue } = require('bullmq');

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

const newsletterQueue = new Queue('newsletterQueue', { connection: redisOptions });

exports.subscribe = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    // Save to local database
    await db.query(
      `INSERT INTO newsletter_subscribers (email, subscribed_at)
       VALUES ($1, NOW())
       ON CONFLICT (email) DO NOTHING`,
      [email]
    );

    // Delegate Mailchimp Sync to BullMQ Background Job
    await newsletterQueue.add('syncMailchimp', { email });

    res.json({ success: true, message: 'You are now subscribed! God bless you.' });
  } catch (err) {
    console.error('Newsletter error:', err);
    res.status(500).json({ error: 'Could not subscribe. Please try again.' });
  }
};
