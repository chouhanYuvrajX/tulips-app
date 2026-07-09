const express = require('express');
const cors = require('cors');
const chatRoute = require('./routes/chat');
const authRoute = require('./routes/auth');
require('dotenv').config();
require('./services/firebase');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration:
// 1. Allows requests with no Origin header (common in mobile native apps).
// 2. If ALLOWED_ORIGINS is not set, all origins are allowed (for local dev).
// 3. Otherwise, only origins listed in ALLOWED_ORIGINS are permitted.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || !process.env.ALLOWED_ORIGINS || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// Routes
app.use('/api/chat', chatRoute);
app.use('/api/auth', authRoute);
const path = require('path');
const fs = require('fs');
app.get('/audio/:id', (req, res) => {
  const filePath = path.join('/tmp', `${req.params.id}.mp3`);
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'audio/mpeg');
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.status(404).json({ error: 'Audio not found' });
  }
});
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Tulip backend running on port ${PORT}`);
});
