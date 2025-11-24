import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// NANO BANANA PRO - OPTIMIZED PROMPT SYSTEM
// ============================================================================
// This model is IMAGE-TO-IMAGE. It transforms reference images.
// Prompts must be SHORT, VISUAL, CONCRETE - not design system jargon.
// ============================================================================

// Style presets - short, evocative, concrete
const STYLE_PRESETS = {
  editorial: {
    prefix: "Editorial magazine layout,",
    style: "Kinfolk aesthetic, desaturated, film grain, asymmetric composition, generous negative space",
    lighting: "soft window light, long shadows",
    avoid: "saturated, centered, busy, stock photo"
  },
  bold: {
    prefix: "Bold graphic design,",
    style: "Pentagram-level design, strong geometric shapes, high contrast, confident typography",
    lighting: "dramatic directional light, deep blacks",
    avoid: "soft, subtle, corporate, safe"
  },
  minimal: {
    prefix: "Minimalist luxury,",
    style: "Acne Studios aesthetic, 90% whitespace, single focal point, premium materials",
    lighting: "soft even light, subtle shadows",
    avoid: "busy, colorful, cluttered, detailed"
  },
  lifestyle: {
    prefix: "Lifestyle photography,",
    style: "Everlane campaign, natural moments, warm authentic feel, shallow depth of field",
    lighting: "golden hour, natural window light",
    avoid: "staged, corporate, cold, studio"
  },
  corporate: {
    prefix: "Professional business visual,",
    style: "Clean, trustworthy, structured grid, brand colors prominent",
    lighting: "flat even lighting, no harsh shadows",
    avoid: "artistic, moody, casual, textured"
  },
  raw: {
    prefix: "Raw authentic aesthetic,",
    style: "Supreme lookbook, flash photography, high contrast, grain, anti-corporate",
    lighting: "direct flash, harsh, unapologetic",
    avoid: "polished, perfect, soft, pastel"
  }
} as const;

type StyleKey = keyof typeof STYLE_PRESETS;

// Visual hooks that work for image-to-image
const VISUAL_HOOKS = [
  "Product hero on gradient",
  "Bold stat typography",
  "Testimonial quote layout",
  "Before/after split",
  "Feature highlight",
  "Team/culture moment",
  "Process visualization",
  "Social proof grid"
];

// ============================================================================
// MAIN API
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brief, brand, archetype = 'editorial' } = body;

    if (!brief || !brand) {
      return NextResponse.json(
        { success: false, error: 'Brief and brand data required' },
        { status: 400 }
      );
    }

    // Get style preset
    const style = STYLE_PRESETS[archetype as StyleKey] || STYLE_PRESETS.editorial;
    
    // Extract brand essentials
    const brandName = brand.name || 'Brand';
    const colors = Array.isArray(brand.colors) ? brand.colors : ['#000000'];
    const primaryColor = colors[0];
    const aesthetic = Array.isArray(brand.aesthetic) ? brand.aesthetic[0] : 'modern';

    // Generate SHORT, CONCRETE prompt
    const prompt = await generateShortPrompt({
      brief,
      brandName,
      primaryColor,
      aesthetic,
      style
    });

    return NextResponse.json({
      success: true,
      concept: {
        finalPrompt: prompt.main,
        negativePrompt: prompt.negative,
        style: archetype
      },
      metadata: {
        archetype,
        promptLength: prompt.main.length
      }
    });

  } catch (error: any) {
    console.error('Creative Director Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed' },
      { status: 500 }
    );
  }
}

// ============================================================================
// SHORT PROMPT GENERATOR
// ============================================================================
async function generateShortPrompt(params: {
  brief: string;
  brandName: string;
  primaryColor: string;
  aesthetic: string;
  style: typeof STYLE_PRESETS[StyleKey];
}): Promise<{ main: string; negative: string }> {
  const { brief, brandName, primaryColor, aesthetic, style } = params;

  // Use GPT to extract the CORE visual concept in 1-2 sentences
  const systemPrompt = `You create ULTRA-SHORT image prompts for an AI image model.

RULES:
1. Output max 50 words
2. Describe VISUAL elements only (colors, shapes, composition, mood)
3. NO design jargon (no "zones", "hierarchy", "CTA", "glassmorphism")
4. NO layout instructions (the AI can't read)
5. Reference CONCRETE aesthetics (magazine names, photographer styles, brand examples)
6. Always mention: color palette, lighting, texture, one focal element

EXAMPLES OF GOOD PROMPTS:
- "Dark navy gradient background, bold white sans-serif typography centered, subtle grain texture, single gold accent line, Massimo Vignelli influence"
- "Product floating on matte black surface, soft rim light from left, long shadow, Apple product photography style, ultra-clean"
- "Split composition, left side warm orange gradient, right side photo with film grain, diagonal divider, 90s graphic design revival"`;

  const userPrompt = `Brand: ${brandName}
Brief: "${brief}"
Color: ${primaryColor}
Style direction: ${style.prefix} ${style.style}

Create a 30-40 word visual prompt. Focus on: composition, color treatment, texture, one hero element. Be CONCRETE and VISUAL.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.9,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error('GPT failed');
    }

    const data = await response.json();
    let generatedPrompt = data.choices[0].message.content.trim();
    
    // Clean up any markdown or quotes
    generatedPrompt = generatedPrompt.replace(/^["']|["']$/g, '').trim();

    // Append style modifiers and quality tags
    const finalPrompt = `${generatedPrompt}, ${style.lighting}, professional quality, trending on Behance, award-winning design`;

    return {
      main: finalPrompt,
      negative: `${style.avoid}, amateur, blurry, low quality, watermark, text errors, distorted, AI artifacts, oversaturated, generic stock photo, clipart, 3D render`
    };

  } catch (error) {
    // Fallback to template-based prompt
    console.warn('GPT prompt generation failed, using fallback');
    
    return {
      main: `${style.prefix} ${brief.slice(0, 50)}, ${primaryColor} color accent, ${style.style}, ${style.lighting}, professional quality`,
      negative: `${style.avoid}, amateur, blurry, low quality, watermark, generic`
    };
  }
}

// ============================================================================
// GET: Available styles
// ============================================================================
export async function GET() {
  return NextResponse.json({
    archetypes: Object.entries(STYLE_PRESETS).map(([key, value]) => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      description: value.style,
      prefix: value.prefix
    }))
  });
}
