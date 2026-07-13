const express = require('express');
const router = express.Router();
const { db } = require('../services/firebase');

// POST /voice/wake-event
router.post('/wake-event', async (req, res) => {
    const { userId, companionId, timestamp, source } = req.body;

    if (!userId || typeof userId !== 'string' || !userId.trim()) {
        return res.status(400).json({ error: 'userId is required' });
    }

    try {
        const rawTimestamp = timestamp || new Date().toISOString();
        // Replace invalid Firebase key characters: . $ # [ ] /
        const timestampKey = String(rawTimestamp).replace(/[\.\$#\[\]\/]/g, '_');

        const eventData = {
            companionId: companionId || null,
            timestamp: rawTimestamp,
            source: source || 'wakeword'
        };

        // Stores event in Firebase under a new node wakeEvents/{userId} (timestamp-keyed)
        await db.ref(`wakeEvents/${userId}/${timestampKey}`).set(eventData);

        console.log(`[Voice] Wake event stored successfully for user ${userId} at key ${timestampKey}:`, eventData);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(`Error in POST /voice/wake-event:`, error);
        res.status(500).json({ error: 'Something went wrong on the server' });
    }
});

module.exports = router;
