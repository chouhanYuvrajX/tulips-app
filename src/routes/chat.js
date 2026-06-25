const express = require('express');
const router = express.Router();
const { getAIResponse } = require('../services/ai.js');
const { addMessage, getHistory } = require('../services/conversation.js');
const { generateSpeech } = require('../services/tts.js');
const path = require('path');
const fs = require('fs');

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
        const audioBase64 = await generateSpeech(aiReply);

        const audioId = Date.now().toString();
        const audioPath = path.join('/tmp', `${audioId}.mp3`);
        if (audioBase64) {
            fs.writeFileSync(audioPath, Buffer.from(audioBase64, 'base64'));
        }

        res.json({ 
            reply: aiReply, 
            conversationId, 
            audioUrl: audioBase64 ? `https://${req.get('host')}/audio/${audioId}` : null
        });
    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ error: 'Something went wrong on the server' });
    }
});

module.exports = router;
