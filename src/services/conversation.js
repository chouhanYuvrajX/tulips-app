const { v4: uuidv4 } = require('uuid');

/**
 * In-memory conversation history store.
 * Stores the last 10 messages per conversation.
 * Structure: Map<conversationId, Array<{ role, content }>>
 */
const conversations = new Map();
const MAX_HISTORY = 10;

/**
 * Creates a new conversation and returns its ID.
 * @returns {string} conversationId
 */
function createConversation() {
  const id = uuidv4();
  conversations.set(id, []);
  return id;
}

/**
 * Adds a message to a conversation's history.
 * Trims to the last MAX_HISTORY messages.
 * @param {string} conversationId
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content
 */
function addMessage(conversationId, role, content) {
  if (!conversations.has(conversationId)) {
    conversations.set(conversationId, []);
  }

  const history = conversations.get(conversationId);
  history.push({ role, content });

  // Keep only the last MAX_HISTORY messages
  if (history.length > MAX_HISTORY) {
    conversations.set(conversationId, history.slice(-MAX_HISTORY));
  }
}

/**
 * Gets the message history for a conversation.
 * @param {string} conversationId
 * @returns {Array<{ role, content }>}
 */
function getHistory(conversationId) {
  return conversations.get(conversationId) || [];
}

/**
 * Deletes a conversation's history.
 * @param {string} conversationId
 */
function deleteConversation(conversationId) {
  conversations.delete(conversationId);
}

module.exports = {
  createConversation,
  addMessage,
  getHistory,
  deleteConversation,
};