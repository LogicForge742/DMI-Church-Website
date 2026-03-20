const db = require('../config/db');

exports.submitContact = async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    await db.query(
      `INSERT INTO contact_messages (name, email, subject, message, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [name, email, subject, message]
    );
    console.log(`📬 Contact message from ${name} <${email}> — ${subject}`);
    res.json({ success: true, message: 'Message received. Thank you!' });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ error: 'Could not save your message. Please try again.' });
  }
};
