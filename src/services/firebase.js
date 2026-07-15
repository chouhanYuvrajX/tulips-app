const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
require('dotenv').config();

let db;

try {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  // getDatabase() must stay inside this try block: if initializeApp() above
  // fails (bad/expired credentials), calling getDatabase() unguarded throws
  // an unrelated, confusing "default app does not exist" error from a
  // different stack frame instead of the real cause, and crashes the process
  // anyway — so the catch below never actually prevented the crash.
  db = getDatabase();
  console.log("Firebase Connected Successfully!");
} catch (error) {
  console.error("Firebase initialization failed — server cannot start without a working Firebase connection:", error);
  process.exit(1);
}

module.exports = { db };