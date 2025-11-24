import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// VISUAL ARCHETYPES - 6 distinct art directions
// ============================================================================
export const VISUAL_ARCHETYPES = {
  editorial: {
    name: 'Editorial',
    description: 'Magazine haut de gamme, sophistiqué',
    lighting: 'Studio diffus, ombres douces et longues, contre-jour subtil',
    composition: 'Asymétrique, rule of thirds, beaucoup de negative space',
    colorTreatment: 'Désaturé, tons neutres avec un accent de couleur',
    texture: 'Grain film 35mm, légère vignette',
    mood: 'Élégant, contemplatif, premium',
    references: 'Kinfolk Magazine, Cereal Magazine, Aesop campaigns',
    negativePrompt: 'saturated colors, busy background, centered composition, stock photo style, plastic look, neon, cluttered'
  },
  lifestyle: {
    name: 'Lifestyle',
    description: 'Authentique, aspirationnel, humain',
    lighting: 'Golden hour naturelle, lumière de fenêtre, chaleureux',
    composition: 'Contexte de vie visible, angle 3/4, profondeur de champ courte',
    colorTreatment: 'Tons chauds, légèrement désaturé, palette terre',
    texture: 'Soft focus sur arrière-plan, bokeh naturel',
    mood: 'Chaleureux, accessible, désirable',
    references: 'Apple lifestyle shots, Everlane, Glossier',
    negativePrompt: 'studio lighting, white background, isolated product, corporate, cold colors, harsh shadows'
  },
  corporate: {
    name: 'Corporate',
    description: 'Professionnel, trustworthy, clean',
    lighting: 'Flat et uniforme, pas d\'ombres dures, lumineux',
    composition: 'Centré ou grid-based, symétrique, aligné',
    colorTreatment: 'Couleurs de marque pures, fond blanc ou gris neutre',
    texture: 'Lisse, net, pas de grain',
    mood: 'Confiance, sérieux, compétence',
    references: 'IBM, Salesforce, McKinsey',
    negativePrompt: 'artistic, moody, dark shadows, warm tones, casual, playful, textured, grainy'
  },
  bold: {
    name: 'Bold',
    description: 'Impactant, moderne, graphique',
    lighting: 'Contrasté, éclairage dramatique, couleurs vives',
    composition: 'Graphique, formes géométriques, lignes fortes',
    colorTreatment: 'Saturé, couleurs primaires, contraste élevé',
    texture: 'Flat design ou 3D stylisé, clean edges',
    mood: 'Énergique, confiant, disruptif',
    references: 'Spotify Wrapped, Notion, Linear',
    negativePrompt: 'muted colors, soft, subtle, traditional, conservative, photorealistic, detailed textures'
  },
  minimal: {
    name: 'Minimal',
    description: 'Élégant, luxury, épuré',
    lighting: 'Doux, gradients subtils, lumière diffuse',
    composition: '90% negative space, un seul point focal, centré',
    colorTreatment: 'Monochrome ou bichrome, pastels, neutrals',
    texture: 'Ultra-lisse, parfois légère ombre portée',
    mood: 'Sophistiqué, calme, premium',
    references: 'Apple product shots, Acne Studios, COS',
    negativePrompt: 'busy, cluttered, multiple elements, bright colors, complex backgrounds, detailed, textured'
  },
  raw: {
    name: 'Raw',
    description: 'Authentique, lo-fi, anti-corporate',
    lighting: 'Flash direct, lumière naturelle brute, imperfections',
    composition: 'Spontané, légèrement décadré, snapshot aesthetic',
    colorTreatment: 'Contrastes forts, noirs profonds, highlights brûlés',
    texture: 'Grain fort, scan de film, artifacts assumés',
    mood: 'Authentique, rebelle, underground',
    references: 'Supreme, Balenciaga recent campaigns, zine culture',
    negativePrompt: 'polished, corporate, perfect, symmetrical, soft lighting, pastel, clean, minimal'
  }
} as const;

export type ArchetypeKey = keyof typeof VISUAL_ARCHETYPES;

// ============================================================================
// INDUSTRY-SPECIFIC CREATIVE ANGLES
// ============================================================================
const INDUSTRY_ANGLES: Record<string, Array<{
  title: string;
  hook: string;
  sceneTemplate: string;
  emotionalTension: string;
}>> = {
  'SaaS': [
    {
      title: 'The Dashboard Moment',
      hook: 'Le contraste avant/après qui vend la transformation',
      sceneTemplate: 'Split-screen subtil: chaos de spreadsheets flouttés à gauche, interface claire et organisée à droite. Lumière de bureau chaleureuse, plante verte visible.',
      emotionalTension: 'Du stress au contrôle'
    },
    {
      title: 'The Metric That Matters',
      hook: 'Un chiffre impossible à ignorer',
      sceneTemplate: 'Fond sombre premium, un seul nombre géant en couleur de marque (ex: +340%). Petite citation client en dessous. Logo watermark discret.',
      emotionalTension: 'FOMO professionnel'
    },
    {
      title: 'Team Sync',
      hook: 'La collaboration sans friction',
      sceneTemplate: 'Vue plongeante sur bureau avec laptop montrant l\'app, mains multiples pointant l\'écran, tasses de café, post-its. Lumière naturelle de fenêtre.',
      emotionalTension: 'De l\'isolation à la connexion'
    }
  ],
  'E-commerce': [
    {
      title: 'The Unboxing Moment',
      hook: 'L\'anticipation du déballage',
      sceneTemplate: 'Mains ouvrant délicatement un packaging premium. Lumière douce latérale, fond neutre texturé. Focus sur la qualité du packaging.',
      emotionalTension: 'Anticipation → Satisfaction'
    },
    {
      title: 'In Context',
      hook: 'Le produit dans sa vie naturelle',
      sceneTemplate: 'Produit posé naturellement dans son environnement d\'usage. Style lifestyle, lumière golden hour, éléments de vie quotidienne autour.',
      emotionalTension: 'Projection dans son quotidien'
    },
    {
      title: 'The Detail Shot',
      hook: 'La qualité qui se voit',
      sceneTemplate: 'Macro shot du détail signature du produit. Fond flou, éclairage dramatique révélant la texture. Minimaliste.',
      emotionalTension: 'Désir de qualité'
    }
  ],
  'Fintech': [
    {
      title: 'Financial Freedom',
      hook: 'La légèreté de qui a repris le contrôle',
      sceneTemplate: 'Personne détendue dans un bel espace, smartphone montrant l\'app avec des metrics positifs. Lumière matinale, tons chauds.',
      emotionalTension: 'De l\'anxiété à la sérénité'
    },
    {
      title: 'The Growth Chart',
      hook: 'Progression visuelle impossible à ignorer',
      sceneTemplate: 'Graphique stylisé en couleur de marque sur fond sombre. Ligne ascendante avec highlight au point actuel. Minimal, data-viz élégante.',
      emotionalTension: 'FOMO d\'opportunité'
    },
    {
      title: 'Trust Signals',
      hook: 'La sécurité en un regard',
      sceneTemplate: 'Interface app avec indicateurs de sécurité visibles. Fond bleu profond, accents dorés ou verts. Icônes de verification subtiles.',
      emotionalTension: 'Doute → Confiance'
    }
  ],
  'Beauty': [
    {
      title: 'The Ritual',
      hook: 'Le geste beauté devenu moment de self-care',
      sceneTemplate: 'Gros plan mains appliquant le produit, lumière bathroom matinale, comptoir en marbre ou bois, plante visible. Texture produit visible.',
      emotionalTension: 'Routine → Rituel précieux'
    },
    {
      title: 'Texture Porn',
      hook: 'La texture qui donne envie de toucher',
      sceneTemplate: 'Macro shot de la texture du produit (crème, sérum, poudre). Lumière rasante révélant les détails. Fond neutre.',
      emotionalTension: 'Désir sensoriel'
    },
    {
      title: 'Before/After Subtle',
      hook: 'La transformation sans artifice',
      sceneTemplate: 'Portrait même personne, même lumière, deux états. Différence subtile mais visible. Authentique, pas retouché à l\'excès.',
      emotionalTension: 'Espoir → Résultat'
    }
  ],
  'Food': [
    {
      title: 'The Hero Shot',
      hook: 'L\'appétit en une image',
      sceneTemplate: 'Plat/produit en hero, angle 45°, steam visible si chaud. Ingrédients éparpillés artistiquement autour. Lumière latérale chaude.',
      emotionalTension: 'Faim instantanée'
    },
    {
      title: 'The Ingredient Story',
      hook: 'La qualité des ingrédients',
      sceneTemplate: 'Ingrédients bruts disposés flat lay, avec le produit fini au centre. Fond bois ou marbre. Lumière naturelle.',
      emotionalTension: 'Confiance dans la qualité'
    },
    {
      title: 'The Moment',
      hook: 'Le contexte social de consommation',
      sceneTemplate: 'Main attrapant le produit dans un contexte convivial (table entre amis, pique-nique, cuisine). Autres personnes flouttées en arrière-plan.',
      emotionalTension: 'Belonging, partage'
    }
  ],
  'Tech': [
    {
      title: 'Product Glory',
      hook: 'L\'objet technologique comme objet de désir',
      sceneTemplate: 'Produit tech sur fond gradient, éclairage studio dramatique, reflets contrôlés. Angle héroïque. Ultra-clean.',
      emotionalTension: 'Désir d\'objet'
    },
    {
      title: 'In Use',
      hook: 'La technologie invisible, le bénéfice visible',
      sceneTemplate: 'Personne utilisant naturellement le produit dans sa vie. Focus sur l\'expression (concentration, satisfaction). Produit net, reste soft focus.',
      emotionalTension: 'Projection d\'usage'
    },
    {
      title: 'The Detail',
      hook: 'L\'ingénierie visible',
      sceneTemplate: 'Macro shot d\'un détail signature (texture, LED, connecteur). Fond noir, éclairage précis révélant la qualité.',
      emotionalTension: 'Appréciation craft'
    }
  ],
  'default': [
    {
      title: 'Hero Product',
      hook: 'Le produit comme star',
      sceneTemplate: 'Produit centré sur fond premium, éclairage studio soft, ombre portée légère. Accents de couleur de marque.',
      emotionalTension: 'Désir d\'acquisition'
    },
    {
      title: 'Social Proof',
      hook: 'La preuve qui convainc',
      sceneTemplate: 'Citation client impactante en grande typo sur fond de couleur de marque. Logo client ou avatar discret. Clean et trustworthy.',
      emotionalTension: 'FOMO social'
    },
    {
      title: 'Value Proposition',
      hook: 'Le bénéfice en un visuel',
      sceneTemplate: 'Visuel métaphorique représentant le bénéfice principal. Style graphique ou lifestyle selon la marque. Message clair.',
      emotionalTension: 'Compréhension → Désir'
    }
  ]
};

// ============================================================================
// CREATIVE CONCEPT INTERFACE
// ============================================================================
export interface CreativeConcept {
  // Core concept
  visualHook: string;
  sceneDescription: string;
  emotionalTone: string;
  narrativeTension: string;
  
  // Technical direction
  archetype: ArchetypeKey;
  lighting: string;
  composition: string;
  colorMood: string;
  texture: string;
  
  // Brand integration
  productPlacement: string;
  logoPlacement: string;
  colorUsage: string;
  
  // Quality control
  negativePrompt: string;
  qualityModifiers: string;
  
  // Final assembled prompt
  finalPrompt: string;
}

// ============================================================================
// MAIN API: Creative Director
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      brief,           // User's raw brief
      brand,           // Brand data from analysis
      archetype,       // Optional: force a specific archetype
      angle            // Optional: specific marketing angle to use
    } = body;

    if (!brief || !brand) {
      return NextResponse.json(
        { success: false, error: 'Brief and brand data are required' },
        { status: 400 }
      );
    }

    // Determine industry for angle selection
    const industry = detectIndustry(brand.industry);
    const angles = INDUSTRY_ANGLES[industry] || INDUSTRY_ANGLES['default'];
    
    // Select archetype (user choice or AI-determined)
    const selectedArchetype = archetype || determineArchetype(brand, brief);
    const archetypeData = VISUAL_ARCHETYPES[selectedArchetype as ArchetypeKey];
    
    // Select or use provided angle
    const selectedAngle = angle || selectBestAngle(angles, brief);

    // Build creative concept via GPT-4o
    const concept = await generateCreativeConcept({
      brief,
      brand,
      archetype: archetypeData,
      angle: selectedAngle,
      industry
    });

    return NextResponse.json({
      success: true,
      concept,
      metadata: {
        archetype: selectedArchetype,
        industry,
        angle: selectedAngle.title
      }
    });

  } catch (error: any) {
    console.error('Creative Director Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Creative direction failed' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function detectIndustry(rawIndustry: string): string {
  if (!rawIndustry) return 'default';
  
  const lower = rawIndustry.toLowerCase();
  
  if (lower.includes('saas') || lower.includes('software') || lower.includes('b2b') || lower.includes('platform')) {
    return 'SaaS';
  }
  if (lower.includes('ecommerce') || lower.includes('e-commerce') || lower.includes('retail') || lower.includes('shop')) {
    return 'E-commerce';
  }
  if (lower.includes('fintech') || lower.includes('finance') || lower.includes('bank') || lower.includes('invest')) {
    return 'Fintech';
  }
  if (lower.includes('beauty') || lower.includes('cosmetic') || lower.includes('skincare') || lower.includes('makeup')) {
    return 'Beauty';
  }
  if (lower.includes('food') || lower.includes('beverage') || lower.includes('restaurant') || lower.includes('nutrition')) {
    return 'Food';
  }
  if (lower.includes('tech') || lower.includes('hardware') || lower.includes('device') || lower.includes('gadget')) {
    return 'Tech';
  }
  
  return 'default';
}

function determineArchetype(brand: any, brief: string): ArchetypeKey {
  const aesthetic = Array.isArray(brand.aesthetic) ? brand.aesthetic.join(' ').toLowerCase() : (brand.aesthetic || '').toLowerCase();
  const tone = Array.isArray(brand.toneVoice) ? brand.toneVoice.join(' ').toLowerCase() : (brand.toneVoice || '').toLowerCase();
  const briefLower = brief.toLowerCase();
  
  // Check for explicit style hints in brief
  if (briefLower.includes('editorial') || briefLower.includes('magazine')) return 'editorial';
  if (briefLower.includes('lifestyle') || briefLower.includes('authentic')) return 'lifestyle';
  if (briefLower.includes('bold') || briefLower.includes('graphique') || briefLower.includes('impact')) return 'bold';
  if (briefLower.includes('minimal') || briefLower.includes('épuré') || briefLower.includes('luxury')) return 'minimal';
  if (briefLower.includes('raw') || briefLower.includes('brut') || briefLower.includes('authentique')) return 'raw';
  if (briefLower.includes('corporate') || briefLower.includes('professionnel')) return 'corporate';
  
  // Infer from brand aesthetic
  if (aesthetic.includes('premium') || aesthetic.includes('luxur') || aesthetic.includes('elegant')) return 'editorial';
  if (aesthetic.includes('friendly') || aesthetic.includes('warm') || aesthetic.includes('human')) return 'lifestyle';
  if (aesthetic.includes('modern') || aesthetic.includes('bold') || aesthetic.includes('disrupt')) return 'bold';
  if (aesthetic.includes('clean') || aesthetic.includes('minimal') || aesthetic.includes('simple')) return 'minimal';
  if (aesthetic.includes('edgy') || aesthetic.includes('rebel') || aesthetic.includes('underground')) return 'raw';
  if (aesthetic.includes('trust') || aesthetic.includes('professional') || aesthetic.includes('serious')) return 'corporate';
  
  // Default based on tone
  if (tone.includes('playful') || tone.includes('casual')) return 'lifestyle';
  if (tone.includes('authorit') || tone.includes('expert')) return 'editorial';
  
  return 'lifestyle'; // Safe default for social media
}

function selectBestAngle(angles: typeof INDUSTRY_ANGLES['default'], brief: string): typeof angles[0] {
  const briefLower = brief.toLowerCase();
  
  // Try to match keywords
  for (const angle of angles) {
    const titleWords = angle.title.toLowerCase().split(' ');
    if (titleWords.some(word => briefLower.includes(word))) {
      return angle;
    }
  }
  
  // Check for common intent keywords
  if (briefLower.includes('testimonial') || briefLower.includes('avis') || briefLower.includes('proof')) {
    return angles.find(a => a.title.toLowerCase().includes('proof') || a.title.toLowerCase().includes('social')) || angles[0];
  }
  if (briefLower.includes('product') || briefLower.includes('produit') || briefLower.includes('showcase')) {
    return angles.find(a => a.title.toLowerCase().includes('product') || a.title.toLowerCase().includes('hero')) || angles[0];
  }
  
  // Default to first angle
  return angles[0];
}

async function generateCreativeConcept(params: {
  brief: string;
  brand: any;
  archetype: typeof VISUAL_ARCHETYPES[ArchetypeKey];
  angle: typeof INDUSTRY_ANGLES['default'][0];
  industry: string;
}): Promise<CreativeConcept> {
  const { brief, brand, archetype, angle, industry } = params;

  // Extract brand elements
  const brandName = brand.name || 'Brand';
  const colors = Array.isArray(brand.colors) ? brand.colors : [brand.colors || '#000000'];
  const primaryColor = colors[0];
  const secondaryColor = colors[1] || colors[0];
  const aesthetic = Array.isArray(brand.aesthetic) ? brand.aesthetic.join(', ') : (brand.aesthetic || 'Modern');
  const tone = Array.isArray(brand.toneVoice) ? brand.toneVoice.join(', ') : (brand.toneVoice || 'Professional');
  const values = Array.isArray(brand.values) ? brand.values.join(', ') : '';
  const keyPoints = Array.isArray(brand.keyPoints) ? brand.keyPoints.slice(0, 3).join('. ') : '';
  const visualMotifs = Array.isArray(brand.visualMotifs) ? brand.visualMotifs.join(', ') : '';

  const systemPrompt = `You are an expert Social Media Designer specializing in static posts for Instagram and LinkedIn.

CRITICAL CONTEXT: You are writing prompts for an AI image model (Nano Banana Pro) that takes EXISTING reference images and transforms them into social media posts. The model CANNOT create 3D scenes, cinematic renders, or elaborate environments from scratch.

Your prompts must:
1. FOCUS ON THE LAYOUT - How to arrange the reference image within a social media post format
2. BE SIMPLE AND DIRECT - No cinematic language, no camera movements, no elaborate scene descriptions
3. DESCRIBE A FLAT 2D COMPOSITION - Think graphic design poster, not 3D render
4. USE THE REFERENCE IMAGE AS THE HERO - Tell the model how to feature the provided image

You MUST NOT:
- Describe 3D scenes with desks, rooms, or physical environments
- Use cinematic language like "the camera pans", "in the foreground", "the scene unfolds"
- Request complex lighting setups or photorealistic renders
- Describe textures of objects that aren't in the reference images

You MUST:
- Describe a flat, graphic social media post layout
- Specify background colors, shapes, and typography zones
- Tell how to position the reference image (centered, left-aligned, with overlay, etc.)
- Keep descriptions under 150 words
- Focus on what a graphic designer would create in Figma, not a 3D artist in Blender`;

  const userPrompt = `
BRIEF FROM CLIENT: "${brief}"

BRAND CONTEXT:
- Name: ${brandName}
- Industry: ${industry}
- Aesthetic: ${aesthetic}
- Tone: ${tone}
- Primary Color: ${primaryColor}
- Secondary Color: ${secondaryColor}

ARCHETYPE STYLE: ${archetype.name}

YOUR TASK:
Create a SIMPLE, FLAT social media post layout description. Think like a graphic designer, NOT a 3D artist.

The AI model will receive reference images (logo, product photos) and your description tells it HOW TO ARRANGE THEM into a social media post.

Return a JSON object with EXACTLY these fields:
{
  "layoutDescription": "Simple 2D layout: 'Reference image centered on solid ${primaryColor} background with 20% padding. White geometric accent shapes in corners.' - MAX 80 WORDS, describe like a Figma layout",
  "backgroundStyle": "Solid color, gradient, or simple pattern - e.g. 'Solid ${primaryColor} with subtle noise texture'",
  "imagePosition": "Where the reference image goes: centered, left-third, full-bleed, etc.",
  "accentElements": "Simple shapes or overlays: 'Thin white border frame', 'Diagonal ${secondaryColor} stripe', 'Rounded corner badge'",
  "textZone": "Where text could go: 'Bottom 20% reserved for caption area' or 'Right side vertical text zone'",
  "overallVibe": "3 words max: 'Clean, bold, professional'",
  "colorUsage": "How to use ${primaryColor} and ${secondaryColor}"
}

GOOD EXAMPLE:
"Reference image of product displayed at 60% scale, centered. Solid white background. Thin ${primaryColor} border around entire post. Small logo watermark bottom-right corner. Top 15% has subtle gradient fade from ${secondaryColor}."

BAD EXAMPLE (DO NOT DO THIS):
"A luxurious walnut desk with the product resting on it, camera slowly panning across as morning light streams through venetian blinds..."

Keep it SIMPLE. This is a 2D social media graphic, not a movie scene.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://briefbox.vercel.app",
        "X-Title": "BriefBox Creative Director"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8 // Higher creativity
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${await response.text()}`);
    }

    const data = await response.json();
    let text = data.choices[0].message.content;
    
    // Parse JSON from response
    text = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const conceptData = JSON.parse(jsonMatch[0]);

    // Assemble final prompt
    const finalPrompt = assembleFinalPrompt({
      concept: conceptData,
      brand,
      archetype,
      primaryColor,
      secondaryColor
    });

    return {
      ...conceptData,
      archetype: archetype.name.toLowerCase() as ArchetypeKey,
      negativePrompt: archetype.negativePrompt,
      finalPrompt
    };

  } catch (error) {
    console.error('GPT concept generation failed:', error);
    
    // Fallback to template-based concept
    return createFallbackConcept({
      brief,
      brand,
      archetype,
      angle,
      primaryColor,
      secondaryColor
    });
  }
}

function assembleFinalPrompt(params: {
  concept: any;
  brand: any;
  archetype: typeof VISUAL_ARCHETYPES[ArchetypeKey];
  primaryColor: string;
  secondaryColor: string;
}): string {
  const { concept, brand, archetype, primaryColor, secondaryColor } = params;

  // Simple, direct prompt optimized for Nano Banana Pro image-to-image
  return `Professional social media post design for ${brand.name || 'brand'}.

LAYOUT: ${concept.layoutDescription || 'Reference image centered with brand colors'}

BACKGROUND: ${concept.backgroundStyle || `Solid ${primaryColor} background`}

IMAGE PLACEMENT: ${concept.imagePosition || 'Hero image centered, 70% of frame'}

ACCENTS: ${concept.accentElements || 'Minimal geometric shapes in brand colors'}

COLORS: Primary ${primaryColor}, Secondary ${secondaryColor}. ${concept.colorUsage || 'Use primary for background, secondary for accents.'}

STYLE: ${archetype.name} aesthetic - ${concept.overallVibe || archetype.mood}. Clean, high-quality, ready for Instagram/LinkedIn.

Add subtle grain texture for premium editorial feel. Sharp details, professional graphic design quality.

NEGATIVE: ${archetype.negativePrompt}, 3D render, photorealistic scene, complex environment, cinematic, movie still, blurry, amateur, distorted text, wrong colors`;
}

function createFallbackConcept(params: {
  brief: string;
  brand: any;
  archetype: typeof VISUAL_ARCHETYPES[ArchetypeKey];
  angle: typeof INDUSTRY_ANGLES['default'][0];
  primaryColor: string;
  secondaryColor: string;
}): CreativeConcept {
  const { brief, brand, archetype, angle, primaryColor, secondaryColor } = params;

  const fallback: CreativeConcept = {
    visualHook: angle.hook,
    sceneDescription: brief,
    emotionalTone: angle.emotionalTension,
    narrativeTension: angle.emotionalTension,
    archetype: archetype.name.toLowerCase() as ArchetypeKey,
    lighting: 'Soft, even lighting',
    composition: 'Centered layout with balanced whitespace',
    colorMood: `${primaryColor} background with ${secondaryColor} accents`,
    texture: 'Subtle grain for premium feel',
    productPlacement: 'Reference image centered at 70% scale',
    logoPlacement: 'Small logo bottom-right corner',
    colorUsage: `${primaryColor} for background, ${secondaryColor} for accent elements`,
    negativePrompt: archetype.negativePrompt,
    qualityModifiers: 'Sharp, clean, professional graphic design',
    // New simple fields for the updated format
    layoutDescription: `Reference image centered on ${primaryColor} background. Clean margins. Professional social media post layout.`,
    backgroundStyle: `Solid ${primaryColor} with subtle noise texture`,
    imagePosition: 'Centered, 70% of frame',
    accentElements: `Thin ${secondaryColor} accent lines or shapes`,
    textZone: 'Bottom 15% reserved for caption',
    overallVibe: archetype.mood,
    finalPrompt: ''
  } as CreativeConcept & Record<string, any>;

  fallback.finalPrompt = assembleFinalPrompt({
    concept: fallback,
    brand,
    archetype,
    primaryColor,
    secondaryColor
  });

  return fallback;
}

// GET: Return available archetypes and angles for UI
export async function GET() {
  return NextResponse.json({
    archetypes: Object.entries(VISUAL_ARCHETYPES).map(([key, value]) => ({
      id: key,
      name: value.name,
      description: value.description,
      references: value.references
    })),
    industries: Object.keys(INDUSTRY_ANGLES)
  });
}

