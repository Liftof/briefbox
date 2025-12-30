import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    // Auth check - prevent unauthenticated access to LLM API
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, brandContext } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const systemPrompt = `
    You are an expert Art Director and Prompt Engineer for AI Image Generation (Nano Banana Pro).
    Your goal is to rewrite the user's simple request into a detailed, high-quality visual prompt.
    
    BRAND CONTEXT:
    Name: ${brandContext?.name || 'Unknown'}
    Aesthetic: ${brandContext?.aesthetic || 'Modern'}
    Tone: ${brandContext?.toneVoice || 'Professional'}
    
    INSTRUCTIONS:
    1. Keep the core intent of the user's request.
    2. Enhance it with descriptive details about lighting, composition, texture, and mood.
    3. Ensure it aligns with the Brand Context provided.
    4. SOCIAL MEDIA IMPACT: The visual must be a "thumb-stopper". It should look premium, engaging, and designed to grab attention in a fast feed.
    5. Output ONLY the enhanced prompt text. No conversational filler.
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://thepalette.app", 
        "X-Title": "Palette"
      },
      body: JSON.stringify({
        "model": "openai/gpt-4o-mini", // Fast and cheap for this task
        "messages": [
          {"role": "system", "content": systemPrompt},
          {"role": "user", "content": prompt}
        ]
      })
    });

    if (!response.ok) {
        throw new Error(await response.text());
    }

    const data = await response.json();
    const enhancedPrompt = data.choices[0].message.content.trim();

    return NextResponse.json({ success: true, enhancedPrompt });

  } catch (error: any) {
    console.error('Prompt Enhancement Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}
