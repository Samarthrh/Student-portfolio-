import OpenAI from 'openai';

/**
 * Intelligent Fallback Description Generator
 * Demonstrates Graceful Degradation when external AI services fail or timeout
 */
export const generateFallbackDescription = (title) => {
  const lower = (title || '').toLowerCase();
  let suggestedPriority = 'medium';
  let description = '';

  if (lower.includes('fix') || lower.includes('bug') || lower.includes('crash') || lower.includes('error')) {
    suggestedPriority = 'high';
    description = `Investigate root cause of "${title}", reproduce issue in development, implement defensive fix, and verify with automated tests.`;
  } else if (lower.includes('auth') || lower.includes('security') || lower.includes('jwt') || lower.includes('password')) {
    suggestedPriority = 'high';
    description = `Implement and audit secure authentication flow for "${title}", ensuring token validation, bcrypt hashing, and route protection.`;
  } else if (lower.includes('test') || lower.includes('jest') || lower.includes('ci') || lower.includes('pipeline')) {
    suggestedPriority = 'medium';
    description = `Develop comprehensive test coverage and CI workflow verification for "${title}" to prevent regressions.`;
  } else if (lower.includes('deploy') || lower.includes('docker') || lower.includes('release')) {
    suggestedPriority = 'high';
    description = `Prepare deployment configuration for "${title}", execute build validation, verify environment secrets, and perform smoke testing.`;
  } else if (lower.includes('doc') || lower.includes('readme')) {
    suggestedPriority = 'low';
    description = `Draft and review technical documentation for "${title}", including architecture diagrams, API schemas, and setup steps.`;
  } else {
    description = `Execute implementation plan for "${title}". Define functional specifications, implement core components, and verify acceptance criteria.`;
  }

  return {
    description,
    suggestedPriority,
    fallback: true,
    provider: 'fallback-heuristic',
    message: 'Generated using local heuristic fallback (AI service offline or unconfigured).'
  };
};

/**
 * Calls OpenAI or Gemini API with automatic fallback and graceful degradation
 * @param {string} title - Task title
 * @returns {Promise<{ description: string, suggestedPriority: string, fallback: boolean, provider: string }>}
 */
export const generateTaskDescription = async (title) => {
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // 1. Try OpenAI if key is configured
  if (openaiKey && !openaiKey.startsWith('your_') && openaiKey !== 'invalid_key_for_testing') {
    try {
      const client = new OpenAI({ apiKey: openaiKey });
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant for a task management app. Given a task title, write a concise, professional 1-2 sentence description and suggest a priority level: "low", "medium", or "high". Return valid JSON with keys "description" and "suggestedPriority".'
          },
          { role: 'user', content: `Task Title: "${title}"` }
        ],
        response_format: { type: 'json_object' }
      });

      const parsed = JSON.parse(completion.choices[0].message.content);
      return {
        description: parsed.description || '',
        suggestedPriority: ['low', 'medium', 'high'].includes(parsed.suggestedPriority?.toLowerCase())
          ? parsed.suggestedPriority.toLowerCase()
          : 'medium',
        fallback: false,
        provider: 'openai'
      };
    } catch (err) {
      console.warn('[AI Service] OpenAI call failed, falling back gracefully:', err.message);
      const fallbackResult = generateFallbackDescription(title);
      fallbackResult.apiError = err.message;
      return fallbackResult;
    }
  }

  // 2. Try Gemini if key is configured
  if (geminiKey && !geminiKey.startsWith('your_') && geminiKey !== 'invalid_key_for_testing') {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an AI assistant for a task management app. Given task title "${title}", write a concise 1-2 sentence description and suggest a priority level: "low", "medium", or "high". Output pure JSON with keys "description" and "suggestedPriority".`
                }
              ]
            }
          ],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(rawText);

      return {
        description: parsed.description || '',
        suggestedPriority: ['low', 'medium', 'high'].includes(parsed.suggestedPriority?.toLowerCase())
          ? parsed.suggestedPriority.toLowerCase()
          : 'medium',
        fallback: false,
        provider: 'gemini'
      };
    } catch (err) {
      console.warn('[AI Service] Gemini call failed, falling back gracefully:', err.message);
      const fallbackResult = generateFallbackDescription(title);
      fallbackResult.apiError = err.message;
      return fallbackResult;
    }
  }

  // 3. If no key or deliberate invalid key provided, return graceful fallback
  return generateFallbackDescription(title);
};
