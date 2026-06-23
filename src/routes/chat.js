const express = require('express');
const router = express.Router();
const { getAIResponse } = require('../services/ai.js');
const { addMessage, getHistory } = require('../services/conversation.js');

router.post('/', async (req, res) => {
    const { message, conversationId } = req.body;

    if (!message || !conversationId) {
        return res.status(400).json({ error: 'Message and conversationId are required' });
    }

    try {
        // 1. Firebase se Vora ki purani memory (history) laao
        const history = await getHistory(conversationId);

        // 2. User ki nayi message Firebase mein save karo
        await addMessage(conversationId, 'user', message);

        // 3. AI (Vora) se response laao, purani memory ke saath
        const aiReply = await getAIResponse(message, history);

        // 4. Vora ka reply bhi Firebase mein save karo taaki aage yaad rahe
        await addMessage(conversationId, 'assistant', aiReply);

        res.json({ reply: aiReply, conversationId });
    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ error: 'Something went wrong on the server' });
    }
});

module.exports = router;