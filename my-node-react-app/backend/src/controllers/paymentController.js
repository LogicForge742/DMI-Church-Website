const { initiateStkPush, generateAccessToken } = require('../../mpesa'); 
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');

// Simple in-memory LRU representation for idempotency (In prod, use Redis)
const processedPayments = new Set();

exports.getMpesaToken = async (req, res) => {
  const token = await generateAccessToken();
  if (token) {
    res.json({ access_token: token });
  } else {
    res.status(500).json({ error: 'Failed to generate token' });
  }
};

exports.donateMpesa = async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  if (idempotencyKey && processedPayments.has(idempotencyKey)) {
    logger.warn(`Idempotency key hit for Mpesa donation: ${idempotencyKey}`);
    return res.status(409).json({ error: "Payment request already processed." });
  }

  const { phone, amount } = req.body;
  if (!phone || !amount) {
    return res.status(400).json({ error: "Phone number and amount are required" });
  }

  const formattedPhone = phone.startsWith('254') ? phone : phone.replace(/^0/, '254');
  try {
    if (idempotencyKey) processedPayments.add(idempotencyKey);
    const response = await initiateStkPush(formattedPhone, amount);
    if (response) {
      res.json(response);
    } else {
      res.status(500).json({ error: "Failed to initiate STK Push" });
    }
  } catch (error) {
    if (idempotencyKey) processedPayments.delete(idempotencyKey);
    res.status(500).json({ error: error.message || "Failed to initiate STK Push" });
  }
};

exports.darajaCallback = (req, res) => {
  console.log('Callback:', JSON.stringify(req.body, null, 2));
  res.status(200).send('OK');
};

exports.stripeCheckout = async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  try {
    const { amount } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'kes',
          product_data: { name: 'Donation' },
          unit_amount: amount * 100, // Stripe uses cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
    }, {
      idempotencyKey // Let Stripe handle idempotency implicitly
    });
    res.json({ checkoutUrl: session.url });
  } catch (error) {
    logger.error('Stripe error:', error);
    res.status(500).json({ message: 'Stripe checkout failed.' });
  }
};

exports.createPaymentIntent = async (req, res) => {
  const { amount } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(amount) * 100, // in cents
      currency: 'usd', // or kes
      payment_method_types: ['card'],
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
