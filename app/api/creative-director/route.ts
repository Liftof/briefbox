import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// CREATIVE DIRECTOR - STATIC SOCIAL MEDIA GRAPHICS
// ============================================================================
// Output: LinkedIn/Instagram STATIC POSTS (graphic design, not photos)
// Think: Bold typography, brand colors, clean layouts, text overlays
// NOT: Cinematic scenes, photographs, 3D renders
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
    const secondaryColor = colors[1] || '#ffffff';
    const aesthetic = Array.isArray(brand.aesthetic) ? brand.aesthetic.join(', ') : (brand.aesthetic || '');

    // Generate creative prompt
    const prompt = await generateCreativePrompt({
      brief,
      brandName,
      primaryColor,
      secondaryColor,
      aesthetic,
      archetype
    });

    return NextResponse.json({
      success: true,
      concept: {
        finalPrompt: prompt,
        negativePrompt: 'photograph, photo, realistic scene, 3D render, cinematic, people, office, desk, hands, blurry, low quality, stock photo',
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
  secondaryColor: string;
  aesthetic: string;
  archetype: string;
}): Promise<string> {
  const { brief, brandName, primaryColor, secondaryColor, aesthetic, archetype } = params;

  const systemPrompt = `Tu es un graphic designer créant des POSTS STATIQUES pour LinkedIn/Instagram.

⚠️ IMPORTANT: Tu crées du GRAPHIC DESIGN, PAS des photos ou des scènes.

FORMAT DE SORTIE: Une description de design graphique avec:
- Le fond (gradient, couleur unie, texture)
- La typographie (headline, style, placement)
- Les éléments graphiques (formes, lignes, icônes)
- Le logo et son placement
- Les couleurs utilisées

EXEMPLES DE BONS OUTPUTS:

1. "Fond gradient du ${primaryColor} vers noir. Grande typo bold blanche centrée: 'VOTRE HEADLINE ICI'. Ligne horizontale fine en accent. Logo ${brandName} petit en bas à droite. Style épuré, moderne."

2. "Fond ${primaryColor} uni avec texture grain subtile. Gros chiffre '47%' en blanc qui prend 60% de l'espace. Sous-titre en petit: 'de croissance'. Logo en haut à gauche. Minimaliste, impactant."

3. "Split design: moitié gauche ${primaryColor}, moitié droite blanc. Citation client en typo serif élégante qui chevauche les deux côtés. Guillemets géants en accent. Logo centré en bas."

4. "Fond noir mat. Formes géométriques abstraites en ${primaryColor} dans les coins. Headline en typo condensed blanche: 'LE MESSAGE CLÉ'. Baseline plus petite en dessous. Logo discret."

CE QUE TU NE FAIS JAMAIS:
- Décrire des photos (pas de "bureau", "personne", "écran", "main")
- Décrire des scènes cinématiques
- Utiliser "lumière naturelle", "ombres", "profondeur de champ"
- Créer des rendus 3D ou des illustrations complexes

TON OUTPUT = Instructions pour un GRAPHISTE, pas pour un PHOTOGRAPHE.`;

  const userPrompt = `MARQUE: ${brandName}
COULEURS: ${primaryColor} (principale), ${secondaryColor} (secondaire)
ESTHÉTIQUE: ${aesthetic || 'moderne et clean'}
${archetype ? `STYLE: ${archetype}` : ''}

BRIEF: "${brief}"

Crée un design de post social media statique. Décris le layout graphique, pas une photo.`;

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
        temperature: 0.9,
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
    console.warn('Creative Director failed, using fallback');
    // Fallback: simple graphic design prompt
    return `Social media post design. Background: gradient from ${primaryColor} to dark. Large bold white headline text centered. ${brandName} logo small in corner. Clean, modern, minimal graphic design style.`;
  }
}

export async function GET() {
  return NextResponse.json({
    styles: ['editorial', 'bold', 'minimal', 'corporate', 'raw'],
    format: 'static social media graphic design'
  });
}
