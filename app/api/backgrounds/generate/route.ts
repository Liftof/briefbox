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
  const colors = Array.isArray(brand?.colors) ? brand?.colors.join(', ') : brand?.colors;
  const aesthetic = Array.isArray(brand?.aesthetic) ? brand?.aesthetic.join(', ') : brand?.aesthetic;
  const tone = Array.isArray(brand?.toneVoice) ? brand?.toneVoice.join(', ') : brand?.toneVoice;
  const motifs = Array.isArray(brand?.visualMotifs) ? brand?.visualMotifs.join(', ') : '';

  return `
ROLE: Senior Surface & Editorial Designer.
TASK: Craft a premium background texture for ${brand?.name || 'the brand'} social media carousels.

BRIEF #${index + 1}: ${idea}

BRAND REFERENCES:
- Palette: ${colors || 'Use tasteful deep neutrals'}
- Aesthetic keywords: ${aesthetic || 'Minimal, editorial, premium'}
- Tone: ${tone || 'Confident, calm'}
- Visual motifs to echo: ${motifs || 'Subtle geometric cues'}

GUIDELINES:
- Create a layered composition mixing soft gradients, tactile grain, paper or fabric textures, and refined geometric or organic motifs.
- Keep negative space for typography overlays, no text, no UI elements, no logos, no icons, no people.
- Avoid cliché AI neon swirls, glossy plastic, or obvious diffusion artifacts.
- Make it feel art-directed, print-ready, with tasteful noise and depth.
- Format: square background, ready for LinkedIn / Instagram static posts.
`;
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
      } catch (error) {
        console.error('Background generation error:', error);
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

