// lib/gemini.ts
// Gemini API helper for structured output with Google AI API
// Primary: Gemini 3 Flash Preview (frontier intelligence, search grounding)
// Fallback: Claude 3.5 Sonnet via OpenRouter

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3-flash-preview';

interface GeminiMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

interface GeminiResponse {
    candidates: {
        content: {
            parts: { text: string }[];
        };
        finishReason: string;
    }[];
}

/**
 * Call Gemini 3 Flash Preview API
 * @param systemPrompt - System instruction
 * @param userPrompt - User message
 * @param options - Temperature, maxTokens
 * @returns Parsed response text or null if failed
 */
export async function callGemini(
    systemPrompt: string,
    userPrompt: string,
    options: {
        temperature?: number;
        maxTokens?: number;
        model?: string;
    } = {}
): Promise<string | null> {
    if (!GEMINI_API_KEY) {
        console.warn('⚠️ GOOGLE_AI_API_KEY not set, skipping Gemini');
        return null;
    }

    const { temperature = 0.2, maxTokens = 8000, model = GEMINI_MODEL } = options;

    try {
        console.log(`🌟 Calling ${model}...`);

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: userPrompt }]
                        }
                    ],
                    systemInstruction: {
                        parts: [{ text: systemPrompt }]
                    },
                    generationConfig: {
                        temperature,
                        maxOutputTokens: maxTokens,
                        responseMimeType: 'application/json', // Force JSON output
                    },
                    // Enable Google Search grounding for better insights
                    tools: [
                        {
                            googleSearch: {}
                        }
                    ]
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error(`❌ Gemini API error (${response.status}):`, error.slice(0, 200));
            return null;
        }

        const data: GeminiResponse = await response.json();

        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            console.error('❌ Gemini returned empty response');
            return null;
        }

        const text = data.candidates[0].content.parts[0].text;
        console.log(`✅ Gemini responded (${text.length} chars)`);

        return text;
    } catch (error) {
        console.error('❌ Gemini call failed:', error);
        return null;
    }
}

/**
 * Call Gemini with structured JSON output and automatic fallback to Claude
 * @param systemPrompt - System instruction  
 * @param userPrompt - User message with expected JSON schema
 * @param fallbackToOpenRouter - Whether to fallback to Claude via OpenRouter
 * @returns Parsed JSON object or null
 */
export async function callGeminiWithFallback<T = any>(
    systemPrompt: string,
    userPrompt: string,
    options: {
        temperature?: number;
        maxTokens?: number;
        fallbackToOpenRouter?: boolean;
    } = {}
): Promise<T | null> {
    const { fallbackToOpenRouter = true, ...geminiOptions } = options;

    // Try Gemini 3 Flash first
    const geminiResult = await callGemini(systemPrompt, userPrompt, geminiOptions);

    if (geminiResult) {
        try {
            // Clean the response - remove markdown code blocks if present
            let cleanedResult = geminiResult.trim();
            if (cleanedResult.startsWith('```json')) {
                cleanedResult = cleanedResult.slice(7);
            }
            if (cleanedResult.startsWith('```')) {
                cleanedResult = cleanedResult.slice(3);
            }
            if (cleanedResult.endsWith('```')) {
                cleanedResult = cleanedResult.slice(0, -3);
            }

            const parsed = JSON.parse(cleanedResult) as T;
            console.log('✅ Gemini JSON parsed successfully');
            return parsed;
        } catch (parseError) {
            console.warn('⚠️ Gemini returned invalid JSON, falling back...', parseError);
        }
    }

    // Fallback to Claude via OpenRouter
    if (fallbackToOpenRouter && process.env.OPENROUTER_API_KEY) {
        console.log('🔄 Falling back to Claude 3.5 Sonnet via OpenRouter...');

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://thepalette.app",
                    "X-Title": "Palette"
                },
                body: JSON.stringify({
                    "model": "anthropic/claude-3.5-sonnet",
                    "messages": [
                        { "role": "system", "content": systemPrompt },
                        { "role": "user", "content": userPrompt }
                    ],
                    "max_tokens": options.maxTokens || 8000,
                    "temperature": options.temperature || 0.2
                })
            });

            if (!response.ok) {
                console.error('❌ OpenRouter fallback failed:', response.status);
                return null;
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;

            if (!content) {
                console.error('❌ OpenRouter returned empty response');
                return null;
            }

            // Parse JSON from response
            let cleanedContent = content.trim();
            const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('❌ Could not find JSON in OpenRouter response');
                return null;
            }

            const parsed = JSON.parse(jsonMatch[0]) as T;
            console.log('✅ Claude fallback JSON parsed successfully');
            return parsed;

        } catch (error) {
            console.error('❌ Claude fallback failed:', error);
            return null;
        }
    }

    return null;
}

// Feature flag to enable/disable Gemini (for easy rollback)
export const USE_GEMINI_FOR_BRAND_ANALYSIS = true;

export default {
    callGemini,
    callGeminiWithFallback,
    USE_GEMINI_FOR_BRAND_ANALYSIS
};
