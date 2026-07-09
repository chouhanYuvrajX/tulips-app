const express = require('express');
const router = express.Router();
const { getAIResponse } = require('../services/ai.js');
const { getSystemPrompt } = require('../services/companions.js');
const { addMessage, getHistory } = require('../services/conversation.js');
const { generateSpeech } = require('../services/tts.js');

router.post('/', async (req, res) => {
    const { message, conversationId, userId, companionId, language, voiceSpeed, voiceEnabled } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    if (!message || !conversationId) {
        return res.status(400).json({ error: 'Message and conversationId are required' });
    }

    try {
        const history = await getHistory(userId, conversationId);
        await addMessage(userId, conversationId, 'user', message);
        const systemPrompt = getSystemPrompt(companionId);
        const aiReply = await getAIResponse(message, history, systemPrompt);
        await addMessage(userId, conversationId, 'assistant', aiReply);

        let audioBase64 = null;
        if (voiceEnabled !== false) {
            audioBase64 = await generateSpeech(aiReply, { language, voiceSpeed });
        }

        res.json({ 
            reply: aiReply, 
            conversationId, 
            audioBase64: audioBase64 || null
        });
    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ error: 'Something went wrong on the server' });
    }
});

module.exports = router;
