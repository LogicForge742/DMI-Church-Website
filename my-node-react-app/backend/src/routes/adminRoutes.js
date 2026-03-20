const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { loginLimiter } = require('../middlewares/security');
const { authenticateAdmin } = require('../middlewares/auth');

router.post('/register', adminController.register);
router.post('/login', loginLimiter, adminController.login);
router.post('/refresh', adminController.refreshToken);
router.get('/', authenticateAdmin, adminController.getAdminSettings);

module.exports = router;
