const express = require('express');
const router = express.Router();
const { getAIResponse } = require('../services/ai.js');
const { getSystemPrompt } = require('../services/companions.js');
const { addMessage, getHistory } = require('../services/conversation.js');
const { generateSpeech } = require('../services/tts.js');
const { extractAndSaveMemory, buildMemoryPromptBlock } = require('../services/memory.js');

router.post('/', async (req, res) => {
    const { message, conversationId, userId, companionId, language, voiceSpeed, voiceEnabled } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    if (!message || !conversationId) {
        return res.status(400).json({ error: 'Message and conversationId are required' });
    }

    // Validate message: must be a string, non-empty after trimming, and under 2000 characters
    if (typeof message !== 'string' || message.trim().length === 0 || message.trim().length > 2000) {
        return res.status(400).json({ error: 'Message must be between 1 and 2000 characters' });
    }

    // Validate conversationId: must be a string
    if (typeof conversationId !== 'string') {
        return res.status(400).json({ error: 'conversationId must be a string' });
    }

    // Validate companionId: must be a string if present
    if (companionId !== undefined && companionId !== null && typeof companionId !== 'string') {
        return res.status(400).json({ error: 'companionId must be a string' });
    }

    try {
        const history = await getHistory(userId, conversationId);
        await addMessage(userId, conversationId, 'user', message);
        const baseSystemPrompt = getSystemPrompt(companionId);
        const memoryBlock = await buildMemoryPromptBlock(userId);
        const systemPrompt = baseSystemPrompt + memoryBlock;
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

        // Fire-and-forget memory extraction in the background
        extractAndSaveMemory(userId, message, aiReply).catch(err => {
            console.error('[Chat Route] Error in background extractAndSaveMemory:', err);
        });
    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ error: 'Something went wrong on the server' });
    }
});

module.exports = router;
