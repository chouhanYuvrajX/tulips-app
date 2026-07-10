const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_DATABASE_URL',
  'NVIDIA_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_WEB_CLIENT_ID'
];

function validateEnv() {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('\u274c Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease set these variables in your environment or .env file.');
    process.exit(1);
  }
}

module.exports = validateEnv;
