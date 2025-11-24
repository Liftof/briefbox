import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// NANO BANANA PRO - OPTIMIZED PROMPT SYSTEM
// Based on official Gemini/Nano Banana documentation
// ============================================================================
// KEY INSIGHT: "A narrative, descriptive paragraph will almost always produce
// a better, more coherent image than a list of disconnected words."
// ============================================================================

// Post type templates - based on official Google templates
const POST_TEMPLATES = {
  announcement: {
    structure: `Create a bold social media announcement graphic for [BRAND]. 
The text "[HEADLINE]" should be displayed prominently in a [FONT_STYLE] font, centered on a [BACKGROUND]. 
Below, add smaller text: "[SUBTEXT]". 
The overall design should feel [MOOD], with the brand colors [COLORS] used as accents.
Include the brand logo small in the [LOGO_POSITION].`,
    example: 'announcement, product launch, feature release'
  },
  testimonial: {
    structure: `Create a professional testimonial graphic for [BRAND].
Feature a large quote: "[QUOTE]" in elegant [FONT_STYLE] typography on a [BACKGROUND].
Add quotation marks as decorative elements in [ACCENT_COLOR].
At the bottom, include attribution: "[ATTRIBUTION]" in smaller text.
The mood should be [MOOD] and trustworthy. Brand logo in [LOGO_POSITION].`,
    example: 'customer quote, review, social proof'
  },
  statistic: {
    structure: `Create a data-driven social media graphic for [BRAND].
The hero element is a massive "[STAT]" number in bold [FONT_STYLE] font, colored [ACCENT_COLOR].
Below, add context: "[CONTEXT]" in smaller, lighter text.
Background is a [BACKGROUND] with subtle geometric shapes or gradients.
Brand logo in [LOGO_POSITION]. Overall feel: [MOOD].`,
    example: 'metric, percentage, growth number'
  },
  product: {
    structure: `Create a high-quality product showcase for [BRAND].
The product [PRODUCT_DESC] should be the hero, displayed at 60% scale on a [BACKGROUND].
Use [LIGHTING] lighting to create depth and premium feel.
Add a subtle headline: "[HEADLINE]" in [FONT_STYLE] typography.
Brand logo in [LOGO_POSITION]. The overall mood is [MOOD].`,
    example: 'product hero, feature showcase'
  },
  educational: {
    structure: `Create an informative social media graphic for [BRAND].
The headline "[HEADLINE]" should be bold and attention-grabbing in [FONT_STYLE] font.
Below, visualize [CONTENT_DESC] using clean iconography or simple illustrations.
Background is [BACKGROUND] with brand colors [COLORS] as accents.
Brand logo in [LOGO_POSITION]. Style should be [MOOD] and easy to understand.`,
    example: 'how-to, tips, infographic'
  },
  minimal: {
    structure: `Create a minimalist social media graphic for [BRAND].
A single [SUBJECT] positioned in the [POSITION] of the frame.
The background is a vast, empty [BACKGROUND] canvas, creating significant negative space.
If text is needed, "[TEXT]" should be small and elegant in [FONT_STYLE].
Brand logo subtle in [LOGO_POSITION]. The mood is [MOOD] and premium.`,
    example: 'brand awareness, aesthetic post'
  }
};

// Style presets with narrative descriptions
const STYLE_PRESETS = {
  editorial: {
    background: 'rich dark gradient with subtle noise texture',
    fontStyle: 'elegant serif or refined sans-serif',
    lighting: 'soft, diffused studio',
    mood: 'sophisticated, premium, magazine-quality',
    logoPosition: 'top-right corner, small and crisp'
  },
  bold: {
    background: 'high-contrast gradient with geometric shapes',
    fontStyle: 'heavy, impactful sans-serif',
    lighting: 'dramatic with deep shadows',
    mood: 'energetic, confident, attention-grabbing',
    logoPosition: 'bottom-left corner, bold'
  },
  minimal: {
    background: 'clean white or soft neutral gradient',
    fontStyle: 'thin, elegant sans-serif',
    lighting: 'soft, even, no harsh shadows',
    mood: 'calm, premium, understated luxury',
    logoPosition: 'center-bottom, refined'
  },
  lifestyle: {
    background: 'warm, natural tones with soft texture',
    fontStyle: 'friendly, approachable sans-serif',
    lighting: 'golden hour, natural warmth',
    mood: 'authentic, human, relatable',
    logoPosition: 'top-left corner, casual'
  },
  corporate: {
    background: 'professional navy or charcoal gradient',
    fontStyle: 'clean, trustworthy sans-serif',
    lighting: 'flat, professional studio',
    mood: 'authoritative, trustworthy, competent',
    logoPosition: 'top-right corner, prominent'
  },
  raw: {
    background: 'textured, gritty, with film grain',
    fontStyle: 'bold, slightly rough or handwritten',
    lighting: 'direct flash or harsh natural',
    mood: 'authentic, edgy, anti-corporate',
    logoPosition: 'corner, stamp-like'
  }
} as const;

type StyleKey = keyof typeof STYLE_PRESETS;
type PostTypeKey = keyof typeof POST_TEMPLATES;

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
    const secondaryColor = colors[1] || colors[0];
    const tagline = brand.tagline || '';

    // Generate narrative prompt using GPT
    const prompt = await generateNarrativePrompt({
      brief,
      brandName,
      primaryColor,
      secondaryColor,
      tagline,
      style,
      archetype
    });

    return NextResponse.json({
      success: true,
      concept: {
        finalPrompt: prompt.main,
        negativePrompt: prompt.negative,
        style: archetype,
        postType: prompt.postType
      },
      metadata: {
        archetype,
        postType: prompt.postType,
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
// NARRATIVE PROMPT GENERATOR
// ============================================================================
async function generateNarrativePrompt(params: {
  brief: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  tagline: string;
  style: typeof STYLE_PRESETS[StyleKey];
  archetype: string;
}): Promise<{ main: string; negative: string; postType: string }> {
  const { brief, brandName, primaryColor, secondaryColor, tagline, style, archetype } = params;

  // System prompt based on official Google best practices
  const systemPrompt = `You are a creative director generating prompts for Nano Banana Pro image generation.

CRITICAL RULES (from official documentation):
1. Write NARRATIVE PARAGRAPHS, not keyword lists
2. Be HYPER-SPECIFIC with visual details
3. Include EXACT TEXT to render when needed (the model can render text accurately)
4. Describe the INTENT and PURPOSE of the image
5. Use STEP-BY-STEP instructions for complex compositions

POST TYPES you can create:
- announcement: Bold headline, brand announcement
- testimonial: Customer quote with attribution
- statistic: Big number/metric as hero
- product: Product showcase with context
- educational: Tips, how-to, informative
- minimal: Negative space, single element

OUTPUT FORMAT (JSON):
{
  "postType": "announcement|testimonial|statistic|product|educational|minimal",
  "headline": "The main text to display (if any)",
  "subtext": "Secondary text (if any)", 
  "visualDescription": "Detailed narrative description of the complete image",
  "textPlacement": "Where and how text should appear"
}`;

  const userPrompt = `Create a social media graphic for:

BRAND: ${brandName}
TAGLINE: ${tagline || 'N/A'}
PRIMARY COLOR: ${primaryColor}
SECONDARY COLOR: ${secondaryColor}
STYLE: ${archetype} - ${style.mood}

USER BRIEF: "${brief}"

Generate a detailed, narrative prompt following these style guidelines:
- Background: ${style.background}
- Typography: ${style.fontStyle}
- Lighting: ${style.lighting}
- Logo placement: ${style.logoPosition}
- Overall mood: ${style.mood}

Remember:
- Write a flowing paragraph describing the complete scene
- If the brief suggests text/headline, include the EXACT text to render
- Be hyper-specific about colors, positions, and visual elements
- Describe the purpose and emotional impact`;

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
        temperature: 0.85,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error('GPT failed');
    }

    const data = await response.json();
    let text = data.choices[0].message.content.trim();
    
    // Parse JSON from response
    text = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found');
    }
    
    const conceptData = JSON.parse(jsonMatch[0]);

    // Assemble final narrative prompt
    const finalPrompt = assembleNarrativePrompt({
      conceptData,
      brandName,
      primaryColor,
      secondaryColor,
      style
    });

    return {
      main: finalPrompt,
      negative: `blurry, low quality, distorted text, misspelled words, amateur design, cluttered, messy layout, wrong colors, pixelated, watermark, stock photo watermark, generic clip art`,
      postType: conceptData.postType || 'announcement'
    };

  } catch (error) {
    console.warn('GPT prompt generation failed, using template fallback');
    
    // Fallback to template-based prompt
    return createTemplatePrompt({
      brief,
      brandName,
      primaryColor,
      secondaryColor,
      style
    });
  }
}

function assembleNarrativePrompt(params: {
  conceptData: any;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  style: typeof STYLE_PRESETS[StyleKey];
}): string {
  const { conceptData, brandName, primaryColor, secondaryColor, style } = params;

  // Build a flowing narrative paragraph
  let prompt = `Create a ${style.mood} social media graphic for ${brandName}. `;
  
  // Add the visual description
  if (conceptData.visualDescription) {
    prompt += conceptData.visualDescription + ' ';
  }
  
  // Add text rendering instructions if there's a headline
  if (conceptData.headline) {
    prompt += `The text "${conceptData.headline}" should be displayed prominently in ${style.fontStyle} typography. `;
  }
  
  if (conceptData.subtext) {
    prompt += `Below, add smaller text: "${conceptData.subtext}". `;
  }
  
  // Add style specifications
  prompt += `The background should be ${style.background}, using ${primaryColor} as the primary brand color and ${secondaryColor} as an accent. `;
  prompt += `Use ${style.lighting} lighting to create the right atmosphere. `;
  prompt += `The ${brandName} logo should appear ${style.logoPosition}, crisp and legible. `;
  
  // Add quality modifiers
  prompt += `The overall quality should be professional, high-resolution, suitable for LinkedIn or Instagram. Sharp details, perfect typography alignment, polished finish.`;

  return prompt;
}

function createTemplatePrompt(params: {
  brief: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  style: typeof STYLE_PRESETS[StyleKey];
}): { main: string; negative: string; postType: string } {
  const { brief, brandName, primaryColor, secondaryColor, style } = params;

  // Extract potential headline from brief (first sentence or first 50 chars)
  const headline = brief.split('.')[0].slice(0, 50);
  
  const prompt = `Create a ${style.mood} social media announcement graphic for ${brandName}. 

The design features a ${style.background} as the backdrop. 
${headline.length > 10 ? `The headline "${headline}" is displayed in bold ${style.fontStyle} typography, centered in the upper third of the image.` : ''}
The brand's primary color ${primaryColor} is used for key accents and the secondary color ${secondaryColor} adds subtle contrast.
${style.lighting} lighting gives the composition depth and professionalism.
The ${brandName} logo appears ${style.logoPosition}, small but crisp and perfectly legible.
The overall feel is ${style.mood}, designed to stop the scroll and communicate brand authority.
High-resolution, sharp details, professional social media quality.`;

  return {
    main: prompt,
    negative: `blurry, low quality, distorted text, amateur, cluttered, wrong colors, pixelated, watermark, generic`,
    postType: 'announcement'
  };
}

// ============================================================================
// GET: Available styles and post types
// ============================================================================
export async function GET() {
  return NextResponse.json({
    styles: Object.entries(STYLE_PRESETS).map(([key, value]) => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      mood: value.mood,
      background: value.background
    })),
    postTypes: Object.keys(POST_TEMPLATES)
  });
}
