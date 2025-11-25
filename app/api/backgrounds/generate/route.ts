import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { fal } from '@fal-ai/client';

fal.config({
  credentials: process.env.FAL_KEY,
});

const MAX_BACKGROUNDS = 3;

type BrandContext = {
  name?: string;
  colors?: string[];
  aesthetic?: string[] | string;
  toneVoice?: string[] | string;
  visualMotifs?: string[];
  backgroundPrompts?: string[];
};

const hexToRgb = (hex: string) => {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  if (Number.isNaN(bigint)) {
    return { r: 20, g: 20, b: 20 };
  }
  if (clean.length === 3) {
    return {
      r: ((bigint >> 8) & 0xf) * 17,
      g: ((bigint >> 4) & 0xf) * 17,
      b: (bigint & 0xf) * 17,
    };
  }
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const createColorSwatch = async (hex: string) => {
  const { r, g, b } = hexToRgb(hex || '#111111');
  const buffer = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 3,
      background: { r, g, b },
    },
  })
    .png()
    .toBuffer();
  return `data:image/png;base64,${buffer.toString('base64')}`;
};

const buildPrompt = (brand: BrandContext | undefined, idea: string, index: number) => {
  const primaryColor = Array.isArray(brand?.colors) ? brand?.colors[0] : (brand?.colors || '#1a1a2e');
  
  // Different background styles for variety
  const backgroundStyles = [
    {
      type: 'gradient',
      prompt: `Smooth vertical gradient from ${primaryColor} at top to deep black at bottom. Ultra-clean, no elements, subtle film grain texture. Premium minimal aesthetic.`
    },
    {
      type: 'blur',
      prompt: `Soft blurred abstract color field. Primary color ${primaryColor} with darker edges. Dreamy, out-of-focus, ethereal quality. Like a defocused light or aurora. Smooth transitions.`
    },
    {
      type: 'grid',
      prompt: `Very subtle geometric grid pattern. Fine lines in ${primaryColor} on dark charcoal background. Lines barely visible at 10-15% opacity. Clean, technical, modern. Think: blueprint aesthetic but minimal.`
    }
  ];
  
  const style = backgroundStyles[index % backgroundStyles.length];

  return `${style.prompt}

Requirements:
- Perfect for social media post backgrounds
- Must work with white text overlay
- No objects, icons, logos, or text
- Professional quality, 8K resolution
- Symmetrical and balanced composition

Style reference: Apple keynote backgrounds, Stripe website gradients, Linear app aesthetics.`;
};

const extractImageFromResult = (result: any) => {
  if (Array.isArray(result?.images) && result.images[0]) {
    return result.images[0].url || result.images[0].image;
  }
  if (result?.image) {
    return result.image.url || result.image;
  }
  if (Array.isArray(result?.data?.images) && result.data.images[0]) {
    return result.data.images[0].url || result.data.images[0].image;
  }
  return null;
};

export async function POST(request: NextRequest) {
  if (!process.env.FAL_KEY) {
    console.error('❌ Error: FAL_KEY is missing in environment variables.');
    return NextResponse.json({ success: false, error: 'Server configuration error: Missing API Key (FAL_KEY)' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const brand: BrandContext | undefined = body.brand;
    const prompts: string[] =
      body.prompts ||
      (Array.isArray(brand?.backgroundPrompts) ? brand?.backgroundPrompts : []);

    const cleanedPrompts = prompts.filter((p) => typeof p === 'string' && p.trim()).slice(0, MAX_BACKGROUNDS);

    if (!cleanedPrompts.length) {
      return NextResponse.json({ success: false, error: 'No background prompts provided' }, { status: 400 });
    }

    const palette = Array.isArray(brand?.colors) && brand?.colors.length > 0 ? brand?.colors : ['#111111'];
    const referenceSwatch = await createColorSwatch(palette[0]);

    const generationTasks = cleanedPrompts.map(async (prompt: string, index: number) => {
      const styledPrompt = buildPrompt(brand, prompt, index);

      try {
        const result: any = await fal.subscribe('fal-ai/nano-banana-pro/edit', {
          input: {
            prompt: styledPrompt,
            num_images: 1,
            aspect_ratio: '1:1',
            output_format: 'png',
            image_urls: [referenceSwatch],
            resolution: '1K',
          },
          logs: false,
        });

        const imageUrl = extractImageFromResult(result);
        return imageUrl || null;
      } catch (error: any) {
        // Don't log full error for 403/rate limits - it's expected sometimes
        if (error.status === 403 || error.status === 429) {
          console.warn('Background generation skipped (service busy)');
        } else {
          console.error('Background generation error:', error.message || error);
        }
        return null;
      }
    });

    const backgrounds = (await Promise.all(generationTasks)).filter(Boolean) as string[];

    if (!backgrounds.length) {
      return NextResponse.json({ success: false, error: 'Background generation failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, backgrounds });
  } catch (error: any) {
    console.error('Background API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unexpected error while generating backgrounds' },
      { status: 500 }
    );
  }
}

