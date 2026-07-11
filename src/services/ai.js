const OpenAI = require('openai');

const DEFAULT_SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || 
  'You are Tulip, a warm and caring AI companion. Be empathetic, thoughtful, and conversational in your responses.';

function createClient() {
  return new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    timeout: 30000,
  });
}

async function getAIResponse(userMessage, history = [], systemPrompt) {
  console.log('[AI] Request started, model:', process.env.NVIDIA_MODEL || 'FALLBACK');
  const client = createClient();
  const model = process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-v4-flash';

  const messages = [
    { role: 'system', content: systemPrompt || DEFAULT_SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userMessage },
  ];

  try {
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content;
    console.log('[AI] Reply received:', reply ? reply.substring(0, 80) : 'EMPTY');

    if (!reply) {
      throw new Error('AI returned an empty response');
    }

    return reply;
  } catch (error) {
    console.error('[AI] ERROR:', error.message);
    throw error;
  }
}

module.exports = {
  getAIResponse,
  DEFAULT_SYSTEM_PROMPT,
  createClient,
};
