import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// CREATIVE DIRECTOR - SIMPLE & CREATIVE
// ============================================================================
// Less structure, more creativity. Let GPT be an actual creative director,
// not a template filler.
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brief, brand, archetype = '' } = body;

    if (!brief || !brand) {
      return NextResponse.json(
        { success: false, error: 'Brief and brand data required' },
        { status: 400 }
      );
    }

    // Extract brand essentials
    const brandName = brand.name || 'Brand';
    const colors = Array.isArray(brand.colors) ? brand.colors : ['#000000'];
    const primaryColor = colors[0];
    const aesthetic = Array.isArray(brand.aesthetic) ? brand.aesthetic.join(', ') : (brand.aesthetic || '');
    const industry = brand.industry || '';

    // Generate creative prompt
    const prompt = await generateCreativePrompt({
      brief,
      brandName,
      primaryColor,
      aesthetic,
      industry,
      archetype
    });

    return NextResponse.json({
      success: true,
      concept: {
        finalPrompt: prompt,
        negativePrompt: 'blurry, low quality, amateur, ugly, distorted, watermark, stock photo, generic, boring, corporate cliché, cringe',
        style: archetype || 'creative'
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

async function generateCreativePrompt(params: {
  brief: string;
  brandName: string;
  primaryColor: string;
  aesthetic: string;
  industry: string;
  archetype: string;
}): Promise<string> {
  const { brief, brandName, primaryColor, aesthetic, industry, archetype } = params;

  const systemPrompt = `Tu es un directeur artistique créatif pour des visuels social media.

TON JOB: Transformer un brief en une description visuelle UNIQUE et CRÉATIVE.

RÈGLES:
- Sois CRÉATIF, pas générique. Chaque marque mérite un visuel unique.
- Décris une SCÈNE ou une COMPOSITION concrète, pas des concepts abstraits
- Utilise des références visuelles précises (artistes, magazines, films, époques)
- Intègre les couleurs de marque de façon organique
- JAMAIS de clichés corporate (poignées de main, gens en costume devant des graphiques)
- JAMAIS de "premium", "professional", "high-quality" - ces mots sont vides
- Pense INSTAGRAM/LINKEDIN qui arrête le scroll

FORMAT: Un paragraphe de 2-3 phrases maximum. Direct, visuel, évocateur.

EXEMPLES DE BONS OUTPUTS:
- "Gros plan sur une main tenant un smartphone, l'écran reflète des données qui semblent flotter. Ambiance néon bleu et violet, style Blade Runner. Le logo apparaît comme un hologramme subtil."
- "Flat lay minimaliste sur marbre blanc: le produit au centre, entouré de feuilles d'eucalyptus et de gouttes d'eau. Lumière naturelle douce, ombres longues. Vibe Kinfolk magazine."
- "Typography bold qui prend tout l'espace: le chiffre '47%' en rouge sang sur fond noir mat. Petite baseline en bas. Brutaliste, Massimo Vignelli."`;

  const userPrompt = `MARQUE: ${brandName}
INDUSTRIE: ${industry || 'N/A'}
COULEUR PRINCIPALE: ${primaryColor}
ESTHÉTIQUE: ${aesthetic || 'À définir'}
${archetype ? `STYLE SOUHAITÉ: ${archetype}` : ''}

BRIEF CLIENT: "${brief}"

Crée une description visuelle unique pour ce brief. Sois créatif, pas corporate.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 1.0, // Max creativity
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error('GPT failed');
    }

    const data = await response.json();
    const generatedPrompt = data.choices[0].message.content.trim();
    
    console.log('🎨 Creative Director output:', generatedPrompt);
    
    return generatedPrompt;

  } catch (error) {
    console.warn('Creative Director failed, using brief directly');
    // Fallback: just use the brief with minimal enhancement
    return `${brief}. Style: ${aesthetic || 'modern'}. Brand color: ${primaryColor}.`;
  }
}

export async function GET() {
  return NextResponse.json({
    styles: ['editorial', 'bold', 'minimal', 'lifestyle', 'raw'],
    note: 'Styles are suggestions, not rigid templates'
  });
}
