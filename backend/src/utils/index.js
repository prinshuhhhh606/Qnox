/**
 * Core utility functions: formatting, token generation & signature verification
 */
const crypto = require('crypto');

const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

const verifyRazorpaySignature = (orderId, paymentId, signature, secret) => {
  const generated = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return generated === signature;
};

module.exports = {
  formatCurrency,
  generateSecureToken,
  verifyRazorpaySignature,
};
