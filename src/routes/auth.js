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

// POST /api/auth/google-signin
router.post('/google-signin', async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: 'accessToken is required' });
  }

  try {
    const tokenInfoRes = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
    );

    if (!tokenInfoRes.ok) {
      return res.status(401).json({ error: 'Invalid Google access token' });
    }

    const tokenInfo = await tokenInfoRes.json();

    if (tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: 'Token audience mismatch' });
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!profileRes.ok) {
      return res.status(401).json({ error: 'Failed to fetch Google profile' });
    }

    const profile = await profileRes.json();
    const userId = 'google_' + profile.sub;
    const userRef = db.ref('users/' + userId);

    const snapshot = await userRef.get();
    const now = new Date().toISOString();

    const userData = {
      googleId: profile.sub,
      email: profile.email || null,
      name: profile.name || null,
      picture: profile.picture || null,
      lastLoginAt: now
    };

    if (!snapshot.exists()) {
      userData.createdAt = now;
    }

    await userRef.update(userData);

    res.json({ success: true, userId, email: userData.email, name: userData.name });
  } catch (error) {
    console.error('Error during Google sign-in:', error);
    res.status(500).json({ error: 'Internal server error during Google sign-in' });
  }
});

module.exports = router;
