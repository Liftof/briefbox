import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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

// Create a gradient swatch to hint at the model we want gradients, not solid colors
const createGradientSwatch = async (hex1: string, hex2: string) => {
  const color1 = hexToRgb(hex1 || '#1a1a2e');
  const color2 = hexToRgb(hex2 || '#0066ff');
  
  // Create a simple vertical gradient using raw pixel data
  const width = 512;
  const height = 512;
  const channels = 3;
  const pixels = Buffer.alloc(width * height * channels);
  
  for (let y = 0; y < height; y++) {
    const ratio = y / height;
    const r = Math.round(color1.r + (color2.r - color1.r) * ratio);
    const g = Math.round(color1.g + (color2.g - color1.g) * ratio);
    const b = Math.round(color1.b + (color2.b - color1.b) * ratio);
    
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
    }
  }
  
  const buffer = await sharp(pixels, {
    raw: { width, height, channels }
  })
    .png()
    .toBuffer();
    
  return `data:image/png;base64,${buffer.toString('base64')}`;
};

const buildPrompt = (brand: BrandContext | undefined, idea: string, index: number) => {
  const colors = Array.isArray(brand?.colors) ? brand?.colors : ['#1a1a2e', '#0066ff', '#00cc88'];
  const primaryColor = colors[0] || '#1a1a2e';
  const secondaryColor = colors[1] || '#0066ff';
  const accentColor = colors[2] || '#00cc88';
  
  // SUBTLE, MINIMAL background styles - premium and understated
  // Focus on texture and subtle gradients, NOT busy patterns
  const backgroundStyles = [
    {
      // Style 1: Subtle gradient - very smooth
      prompt: `Minimal smooth gradient from ${primaryColor} to dark black. 
Very subtle color transition, almost imperceptible. 
Fine film grain texture. Cinematic, premium feel.
Like a luxury brand background or high-end app.`
    },
    {
      // Style 2: Soft blur - gentle and organic
      prompt: `Very soft out-of-focus color wash.
Gentle blend of ${secondaryColor} fading into darkness.
Extremely subtle, like a faint aurora or soft light leak.
Minimal, elegant, understated. Almost monochrome.`
    },
    {
      // Style 3: Fine texture - paper or fabric
      prompt: `Subtle paper texture background in dark ${primaryColor}.
Very fine grain, like premium stationery or matte finish.
Sophisticated and minimal. Almost solid but with depth.
No patterns, no shapes, just texture.`
    },
    {
      // Style 4: Gradient with subtle noise
      prompt: `Dark gradient background fading from ${primaryColor} to black.
Subtle noise overlay for texture. Minimal and elegant.
Like a premium app dark mode or luxury brand.
No bright colors, no busy patterns.`
    }
  ];
  
  const style = backgroundStyles[index % backgroundStyles.length];

  return `${style.prompt}

ABSOLUTE RULES - MUST FOLLOW:
- NO TEXT whatsoever - no letters, no numbers, no words
- NO logos, icons, symbols, or watermarks
- NO busy patterns or complex shapes
- ONLY subtle gradients and fine textures
- Must be dark enough for white text overlay
- Premium, minimal, understated aesthetic

Think: Apple keynote backgrounds, Stripe dark gradients, luxury fashion brands.`;
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
  // Auth check - prevent unauthenticated access to expensive FAL image generation
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

    const palette = Array.isArray(brand?.colors) && brand?.colors.length > 0 ? brand?.colors : ['#1a1a2e', '#0066ff'];
    
    // Create a gradient swatch instead of solid color (helps model understand we want gradients)
    const referenceSwatch = await createGradientSwatch(palette[0], palette[1] || palette[0]);

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

