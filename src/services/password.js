const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

/**
 * Hashes a password with a random salt using scrypt.
 * @param {string} password
 * @returns {Promise<string>} "salt:hash" hex string
 */
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a password against a stored "salt:hash" string.
 * @param {string} password
 * @param {string} stored
 * @returns {Promise<boolean>}
 */
async function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const derivedKey = await scrypt(password, salt, 64);
  const hashBuffer = Buffer.from(hash, 'hex');
  if (hashBuffer.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(hashBuffer, derivedKey);
}

module.exports = { hashPassword, verifyPassword };
