const express = require('express');
const cors = require('cors');
const chatRoute = require('./routes/chat');
require('dotenv').config();
require('./services/firebase');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS allow karo sab origins se
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chat', chatRoute);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Tulip backend running on port ${PORT}`);
});
