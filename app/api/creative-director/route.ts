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
function getImagePriority(labeledImages: any[]): { priority: string[], excluded: string[], reasoning: string } {
  if (!Array.isArray(labeledImages) || labeledImages.length === 0) {
    return { priority: [], excluded: [], reasoning: 'No labeled images available' };
  }
  
  const priority: string[] = [];
  const excluded: string[] = [];
  
  // Priority order: logo > product > app_ui > texture > other
  const priorityOrder = ['main_logo', 'product', 'app_ui', 'texture', 'person', 'other'];
  
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
  
  // Limit to best 4 images
  const selected = priority.slice(0, 4);
  const skipped = priority.slice(4);
  
  return {
    priority: selected,
    excluded: [...excluded, ...skipped],
    reasoning: `Selected ${selected.length} images: logo/product prioritized, small/placeholder excluded`
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brief, brand, templateId: requestedTemplateId } = body;

    if (!brief || !brand) {
      return NextResponse.json(
        { success: false, error: 'Brief and brand data required' },
        { status: 400 }
      );
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
    
    // Get style references based on brand aesthetic
    const styleRefs = getStyleReferences(aesthetic);
    
    // Create 4 prompt variations
    const promptVariations = PROMPT_VARIATIONS.map((variation, i) => {
      return `${result.prompt}\n\n${styleRefs}${variation}`;
    });

    // Smart image selection
    const imageSelection = getImagePriority(brand.labeledImages || []);

    console.log('🎨 Creative Director V3:');
    console.log('   Template:', result.templateUsed);
    console.log('   Style refs:', styleRefs.slice(0, 50) + '...');
    console.log('   Variations:', promptVariations.length);
    console.log('   Image selection:', imageSelection.reasoning);

    return NextResponse.json({
      success: true,
      concept: {
        // Base prompt (for display/debugging)
        finalPrompt: result.prompt + '\n\n' + styleRefs,
        // 4 variations for generation
        promptVariations,
        negativePrompt: result.negativePrompt,
        templateUsed: result.templateUsed,
        params,
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
    fields: t.fields
  }));

  return NextResponse.json({
    success: true,
    templates,
    styleReferences: Object.keys(STYLE_REFERENCE_MAP)
  });
}
