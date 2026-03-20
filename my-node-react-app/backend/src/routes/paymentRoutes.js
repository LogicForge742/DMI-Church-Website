const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { donateLimiter } = require('../middlewares/security');

router.get('/mpesa/token', paymentController.getMpesaToken);
router.post('/donate', donateLimiter, paymentController.donateMpesa);
router.post('/daraja/callback', paymentController.darajaCallback);
router.post('/stripe-checkout', paymentController.stripeCheckout);
router.post('/create-payment-intent', paymentController.createPaymentIntent);

// Maintain backwards compatibility with legacy routes in server.js
router.post('/stripe-donate', paymentController.createPaymentIntent);

module.exports = router;
