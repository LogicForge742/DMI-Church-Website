const axios = require('axios');
const moment = require('moment');
const base64 = require('base-64');
const axiosRetry = require('axios-retry').default;
const CircuitBreaker = require('opossum');
const logger = require('./src/utils/logger'); 

// Configure exponential backoff retries for transient network errors
axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
  }
});

const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
const shortcode = process.env.MPESA_SHORTCODE || '174379';
const passkey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2c2c731b9c6b3f8f263bbf24b1d3e6c2';

const generateAccessTokenRaw = async () => {
  const auth = base64.encode(`${consumerKey}:${consumerSecret}`);
  const response = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return response.data.access_token;
};

// Mpesa Access Token Circuit Breaker
const generateAccessTokenCb = new CircuitBreaker(generateAccessTokenRaw, {
  timeout: 5000, 
  errorThresholdPercentage: 50, 
  resetTimeout: 30000 
});
generateAccessTokenCb.fallback(() => {
  logger.error("Mpesa Access Token: Circuit Breaker OPEN.");
  throw new Error("Mpesa service is temporarily unavailable.");
});

const generateAccessToken = () => generateAccessTokenCb.fire();

const initiateStkPushRaw = async ({ phone, amount }) => {
  const token = await generateAccessToken();
  const timestamp = moment().format('YYYYMMDDHHmmss');
  const password = base64.encode(`${shortcode}${passkey}${timestamp}`);

  const requestData = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phone,
    PartyB: shortcode,
    PhoneNumber: phone,
    CallBackURL: process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/daraja/callback` : 'http://localhost:5000/api/daraja/callback',
    AccountReference: 'DMI Church',
    TransactionDesc: 'Donation',
  };

  const response = await axios.post(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    requestData,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// Mpesa STK Push Circuit Breaker
const initiateStkPushCb = new CircuitBreaker(initiateStkPushRaw, {
  timeout: 10000, 
  errorThresholdPercentage: 50, 
  resetTimeout: 30000 
});
initiateStkPushCb.fallback(() => {
  logger.error("Mpesa STK Push: Circuit Breaker OPEN.");
  throw new Error("Payment service is temporarily unavailable.");
});

const initiateStkPush = (phone, amount) => initiateStkPushCb.fire({ phone, amount });

module.exports = { generateAccessToken, initiateStkPush };
