const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

exports.register = async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO admins (email, password) VALUES ($1, $2)',
      [email, hashedPassword]
    );
    res.status(201).send('Admin registered successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error registering admin');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).send('Invalid credentials');
    }

    const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, {
      expiresIn: '1h',
    });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Login error');
  }
};

exports.getAdminSettings = (req, res) => {
  res.send(`Hello ${req.admin.email || req.admin.username}, this is a protected admin area`);
};

exports.refreshToken = (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).send('Access denied');

  jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }, (err, admin) => {
    if (err) return res.status(403).send('Invalid token');
    
    const newToken = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, {
      expiresIn: '15m', // Short-lived access token
    });
    res.json({ token: newToken });
  });
};
