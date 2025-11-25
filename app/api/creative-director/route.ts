import { NextRequest, NextResponse } from 'next/server';
import {
  TemplateId,
  detectTemplate,
  buildTemplatePrompt,
  extractMetric,
  getAllTemplates,
  TemplateParams
} from '@/lib/templates';

// ============================================================================
// CREATIVE DIRECTOR V3 - Variations + Style References + Smart Selection
// ============================================================================

// Style references mapped to brand aesthetics
// These are styles that Nano Banana Pro understands well
const STYLE_REFERENCE_MAP: Record<string, string[]> = {
  // Tech/SaaS
  'modern': ['Linear app', 'Stripe website', 'Vercel dashboard'],
  'minimal': ['Apple marketing', 'Notion design', 'Figma community'],
  'professional': ['IBM design', 'Salesforce marketing', 'Microsoft Fluent'],
  'sleek': ['Tesla website', 'Rivian branding', 'Nothing phone'],
  
  // Creative/Bold
  'bold': ['Spotify Wrapped', 'Nike advertising', 'Gatorade visuals'],
  'creative': ['Pentagram portfolio', 'IDEO projects', 'Sagmeister work'],
  'playful': ['Mailchimp illustrations', 'Slack marketing', 'Duolingo style'],
  
  // Premium/Luxury
  'luxury': ['Hermès photography', 'Rolex advertising', 'Cartier visuals'],
  'elegant': ['Aesop branding', 'Kinfolk magazine', 'Cereal magazine'],
  'sophisticated': ['The New Yorker', 'Monocle magazine', 'Wallpaper design'],
  
  // Corporate/Trust
  'corporate': ['McKinsey reports', 'Deloitte marketing', 'Goldman Sachs'],
  'trustworthy': ['Mayo Clinic', 'Harvard branding', 'The Economist'],
  'authoritative': ['Bloomberg Terminal', 'Reuters graphics', 'FT design'],
  
  // Default fallback
  'default': ['Behance featured', 'Dribbble popular', 'Awwwards winner']
};

// Prompt variations for diversity (appended to base prompt)
// Focus on TASTEFUL, EDITORIAL, and SOPHISTICATED styles
// Avoiding generic "modern" or "tech" terms that trigger bad AI tropes
const PROMPT_VARIATIONS = [
  'Emphasis: Swiss Design Style. Use a grid-based layout, strong typography, and negative space. Clean, structured, and timeless. No decorative elements, just pure design.',
  'Emphasis: Editorial Photography Vibe. The visual should feel like a spread in a high-end magazine (Kinfolk, Monocle). Minimalist, soft lighting, natural textures. Avoid "tech" graphics.',
  'Emphasis: Minimalist Abstract. Use simple geometric shapes and a very restrained color palette. The composition should be airy and calm. Think "Museum of Modern Art" poster.',
  'Emphasis: Typographic Focus. Make the text the hero. Use big, bold, beautiful typography. The background should be solid or a very subtle gradient. Extremely legible and impactful.'
];

// Get style references based on brand aesthetic
function getStyleReferences(aesthetic: string): string {
  const aestheticLower = aesthetic.toLowerCase();
  
  // Find matching style references
  for (const [key, references] of Object.entries(STYLE_REFERENCE_MAP)) {
    if (aestheticLower.includes(key)) {
      return `Style references: ${references.join(', ')}.`;
    }
  }
  
  // Default references
  return `Style references: ${STYLE_REFERENCE_MAP.default.join(', ')}.`;
}

// Template-specific image needs
const TEMPLATE_IMAGE_NEEDS: Record<TemplateId, {
  priority: string[];      // Categories to prioritize
  required: string[];      // Must have at least one
  maxImages: number;       // Total content images
  needsLogo: boolean;      // Should logo be prominent
  needsPerson: boolean;    // Needs human element
  styleEmphasis: string;   // Style guidance for this template
}> = {
  stat: {
    priority: ['main_logo', 'texture', 'app_ui'],
    required: ['main_logo'],
    maxImages: 2,
    needsLogo: true,
    needsPerson: false,
    styleEmphasis: 'Clean, minimal design. Logo should be visible. Focus on typography and the metric.'
  },
  announcement: {
    priority: ['main_logo', 'product', 'app_ui'],
    required: ['main_logo'],
    maxImages: 3,
    needsLogo: true,
    needsPerson: false,
    styleEmphasis: 'Bold, attention-grabbing. Logo prominently displayed. Professional corporate style.'
  },
  quote: {
    priority: ['person', 'team', 'lifestyle', 'main_logo'],
    required: [],
    maxImages: 2,
    needsLogo: false,
    needsPerson: true,
    styleEmphasis: 'Warm, human, authentic. If person image available, feature it subtly. Testimonial-focused.'
  },
  event: {
    priority: ['main_logo', 'person', 'lifestyle'],
    required: ['main_logo'],
    maxImages: 2,
    needsLogo: true,
    needsPerson: false,
    styleEmphasis: 'Dynamic, engaging, professional. Event-focused with clear branding.'
  },
  expert: {
    priority: ['person', 'team', 'main_logo'],
    required: [],
    maxImages: 2,
    needsLogo: false,
    needsPerson: true,
    styleEmphasis: 'Authoritative, thought-leadership feel. Person/expert should be prominent if available.'
  },
  product: {
    priority: ['product', 'app_ui', 'main_logo'],
    required: ['product'],
    maxImages: 3,
    needsLogo: true,
    needsPerson: false,
    styleEmphasis: 'Product showcase. The product image should be the hero. Clean, premium presentation.'
  }
};

// Smart image selection based on template type
function getImagePriority(
  labeledImages: any[], 
  templateId: TemplateId = 'announcement'
): { 
  priority: string[], 
  excluded: string[], 
  references: string[],
  reasoning: string,
  imageRoles: Record<string, string> // Describes what each image is for
} {
  if (!Array.isArray(labeledImages) || labeledImages.length === 0) {
    return { 
      priority: [], 
      excluded: [], 
      references: [], 
      reasoning: 'No labeled images available',
      imageRoles: {}
    };
  }
  
  const templateNeeds = TEMPLATE_IMAGE_NEEDS[templateId] || TEMPLATE_IMAGE_NEEDS.announcement;
  const priority: string[] = [];
  const excluded: string[] = [];
  const references: string[] = [];
  const imageRoles: Record<string, string> = {};
  
  // First, extract reference images separately - these are style guidelines
  const referenceImages = labeledImages.filter(img => img.category === 'reference');
  for (const img of referenceImages) {
    if (img.url && !img.url.includes('placeholder')) {
      references.push(img.url);
      imageRoles[img.url] = 'STYLE_REFERENCE: Match this visual style, colors, and aesthetic';
    }
  }
  
  // Select images based on template-specific priority order
  for (const category of templateNeeds.priority) {
    if (priority.length >= templateNeeds.maxImages) break;
    
    const images = labeledImages.filter(img => img.category === category);
    for (const img of images) {
      if (priority.length >= templateNeeds.maxImages) break;
      
      // Skip very small images or placeholders
      if (img.url?.includes('placeholder') || img.url?.includes('1x1')) {
        excluded.push(img.url);
        continue;
      }
      
      priority.push(img.url);
      
      // Assign semantic role based on category
      switch (category) {
        case 'main_logo':
          imageRoles[img.url] = 'BRAND_LOGO: This is the brand logo - display it clearly and prominently';
          break;
        case 'product':
          imageRoles[img.url] = 'PRODUCT_IMAGE: This is the main product - make it the hero element';
          break;
        case 'app_ui':
          imageRoles[img.url] = 'APP_SCREENSHOT: Use as a visual element showing the product interface';
          break;
        case 'person':
        case 'team':
          imageRoles[img.url] = 'PERSON_IMAGE: Human element - can be used subtly or prominently';
          break;
        case 'texture':
          imageRoles[img.url] = 'TEXTURE: Use as background element or visual texture';
          break;
        default:
          imageRoles[img.url] = 'SUPPORTING_VISUAL: Secondary visual element';
      }
    }
  }
  
  // If we don't have required images but have others, fall back
  if (priority.length === 0) {
    const fallbackOrder = ['main_logo', 'product', 'app_ui', 'texture', 'lifestyle', 'other'];
    for (const category of fallbackOrder) {
      if (priority.length >= 2) break;
      const images = labeledImages.filter(img => img.category === category && !img.url?.includes('placeholder'));
      for (const img of images) {
        if (priority.length >= 2) break;
        priority.push(img.url);
        imageRoles[img.url] = 'FALLBACK_VISUAL: Use as available';
      }
    }
  }
  
  // Build reasoning
  const reasoningParts = [
    `Template "${templateId}" needs: ${templateNeeds.priority.slice(0, 3).join(', ')}`,
    `Selected ${priority.length}/${templateNeeds.maxImages} content images`
  ];
  if (references.length > 0) {
    reasoningParts.push(`${references.length} style references`);
  }
  
  return {
    priority,
    excluded,
    references: references.slice(0, 3),
    reasoning: reasoningParts.join('. '),
    imageRoles
  };
}

// Language-specific prompt additions
const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  fr: 'PRIMARY LANGUAGE: FRENCH (Français). All text on the visual must be in native, idiomatic French. Use correct French typography (e.g., "« »" for quotes). Translate any English concepts into powerful French marketing copy.',
  en: 'PRIMARY LANGUAGE: ENGLISH. All text on the visual must be in native, idiomatic English. Use punchy, direct marketing copy.',
  es: 'PRIMARY LANGUAGE: SPANISH (Español). All text on the visual must be in native, idiomatic Spanish. Translate any concepts into powerful Spanish marketing copy.',
  de: 'PRIMARY LANGUAGE: GERMAN (Deutsch). All text on the visual must be in native, idiomatic German. Translate any concepts into powerful German marketing copy.',
};

// Feedback patterns type (matching client-side)
interface FeedbackPatterns {
  likedStyles: string[];
  dislikedStyles: string[];
  likedKeywords: string[];
  dislikedKeywords: string[];
  avgRatingByTemplate: Record<string, { total: number; count: number }>;
  lastUpdated: string;
}

// Build feedback-aware prompt adjustments
function buildFeedbackGuidance(patterns?: FeedbackPatterns): string {
  if (!patterns) return '';
  
  const guidance: string[] = [];
  
  // Templates with high ratings
  const bestTemplates = Object.entries(patterns.avgRatingByTemplate)
    .filter(([_, stats]) => stats.count >= 2 && (stats.total / stats.count) >= 2.5)
    .map(([template]) => template);
  
  if (bestTemplates.length > 0) {
    guidance.push(`User prefers these template styles: ${bestTemplates.join(', ')}.`);
  }
  
  // Liked keywords (things that worked)
  if (patterns.likedKeywords.length > 0) {
    const topLiked = patterns.likedKeywords.slice(-5); // Most recent
    guidance.push(`Elements user liked: ${topLiked.join(', ')}.`);
  }
  
  // Disliked keywords (things to avoid)
  if (patterns.dislikedKeywords.length > 0) {
    const topDisliked = patterns.dislikedKeywords.slice(-5);
    guidance.push(`AVOID these elements that user disliked: ${topDisliked.join(', ')}.`);
  }
  
  return guidance.length > 0 
    ? `\n\nUSER PREFERENCES (from past feedback):\n${guidance.join('\n')}` 
    : '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brief, brand, templateId: requestedTemplateId, language = 'fr', feedbackPatterns } = body;

    if (!brief || !brand) {
      return NextResponse.json(
        { success: false, error: 'Brief and brand data required' },
        { status: 400 }
      );
    }

    // Build feedback guidance if available
    const feedbackGuidance = buildFeedbackGuidance(feedbackPatterns);
    if (feedbackGuidance) {
      console.log('📊 Using user feedback patterns to guide generation');
    }

    // Extract brand essentials
    const brandName = brand.name || 'Brand';
    const colors = Array.isArray(brand.colors) ? brand.colors : ['#000000'];
    const primaryColor = colors[0] || '#000000';
    const secondaryColor = colors[1] || '#ffffff';
    const aesthetic = Array.isArray(brand.aesthetic) ? brand.aesthetic.join(', ') : (brand.aesthetic || 'Modern, Professional');
    const toneVoice = Array.isArray(brand.toneVoice) ? brand.toneVoice.join(', ') : (brand.toneVoice || 'Confident, Clear');

    // Determine which template to use
    let templateId: TemplateId;
    
    if (requestedTemplateId && ['stat', 'announcement', 'event', 'quote', 'expert', 'product'].includes(requestedTemplateId)) {
      templateId = requestedTemplateId as TemplateId;
      console.log(`📋 Using requested template: ${templateId}`);
    } else {
      const detected = detectTemplate(brief);
      templateId = detected.id;
      console.log(`🔍 Auto-detected template: ${templateId}`);
    }

    // Build template params
    const params: TemplateParams = {
      brandName,
      primaryColor,
      secondaryColor,
      aesthetic,
      toneVoice,
      headline: brief.slice(0, 80),
      subheadline: brand.tagline || '',
    };

    // Special handling per template type
    if (templateId === 'stat') {
      const extracted = extractMetric(brief);
      if (extracted) {
        params.metric = extracted.metric;
        params.metricLabel = extracted.label;
      } else {
        params.metric = '100%';
        params.metricLabel = 'satisfaction';
      }
    }

    if (templateId === 'quote') {
      params.quote = brief;
      params.personName = 'Client';
      params.personTitle = brand.industry || 'Partner';
    }

    if (templateId === 'event') {
      params.eventDate = 'À venir';
      params.eventTime = '';
    }

    if (templateId === 'expert') {
      params.personName = 'Expert';
      params.personTitle = brand.industry || 'Specialist';
    }

    // Build the base prompt
    const result = buildTemplatePrompt(templateId, params);
    
    // Safety check - ensure we have a valid base prompt
    if (!result.prompt || typeof result.prompt !== 'string') {
      console.error('❌ Template returned invalid prompt');
      return NextResponse.json(
        { success: false, error: 'Failed to build prompt from template' },
        { status: 500 }
      );
    }
    
    // Get style references based on brand aesthetic
    const styleRefs = getStyleReferences(aesthetic);
    
    // Smart image selection - BASED ON TEMPLATE TYPE
    const imageSelection = getImagePriority(brand.labeledImages || [], templateId);
    const templateNeeds = TEMPLATE_IMAGE_NEEDS[templateId] || TEMPLATE_IMAGE_NEEDS.announcement;

    // Build image role instructions for the prompt
    let imageRoleInstructions = '';
    if (Object.keys(imageSelection.imageRoles).length > 0) {
      const roleDescriptions = Object.entries(imageSelection.imageRoles)
        .map(([_, role]) => `- ${role}`)
        .join('\n');
      
      imageRoleInstructions = `\n\nIMAGE USAGE INSTRUCTIONS:
The following images are provided with specific purposes:
${roleDescriptions}

IMPORTANT: Use each image according to its role. The order of images reflects their importance.`;
    }

    // Add template-specific style emphasis
    const templateStyleEmphasis = templateNeeds.styleEmphasis;

    // FORCE THE STRUCTURE REQUESTED BY USER
    // This is the exact prompt structure that works well with Nano Banana Pro
    const buildStructuredPrompt = (variationEmphasis: string) => {
      return `
ROLE: Expert Art Director & Copywriter.

TASK: Create a sophisticated social media visual based on the following brief.

BRIEF: ${brief}.
AESTHETIC: ${aesthetic} (but interpreted with high taste).
VIBE: ${toneVoice}.

COPYWRITING INSTRUCTIONS (CRITICAL):
- TRANSFORM the brief into a powerful, short marketing headline in the target language (${language}).
- DO NOT just copy-paste the brief. Make it punchy, engaging, and benefit-oriented.
- Structure: Main Headline (3-6 words) + Optional Subheadline.
- Tone: ${toneVoice}.
- SPELLING: Check strictly for typos.

BRAND IDENTITY (STRICTLY FOLLOW):

Brand: ${brandName}
Aesthetic: ${aesthetic}
Tone: ${toneVoice}
Colors: ${colors.join(', ')}
Fonts: Sans-serif (modern), Helvetica Neue

DESIGN GUIDELINES:
- COMPOSITION: Clean, balanced, and airy. Use a grid system. Avoid clutter.
- STYLE: ${variationEmphasis} ${templateStyleEmphasis}
- ASSETS: Use the provided image as the HERO element. Integrate it naturally into a scene or layout. Do NOT just crop the image.
- COLOR: Use the brand palette with restraint. Specifically use ${primaryColor} as a primary accent.
- LOGO PROTECTION (CRITICAL): If a logo is provided, it must be treated as a sacred asset. DO NOT DISTORT, WARP, or MODIFY the logo. It must remain perfectly legible and respecting its original proportions. Place it on a high-contrast area.
- TYPOGRAPHY & TEXT: PERFECT SPELLING IS MANDATORY. Double-check all generated text for correctness. No typos, no gibberish. Use professional kerning and spacing.
- QUALITY: Editorial quality, sharp details, professional lighting. Avoid "stock photo" look, avoid 3D render artifacts, avoid generic tech graphics.

${feedbackGuidance ? feedbackGuidance : ''}

${imageRoleInstructions ? imageRoleInstructions : ''}

NEGATIVE PROMPT: distorted logo, warped logo, cut off logo, spelling mistakes, typos, gibberish text, bad grammar, messy, cluttered, ugly text, low resolution, blurry, weird cropping, amateur, wrong colors, cheap 3D effects, neon glow, matrix code, busy background.
      `.trim();
    };

    // Create 4 prompt variations using the structured builder
    const promptVariations = PROMPT_VARIATIONS.map((variation) => {
      return buildStructuredPrompt(variation);
    });

    // Add language instruction (appended at the very end to ensure it's respected)
    const languageInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.fr;
    
    const finalVariations = promptVariations.map(p => p + `\n\nNOTE: ${languageInstruction}`);

    console.log('🎨 Creative Director V4 (Structured):');
    console.log('   Template:', result.templateUsed);
    console.log('   Template needs:', templateNeeds.priority.slice(0, 3).join(', '));
    console.log('   Style refs:', styleRefs.slice(0, 50) + '...');
    console.log('   Variations:', promptVariations.length);
    console.log('   Image selection:', imageSelection.reasoning);
    console.log('   Image roles:', Object.keys(imageSelection.imageRoles).length);
    console.log('   Reference visuals:', imageSelection.references.length);
    console.log('   Feedback guidance:', feedbackGuidance ? 'Yes' : 'No');

    return NextResponse.json({
      success: true,
      concept: {
        // Base prompt (for display/debugging)
        finalPrompt: finalVariations[0],
        // 4 variations for generation
        promptVariations: finalVariations,
        // Use standard negative prompt if not defined in the big block
        negativePrompt: "messy, cluttered, ugly text, distorted logo, low resolution, blurry, weird cropping, amateur, wrong colors",
        templateUsed: result.templateUsed,
        params,
        language,
        // Smart image recommendations with roles
        imageSelection
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

// GET endpoint to list available templates
export async function GET() {
  const templates = getAllTemplates().map(t => ({
    id: t.id,
    name: t.name,
    nameFr: t.nameFr,
    description: t.description,
    descriptionFr: t.descriptionFr,
    icon: t.icon,
    keywords: t.keywords
  }));

  return NextResponse.json({
    success: true,
    templates,
    styleReferences: Object.keys(STYLE_REFERENCE_MAP)
  });
}
