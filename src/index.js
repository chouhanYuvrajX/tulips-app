const express = require('express');
const cors = require('cors');
const chatRoute = require('./routes/chat');
const authRoute = require('./routes/auth');
const checkSecret = require('./middleware/checkSecret');
require('dotenv').config();
require('./services/firebase');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS allow karo sab origins se
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chat', checkSecret, chatRoute);
app.use('/api/auth', authRoute);
const path = require('path');
const fs = require('fs');
app.get('/audio/:id', checkSecret, (req, res) => {
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
