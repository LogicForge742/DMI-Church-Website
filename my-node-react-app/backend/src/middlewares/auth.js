const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET is not set in .env. Server cannot start.');
  process.exit(1);
}

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, admin) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
         return res.status(401).json({ error: 'Token expired.' });
      }
      return res.status(403).json({ error: 'Invalid token.' });
    }
    req.admin = admin;
    next();
  });
}

module.exports = { authenticateAdmin, JWT_SECRET };
