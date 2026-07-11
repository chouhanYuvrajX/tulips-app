const express = require('express');
const router = express.Router();
const { db } = require('../services/firebase');
const { getMemory } = require('../services/memory');

const CATEGORIES = ['goals', 'struggles', 'importantPeople', 'milestones', 'emotionalPatterns'];

// GET /api/memory/:userId
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    try {
        const memory = await getMemory(userId);
        res.json(memory);
    } catch (error) {
        console.error(`Error in GET /api/memory/${userId}:`, error);
        res.status(500).json({ error: 'Something went wrong on the server' });
    }
});

// DELETE /api/memory/:userId
router.delete('/:userId', async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    try {
        await db.ref(`users/${userId}/memory`).remove();
        res.json({ success: true });
    } catch (error) {
        console.error(`Error in DELETE /api/memory/${userId}:`, error);
        res.status(500).json({ error: 'Something went wrong on the server' });
    }
});

// DELETE /api/memory/:userId/:category/:index
router.delete('/:userId/:category/:index', async (req, res) => {
    const { userId, category, index } = req.params;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    if (!CATEGORIES.includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
    }

    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0) {
        return res.status(400).json({ error: 'Invalid index' });
    }

    try {
        const memory = await getMemory(userId);

        if (idx < memory[category].length) {
            memory[category].splice(idx, 1);
            await db.ref(`users/${userId}/memory`).set(memory);
        }

        res.json(memory);
    } catch (error) {
        console.error(`Error in DELETE /api/memory/${userId}/${category}/${index}:`, error);
        res.status(500).json({ error: 'Something went wrong on the server' });
    }
});

module.exports = router;
