const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp } = require('../services/otp');
const { db } = require('../services/firebase');

/**
 * Validates basic phone format (digits only, reasonable length).
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Sanitizes phone number for use as Firebase key.
 * @param {string} phone
 * @returns {string}
 */
function sanitizePhone(phone) {
  return phone.replace(/\D/g, '');
}

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;

  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  try {
    await sendOtp(phone);
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and code are required' });
  }

  try {
    const isValid = await verifyOtp(phone, code);

    if (isValid) {
      const sanitizedPhone = sanitizePhone(phone);
      const userRef = db.ref('users/' + sanitizedPhone);

      const snapshot = await userRef.get();
      const now = new Date().toISOString();

      const userData = {
        phone: sanitizedPhone,
        lastLoginAt: now
      };

      if (!snapshot.exists()) {
        userData.createdAt = now;
      }

      await userRef.update(userData);

      res.json({ success: true, userId: sanitizedPhone });
    } else {
      res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Internal server error during verification' });
  }
});

module.exports = router;
