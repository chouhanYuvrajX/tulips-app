const otpStore = new Map();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

const twilioConfigured = Boolean(
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_VERIFY_SERVICE_SID
);

/**
 * Formats a phone number to E.164 (e.g. +919876543210).
 * Bare 10-digit numbers are assumed to be Indian (+91).
 * Numbers that already include a country code (11-15 digits) are passed through.
 * @param {string} phone
 * @returns {string}
 */
function toE164(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  return `+${digits}`;
}

function twilioAuthHeader() {
  const creds = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
  return `Basic ${creds}`;
}

/**
 * Sends an OTP via Twilio Verify if configured, otherwise falls back to
 * generating a local code and logging it (dev mode).
 * @param {string} phone
 * @returns {Promise<{success: boolean}>}
 */
async function sendOtp(phone) {
  if (twilioConfigured) {
    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`,
      {
        method: 'POST',
        headers: {
          Authorization: twilioAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: toE164(phone), Channel: 'sms' }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.error('Twilio send error:', errBody);
      throw new Error('Failed to send OTP via Twilio');
    }

    return { success: true };
  }

  // Dev-mode fallback: no Twilio keys set, generate + log locally.
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
  otpStore.set(phone, { code, expiresAt });
  console.log(`[OTP DEV MODE - no Twilio keys set] Code for ${phone}: ${code}`);

  return { success: true };
}

/**
 * Verifies the OTP via Twilio Verify if configured, otherwise checks the
 * locally stored dev-mode code.
 * @param {string} phone
 * @param {string} code
 * @returns {Promise<boolean>}
 */
async function verifyOtp(phone, code) {
  if (twilioConfigured) {
    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          Authorization: twilioAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: toE164(phone), Code: code }),
      }
    );

    if (!res.ok) {
      return false;
    }

    const data = await res.json();
    return data.status === 'approved';
  }

  // Dev-mode fallback.
  const record = otpStore.get(phone);

  if (!record) {
    return false;
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return false;
  }

  if (record.code === code) {
    otpStore.delete(phone);
    return true;
  }

  return false;
}

module.exports = {
  sendOtp,
  verifyOtp,
};
