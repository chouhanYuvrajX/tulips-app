const otpStore = new Map();

/**
 * Generates a 6-digit numeric OTP, stores it, and "sends" it (logs it for now).
 * @param {string} phone
 * @returns {Promise<{success: boolean}>}
 */
async function sendOtp(phone) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

  otpStore.set(phone, { code, expiresAt });

  // TODO: replace console.log with real SMS provider (e.g. Twilio Verify or MSG91)
  // once API keys are available — function signature stays the same, no caller changes needed.
  console.log(`[OTP] Sending to ${phone}: ${code}`);

  return { success: true };
}

/**
 * Verifies the stored code against what was sent, checks expiry.
 * @param {string} phone
 * @param {string} code
 * @returns {Promise<boolean>}
 */
async function verifyOtp(phone, code) {
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
  verifyOtp
};
