const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp } = require('../services/otp');
const { hashPassword, verifyPassword } = require('../services/password');
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

/**
 * Validates a basic email format.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Sanitizes an email for use as a Firebase key (Firebase keys can't contain '.').
 * @param {string} email
 * @returns {string}
 */
function sanitizeEmail(email) {
  return email.trim().toLowerCase().replace(/\./g, '_');
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
// Verifies the idToken issued by @react-native-google-signin/google-signin (native flow).
router.post('/google-signin', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required' });
  }

  try {
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );

    if (!tokenInfoRes.ok) {
      return res.status(401).json({ error: 'Invalid Google idToken' });
    }

    const tokenInfo = await tokenInfoRes.json();

    if (tokenInfo.aud !== process.env.GOOGLE_WEB_CLIENT_ID) {
      return res.status(401).json({ error: 'Token audience mismatch' });
    }

    if (!tokenInfo.sub) {
      return res.status(401).json({ error: 'Invalid Google token payload' });
    }

    const userId = 'google_' + tokenInfo.sub;
    const userRef = db.ref('users/' + userId);

    const snapshot = await userRef.get();
    const now = new Date().toISOString();

    const userData = {
      googleId: tokenInfo.sub,
      email: tokenInfo.email || null,
      name: tokenInfo.name || null,
      picture: tokenInfo.picture || null,
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

// POST /api/auth/email-signup
router.post('/email-signup', async (req, res) => {
  const { email, password, name } = req.body;

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const userId = 'email_' + sanitizeEmail(email);
    const userRef = db.ref('users/' + userId);
    const snapshot = await userRef.get();

    if (snapshot.exists()) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    await userRef.set({
      email: email.trim().toLowerCase(),
      name: name || null,
      passwordHash,
      createdAt: now,
      lastLoginAt: now,
    });

    res.json({ success: true, userId, email: email.trim().toLowerCase(), name: name || null });
  } catch (error) {
    console.error('Error during email sign-up:', error);
    res.status(500).json({ error: 'Internal server error during sign-up' });
  }
});

// POST /api/auth/email-login
router.post('/email-login', async (req, res) => {
  const { email, password } = req.body;

  if (!isValidEmail(email) || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userId = 'email_' + sanitizeEmail(email);
    const userRef = db.ref('users/' + userId);
    const snapshot = await userRef.get();

    if (!snapshot.exists()) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userData = snapshot.val();
    const isValid = await verifyPassword(password, userData.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await userRef.update({ lastLoginAt: new Date().toISOString() });

    res.json({ success: true, userId, email: userData.email, name: userData.name });
  } catch (error) {
    console.error('Error during email login:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

module.exports = router;
