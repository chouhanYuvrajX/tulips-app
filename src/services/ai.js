const OpenAI = require('openai');

/**
 * AI Service for Tulip companion.
 * Uses OpenAI SDK pointed at NVIDIA NIM API.
 *
 * System prompt placeholder - customize the companion's personality here.
 * @type {string}
 */
const DEFAULT_SYSTEM_PROMPT = process.env.SYSTEM_PROMPT ||
  'You are Tulip, a warm and caring AI companion. Be empathetic, thoughtful, and conversational in your responses.';

/**
 * Creates an OpenAI client configured for NVIDIA NIM.
 */
function createClient() {
  return new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  });
}

/**
 * Sends a message with conversation history to the AI model and returns the reply.
 * @param {string} userMessage - The user's message
 * @param {Array<{ role: string, content: string }>} [history=[]] - Previous conversation messages
 * @param {string} [systemPrompt] - Optional custom system prompt override
 * @returns {Promise<string>} The AI's reply
 */
async function getAIResponse(userMessage, history = [], systemPrompt) {
  const client = createClient();
  const model = process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-v4-flash';

  // Build the messages array: system prompt + history + current user message
  const messages = [
    { role: 'system', content: systemPrompt || DEFAULT_SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userMessage },
  ];

  const completion = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    max_tokens: 1024,
  });

  const reply = completion.choices[0]?.message?.content;

  if (!reply) {
    throw new Error('AI returned an empty response');
  }

  return reply;
}

module.exports = {
  getAIResponse,
  DEFAULT_SYSTEM_PROMPT,
};