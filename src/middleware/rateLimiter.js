const rateLimit = require('express-rate-limit');

const chatRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.CHAT_RATE_LIMIT_PER_MIN) || 20,
  message: {
    error: 'Too many requests, please slow down'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = { chatRateLimit };
