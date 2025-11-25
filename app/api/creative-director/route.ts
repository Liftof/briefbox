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
const PROMPT_VARIATIONS = [
  '\n\nStyle inspiration: Award-winning design, featured on Behance.',
  '\n\nStyle inspiration: Dribbble shot of the week aesthetic.',
  '\n\nStyle inspiration: Apple keynote presentation quality.',
  '\n\nStyle inspiration: Premium editorial, Kinfolk magazine style.'
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

// Smart image selection recommendations
function getImagePriority(labeledImages: any[]): { 
  priority: string[], 
  excluded: string[], 
  references: string[],
  reasoning: string 
} {
  if (!Array.isArray(labeledImages) || labeledImages.length === 0) {
    return { priority: [], excluded: [], references: [], reasoning: 'No labeled images available' };
  }
  
  const priority: string[] = [];
  const excluded: string[] = [];
  const references: string[] = [];
  
  // First, extract reference images separately - these are style guidelines
  const referenceImages = labeledImages.filter(img => img.category === 'reference');
  for (const img of referenceImages) {
    if (img.url && !img.url.includes('placeholder')) {
      references.push(img.url);
    }
  }
  
  // Priority order for content images: logo > product > app_ui > texture > other
  // Reference images are separate - used for style guidance, not content
  const priorityOrder = ['main_logo', 'product', 'app_ui', 'texture', 'person', 'lifestyle', 'team', 'other'];
  
  for (const category of priorityOrder) {
    const images = labeledImages.filter(img => img.category === category);
    for (const img of images) {
      // Skip very small images or placeholders
      if (img.url?.includes('placeholder') || img.url?.includes('1x1')) {
        excluded.push(img.url);
        continue;
      }
      priority.push(img.url);
    }
  }
  
  // Limit to best 4 content images
  const selected = priority.slice(0, 4);
  const skipped = priority.slice(4);
  
  const reasoningParts = [`Selected ${selected.length} content images`];
  if (references.length > 0) {
    reasoningParts.push(`${references.length} reference visuals for style`);
  }
  reasoningParts.push('logo/product prioritized');
  
  return {
    priority: selected,
    excluded: [...excluded, ...skipped],
    references: references.slice(0, 3), // Max 3 reference images
    reasoning: reasoningParts.join(', ')
  };
}

// Language-specific prompt additions
const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  fr: 'All text on the visual must be in FRENCH. Use proper French typography.',
  en: 'All text on the visual must be in ENGLISH. Use proper English typography.',
  es: 'All text on the visual must be in SPANISH. Use proper Spanish typography.',
  de: 'All text on the visual must be in GERMAN. Use proper German typography.',
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
    
    // Create 4 prompt variations - each with a different style suffix + feedback guidance
    const promptVariations = PROMPT_VARIATIONS.map((variation) => {
      const fullPrompt = `${result.prompt}\n\n${styleRefs}${variation}${feedbackGuidance}`;
      return fullPrompt.trim();
    }).filter(p => p && p.length > 0); // Extra safety filter

    // Smart image selection
    const imageSelection = getImagePriority(brand.labeledImages || []);

    // If we have reference images, add them to the style context
    let styleContext = styleRefs;
    if (imageSelection.references.length > 0) {
      styleContext += `\n\nIMPORTANT: Use the provided reference visuals as style inspiration. Match their aesthetic, color treatment, and visual language.`;
    }
    
    // Add language instruction
    const languageInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.fr;

    console.log('🎨 Creative Director V3:');
    console.log('   Template:', result.templateUsed);
    console.log('   Style refs:', styleRefs.slice(0, 50) + '...');
    console.log('   Variations:', promptVariations.length);
    console.log('   Image selection:', imageSelection.reasoning);
    console.log('   Reference visuals:', imageSelection.references.length);
    console.log('   Feedback guidance:', feedbackGuidance ? 'Yes' : 'No');

    return NextResponse.json({
      success: true,
      concept: {
        // Base prompt (for display/debugging)
        finalPrompt: result.prompt + '\n\n' + styleContext + feedbackGuidance + '\n\n' + languageInstruction,
        // 4 variations for generation
        promptVariations: promptVariations.map(p => {
          let enhanced = p;
          if (imageSelection.references.length > 0) {
            enhanced += '\n\nMatch the style and aesthetic of the reference visuals provided.';
          }
          enhanced += '\n\n' + languageInstruction;
          return enhanced;
        }),
        negativePrompt: result.negativePrompt,
        templateUsed: result.templateUsed,
        params,
        language,
        // Smart image recommendations
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
