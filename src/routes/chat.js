const express = require('express');
const router = express.Router();
const { getAIResponse } = require('../services/ai.js');
const { addMessage, getHistory } = require('../services/conversation.js');
const { generateSpeech } = require('../services/tts.js'); // <-- Naya import add kiya

router.post('/', async (req, res) => {
    const { message, conversationId } = req.body;

    if (!message || !conversationId) {
        return res.status(400).json({ error: 'Message and conversationId are required' });
    }

    try {
        const history = await getHistory(conversationId);
        await addMessage(conversationId, 'user', message);
        const aiReply = await getAIResponse(message, history);
        await addMessage(conversationId, 'assistant', aiReply);

        // [NAYA] AI ke reply ko ElevenLabs se audio (Base64) mein convert karo
        const audioUrl = await generateSpeech(aiReply);

        // Frontend ko text, conversationId aur audioUrl bhejo
        res.json({ 
            reply: aiReply, 
            conversationId, 
            audioUrl: audioUrl 
        });

    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ error: 'Something went wrong on the server' });
    }
});

module.exports = router;
