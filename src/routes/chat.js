const express = require('express');
const router = express.Router();
const { getAIResponse } = require('../services/ai');
const {
  createConversation,
  addMessage,
  getHistory,
} = require('../services/conversation');

/**
 * POST /api/chat
 * Receives a user message and returns the AI companion's reply.
 * 
 * Request body:
 *   { message: string, conversationId?: string }
 * 
 * Response:
 *   { reply: string, conversationId: string }
 */
router.post('/', async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      const err = new Error('Message is required and must be a non-empty string');
      err.statusCode = 400;
      throw err;
    }

    if (message.length > 2000) {
      const err = new Error('Message must be 2000 characters or less');
      err.statusCode = 400;
      throw err;
    }

    // Get or create conversation
    const convId = conversationId || createConversation();

    // Get conversation history
    const history = getHistory(convId);

    // Get AI response
    const reply = await getAIResponse(message.trim(), history);

    // Store messages in history
    addMessage(convId, 'user', message.trim());
    addMessage(convId, 'assistant', reply);

    res.json({
      reply,
      conversationId: convId,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;