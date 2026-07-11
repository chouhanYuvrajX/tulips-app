const { db } = require('./firebase.js');
const { createClient } = require('./ai.js');

const CATEGORIES = ['goals', 'struggles', 'importantPeople', 'milestones', 'emotionalPatterns'];

/**
 * Normalizes a string for alphanumeric comparison to find near-duplicates.
 * Converts to lowercase and removes non-alphanumeric characters.
 */
function normalizeString(str) {
  if (typeof str !== 'string') return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Robust JSON cleanup and parsing. Strips markdown backticks if present.
 */
function cleanAndParseJSON(text) {
  if (!text) return {};
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerErr) {
        throw new Error(`Failed to parse JSON matching: ${err.message}`);
      }
    }
    throw err;
  }
}

/**
 * Reads memory object from Firebase at users/${userId}/memory.
 * Returns arrays for missing fields, keeping schema shape.
 */
async function getMemory(userId) {
  try {
    const ref = db.ref(`users/${userId}/memory`);
    const snapshot = await ref.once('value');
    const data = snapshot.exists() ? snapshot.val() : {};

    const memory = {};
    CATEGORIES.forEach(category => {
      memory[category] = Array.isArray(data[category]) ? data[category] : [];
    });
    return memory;
  } catch (error) {
    console.error(`[Memory] Error reading memory for user ${userId}:`, error);
    const memory = {};
    CATEGORIES.forEach(category => {
      memory[category] = [];
    });
    return memory;
  }
}

/**
 * Extracts and saves memory from a user/assistant exchange.
 * Runs in background, never throwing errors upward.
 */
async function extractAndSaveMemory(userId, userMessage, aiReply) {
  try {
    if (!userId) return;

    const client = createClient();
    const model = process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-v4-flash';

    const systemPrompt = `You are a precise data extraction assistant.
Your task is to analyze a single exchange between a User and an AI companion, and extract any NEW personal details or patterns about the user.

Look for:
1. "name": The user's name (only if explicitly mentioned or confirmed).
2. "goals": Long-term or short-term goals/aspirations.
3. "struggles": Personal, emotional, or work-related challenges/struggles.
4. "importantPeople": Friends, family, partners, or other significant figures in their life.
5. "milestones": Major life events or achievements mentioned.
6. "emotionalPatterns": Key persistent emotional states or patterns.

You must respond ONLY with a raw JSON object in the following format. Do not include any explanation, intro, outro, or markdown formatting. If no new information is found, return an empty JSON object {}.

JSON Schema:
{
  "name": "string (optional)",
  "goals": ["string (optional)"],
  "struggles": ["string (optional)"],
  "importantPeople": ["string (optional)"],
  "milestones": ["string (optional)"],
  "emotionalPatterns": ["string (optional)"]
}`;

    const userContent = `Analyze this exchange:
User: "${userMessage}"
AI Companion: "${aiReply}"

Extract any NEW information and format strictly as the specified JSON object.`;

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: 0.1,
      max_tokens: 512,
    });

    const reply = completion.choices[0]?.message?.content;
    if (!reply) {
      console.log('[Memory] Empty extraction response');
      return;
    }

    const extracted = cleanAndParseJSON(reply);

    // Save name separately if present
    if (extracted.name && typeof extracted.name === 'string' && extracted.name.trim()) {
      await db.ref(`users/${userId}/profile/name`).set(extracted.name.trim());
    }

    // Merge results into existing memory
    const existingMemory = await getMemory(userId);
    let updated = false;

    CATEGORIES.forEach(category => {
      let newItems = extracted[category];
      if (!newItems) return;

      if (!Array.isArray(newItems)) {
        if (typeof newItems === 'string') {
          newItems = [newItems];
        } else {
          return;
        }
      }

      newItems.forEach(item => {
        if (typeof item !== 'string' || !item.trim()) return;
        const trimmedItem = item.trim();
        const normalized = normalizeString(trimmedItem);
        const exists = existingMemory[category].some(ex => normalizeString(ex) === normalized);

        if (!exists) {
          existingMemory[category].push(trimmedItem);
          updated = true;
        }
      });

      // Cap at 20, drop oldest
      if (existingMemory[category].length > 20) {
        existingMemory[category] = existingMemory[category].slice(existingMemory[category].length - 20);
        updated = true;
      }
    });

    // Save back if any updates occurred
    if (updated) {
      await db.ref(`users/${userId}/memory`).set(existingMemory);
      console.log(`[Memory] Successfully updated memory for user ${userId}`);
    } else {
      console.log(`[Memory] No new memory to update for user ${userId}`);
    }

  } catch (error) {
    console.error('[Memory] Extraction/save error (failing silently):', error);
  }
}

/**
 * Builds a natural-language memory summary block to append to a companion's
 * system prompt. Fetches the user's name separately from profile/name.
 * Never throws — returns an empty string on any failure so chat always works.
 */
async function buildMemoryPromptBlock(userId) {
  try {
    const [memory, nameSnapshot] = await Promise.all([
      getMemory(userId),
      db.ref(`users/${userId}/profile/name`).once('value'),
    ]);

    const name = nameSnapshot.exists() ? nameSnapshot.val() : null;
    const join = (arr) => (arr && arr.length ? arr.join(', ') : 'none yet');

    return `

---
What you remember about this user:
Name: ${name || 'not yet known'}
Goals: ${join(memory.goals)}
Struggles: ${join(memory.struggles)}
Important people: ${join(memory.importantPeople)}
Milestones: ${join(memory.milestones)}
Emotional patterns: ${join(memory.emotionalPatterns)}

Use this naturally in conversation. Don't list it back robotically — refer to it the way a close friend would.
---`;
  } catch (error) {
    console.error(`[Memory] Failed to build memory prompt block for user ${userId}:`, error);
    return '';
  }
}

module.exports = {
  getMemory,
  extractAndSaveMemory,
  buildMemoryPromptBlock
};
