// lib/gemini.ts
// Gemini API helper for structured output with Google AI API
// Primary: Gemini 3 Flash Preview (frontier intelligence, search grounding)
// Fallback: Claude 3.5 Sonnet via OpenRouter

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3-flash-preview';

// Multimodal content types
export type TextContent = { type: 'text'; text: string };
export type ImageUrlContent = { type: 'image_url'; image_url: { url: string } };
export type MultimodalContent = TextContent | ImageUrlContent;

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
 * Convert image URL to base64 for Gemini API
 */
async function imageUrlToBase64(imageUrl: string): Promise<{ mimeType: string; data: string } | null> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(imageUrl, {
            signal: controller.signal,
            headers: { 'Accept': 'image/*' }
        });
        clearTimeout(timeout);

        if (!response.ok) {
            console.warn(`⚠️ Failed to fetch image for base64: ${response.status}`);
            return null;
        }

        const contentType = response.headers.get('content-type') || 'image/png';
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        // Map content type to Gemini-supported mime types
        let mimeType = contentType.split(';')[0].trim();
        if (mimeType === 'image/svg+xml') {
            console.warn('⚠️ SVG images not supported for vision, skipping');
            return null;
        }

        return { mimeType, data: base64 };
    } catch (error) {
        console.warn('⚠️ Image to base64 conversion failed:', error);
        return null;
    }
}

/**
 * Build Gemini parts array from multimodal content
 */
async function buildGeminiParts(content: string | MultimodalContent[]): Promise<any[]> {
    if (typeof content === 'string') {
        return [{ text: content }];
    }

    const parts: any[] = [];

    for (const item of content) {
        if (item.type === 'text') {
            parts.push({ text: item.text });
        } else if (item.type === 'image_url') {
            const imageData = await imageUrlToBase64(item.image_url.url);
            if (imageData) {
                parts.push({
                    inlineData: {
                        mimeType: imageData.mimeType,
                        data: imageData.data
                    }
                });
                console.log(`📸 Added image to Gemini request (${imageData.mimeType})`);
            }
        }
    }

    return parts;
}

/**
 * Build OpenRouter/Claude message content from multimodal content
 */
function buildClaudeContent(content: string | MultimodalContent[]): string | any[] {
    if (typeof content === 'string') {
        return content;
    }

    // Claude/OpenRouter format for multimodal
    return content.map(item => {
        if (item.type === 'text') {
            return { type: 'text', text: item.text };
        } else if (item.type === 'image_url') {
            return {
                type: 'image_url',
                image_url: { url: item.image_url.url }
            };
        }
        return item;
    });
}

/**
 * Call Gemini 3 Flash Preview API (supports multimodal input)
 * @param systemPrompt - System instruction
 * @param userPrompt - User message (string or multimodal content array)
 * @param options - Temperature, maxTokens
 * @returns Parsed response text or null if failed
 */
export async function callGemini(
    systemPrompt: string,
    userPrompt: string | MultimodalContent[],
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

        // Build multimodal parts
        const parts = await buildGeminiParts(userPrompt);
        const hasImages = parts.some(p => p.inlineData);

        if (hasImages) {
            console.log(`📸 Multimodal request with ${parts.filter(p => p.inlineData).length} image(s)`);
        }

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
                            parts
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
                    // Enable Google Search grounding for better insights (only when no images)
                    ...(hasImages ? {} : {
                        tools: [
                            {
                                googleSearch: {}
                            }
                        ]
                    })
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
 * Supports multimodal input (text + images)
 * @param systemPrompt - System instruction
 * @param userPrompt - User message (string or multimodal content array)
 * @param fallbackToOpenRouter - Whether to fallback to Claude via OpenRouter
 * @returns Parsed JSON object or null
 */
export async function callGeminiWithFallback<T = any>(
    systemPrompt: string,
    userPrompt: string | MultimodalContent[],
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
            // Build Claude-compatible content (supports multimodal)
            const claudeContent = buildClaudeContent(userPrompt);

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
                        { "role": "user", "content": claudeContent }
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
// Types are exported via named exports above (MultimodalContent, etc.)
