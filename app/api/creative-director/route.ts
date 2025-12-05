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

// Analyze prompt to determine which image categories are most relevant
function analyzePromptForImages(prompt: string): {
  boostCategories: string[];
  reasoning: string;
} {
  const lowerPrompt = prompt.toLowerCase();
  const boostCategories: string[] = [];
  const reasons: string[] = [];

  // Team/People keywords
  if (/équipe|team|collaborat|humain|personne|employee|staff|membre/.test(lowerPrompt)) {
    boostCategories.push('person', 'team');
    reasons.push('mentions people/team');
  }

  // Product keywords
  if (/produit|product|solution|outil|tool|fonctionnalit|feature/.test(lowerPrompt)) {
    boostCategories.push('product', 'app_ui');
    reasons.push('mentions product');
  }

  // App/Interface keywords
  if (/app|interface|dashboard|écran|screen|ui|ux|plateforme/.test(lowerPrompt)) {
    boostCategories.push('app_ui');
    reasons.push('mentions app/interface');
  }

  // Trust/Social proof keywords
  if (/client|témoignage|testimonial|confiance|trust|partenaire|partner/.test(lowerPrompt)) {
    boostCategories.push('client_logo', 'person');
    reasons.push('mentions social proof');
  }

  // Stats/Numbers keywords
  if (/\d+%|\d+k|\d+m|statistique|stat|chiffre|number|metric|résultat|result/.test(lowerPrompt)) {
    boostCategories.push('main_logo', 'texture');
    reasons.push('mentions stats/metrics');
  }

  // Event keywords
  if (/événement|event|webinar|conférence|meetup|live|lancement|launch/.test(lowerPrompt)) {
    boostCategories.push('main_logo', 'person');
    reasons.push('mentions event');
  }

  return {
    boostCategories: [...new Set(boostCategories)], // Dedupe
    reasoning: reasons.length > 0 ? `Prompt ${reasons.join(', ')}` : 'No specific keywords detected'
  };
}

// Smart image selection based on template type AND prompt analysis
function getImagePriority(
  labeledImages: any[], 
  templateId: TemplateId = 'announcement',
  prompt: string = '' // NEW: Analyze prompt for smarter selection
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

  // Analyze prompt for semantic image needs
  const promptAnalysis = analyzePromptForImages(prompt);
  
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
  
  // SMART SELECTION: Combine template needs with prompt analysis
  // Prompt-boosted categories come first, then template defaults
  const boostedCategories = promptAnalysis.boostCategories;
  const templateCategories = templateNeeds.priority.filter(c => !boostedCategories.includes(c));
  const finalPriorityOrder = [...boostedCategories, ...templateCategories];
  
  console.log(`🧠 Smart image selection: ${promptAnalysis.reasoning}`);
  console.log(`   Priority order: ${finalPriorityOrder.join(' → ')}`);
  
  // Always ensure logo is in the first 5 positions (high fidelity zone)
  // So we add it first if not already boosted
  if (!boostedCategories.includes('main_logo')) {
    const logoImages = labeledImages.filter(img => img.category === 'main_logo' && !img.url?.includes('placeholder'));
    for (const img of logoImages) {
      if (priority.length < 1) { // Logo goes first
        priority.push(img.url);
        imageRoles[img.url] = 'BRAND_LOGO (CRITICAL): This is the brand logo - display it clearly. DO NOT distort.';
      }
    }
  }
  
  // Select images based on smart priority order (prompt analysis + template)
  for (const category of finalPriorityOrder) {
    if (priority.length >= templateNeeds.maxImages + 2) break; // Allow 2 extra for prompt-relevant images
    
    const images = labeledImages.filter(img => img.category === category);
    for (const img of images) {
      if (priority.length >= templateNeeds.maxImages + 2) break;
      
      // Skip very small images or placeholders
      if (img.url?.includes('placeholder') || img.url?.includes('1x1')) {
        excluded.push(img.url);
        continue;
      }
      
      // Skip if already added (e.g., logo)
      if (priority.includes(img.url)) continue;
      
      priority.push(img.url);
      
      // Assign semantic role based on category + whether it was prompt-boosted
      const isBoosted = boostedCategories.includes(category);
      const boostPrefix = isBoosted ? '(PROMPT-RELEVANT) ' : '';
      
      switch (category) {
        case 'main_logo':
          imageRoles[img.url] = `${boostPrefix}BRAND_LOGO: This is the brand logo - display it clearly and prominently`;
          break;
        case 'product':
          imageRoles[img.url] = `${boostPrefix}PRODUCT_IMAGE: This is the main product - make it the hero element`;
          break;
        case 'app_ui':
          imageRoles[img.url] = `${boostPrefix}APP_SCREENSHOT: Use as a visual element showing the product interface`;
          break;
        case 'person':
        case 'team':
          imageRoles[img.url] = `${boostPrefix}PERSON_IMAGE: Human element - feature prominently as requested`;
          break;
        case 'client_logo':
          imageRoles[img.url] = `${boostPrefix}CLIENT_LOGO: Social proof element - show trust/partnership`;
          break;
        case 'texture':
          imageRoles[img.url] = `${boostPrefix}TEXTURE: Use as background element or visual texture`;
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
    `Template "${templateId}" needs: ${templateNeeds.priority.slice(0, 3).join(', ')}`
  ];
  
  // Add prompt analysis reasoning
  if (promptAnalysis.boostCategories.length > 0) {
    reasoningParts.push(`Prompt boosted: ${promptAnalysis.boostCategories.join(', ')}`);
  }
  
  reasoningParts.push(`Selected ${priority.length} content images`);
  
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

// Language-specific prompt additions with copywriting nuances
const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  fr: `PRIMARY LANGUAGE: FRENCH (Français).
- All text must be in native, idiomatic French
- Use correct French typography: « » for quotes, espaces insécables before : ; ! ?
- French copy style: elegant, slightly more formal than English, but still punchy
- Avoid anglicisms unless they're commonly used (ex: "digital" is OK)
- Good French headlines: "Révolutionnez votre...", "Découvrez comment...", "Le futur de..."`,
  
  en: `PRIMARY LANGUAGE: ENGLISH.
- All text must be in native, idiomatic English
- English copy style: punchy, direct, action-oriented
- Use power words: "Unlock", "Discover", "Transform", "Boost"
- Keep it short: every word must earn its place`,
  
  es: `PRIMARY LANGUAGE: SPANISH (Español).
- All text must be in native, idiomatic Spanish
- Spanish copy style: warm, engaging, benefit-focused
- Use formal "usted" for B2B, informal "tú" for B2C
- Good Spanish headlines: "Descubre cómo...", "Transforma tu...", "El secreto de..."`,
  
  de: `PRIMARY LANGUAGE: GERMAN (Deutsch).
- All text must be in native, idiomatic German
- German copy style: precise, trustworthy, benefit-oriented
- Capitalize all nouns correctly
- Good German headlines: "Entdecken Sie...", "So funktioniert...", "Der Weg zu..."`,
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

    // PREPARE BRAND KNOWLEDGE (Stats, Testimonials, Values)
    // This allows the model to use real data even if not explicitly in the brief
    const brandKnowledge = [];
    
    if (brand.contentNuggets?.realStats?.length > 0) {
        brandKnowledge.push(`KEY STATS:\n${brand.contentNuggets.realStats.slice(0, 3).map((s: string) => `- ${s}`).join('\n')}`);
    }
    
    if (brand.contentNuggets?.testimonials?.length > 0) {
        brandKnowledge.push(`CLIENT TESTIMONIALS:\n${brand.contentNuggets.testimonials.slice(0, 2).map((t: any) => `- "${t.quote}" (${t.author})`).join('\n')}`);
    }
    
    if (brand.values?.length > 0) {
        brandKnowledge.push(`CORE VALUES: ${brand.values.join(', ')}`);
    }

    // Inject Pain Points and Visual Motifs
    if (brand.painPoints?.length > 0) {
        brandKnowledge.push(`CUSTOMER PAIN POINTS: ${brand.painPoints.join(', ')}`);
    }
    
    if (brand.visualMotifs?.length > 0) {
        brandKnowledge.push(`BRAND VISUAL MOTIFS: ${brand.visualMotifs.join(', ')}`);
    }

    const knowledgeContext = brandKnowledge.length > 0 
        ? `\n\nBRAND KNOWLEDGE & DATA (Use these facts/quotes if relevant to the brief):\n${brandKnowledge.join('\n')}`
        : '';

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
    
    // Smart image selection - BASED ON TEMPLATE TYPE + PROMPT ANALYSIS
    const imageSelection = getImagePriority(brand.labeledImages || [], templateId, brief);
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
    // This is the exact prompt structure that works well with Gemini 3 Pro (with thinking mode)
    const buildStructuredPrompt = (variationEmphasis: string) => {
      return `
ROLE: Expert Art Director & Copywriter for a Brand Agency.

THINK STEP BY STEP:
1. First, analyze the brief and identify the key message
2. Then, consider the brand identity and how to express it visually
3. Plan the composition: where will the logo go? The headline? The visual elements?
4. Finally, generate the image with all elements perfectly placed

TASK: Create a sophisticated social media visual based on the following brief. The goal is to create a "stopper" visual - something that immediately grabs attention in a feed.

BRIEF: ${brief}.
AESTHETIC: ${aesthetic} (but interpreted with high taste).
VIBE: ${toneVoice}.

USER-CENTRIC MINDSET (CRITICAL):
- THE VIEWER is scrolling fast. Has 0.5 seconds to notice you.
- YOUR JOB: Create something that resonates with THEIR world.
- THE TEST: Would the target audience stop for this? Does it speak to THEM?

ADAPT TO THE BRAND CONTEXT:
- Industry: ${brand.industry || 'General'}
- Brand values: ${brand.values?.join(', ') || 'Not specified'}
- Tone: ${toneVoice}

TONE CALIBRATION (crucial):
→ If CORPORATE/CONSULTING: Professional credibility, subtle authority, smart insights. No flashy gimmicks.
→ If LOCAL SERVICE (salon, restaurant, artisan): Warm, personal, community-focused. Real and authentic.
→ If NONPROFIT/CAUSE: Emotional impact, human stories, call to action. Meaning over marketing.
→ If SAAS/TECH: Clear value prop, problem-solution, modern and clean. Benefits over features.
→ If LIFESTYLE/CREATIVE: Aesthetic-first, aspirational, mood-driven. Vibe over explanation.
→ If E-COMMERCE: Product hero, desire-triggering, urgency when appropriate.

THE RIGHT EMOTION FOR THE CONTEXT:
- B2B/Corporate → Trust, competence, "they get it"
- B2C Service → Warmth, "I'm in good hands"  
- Cause/Nonprofit → Empathy, purpose, "I want to help"
- Tech/SaaS → Curiosity, efficiency, "this could solve my problem"
- Lifestyle → Aspiration, belonging, "I want this life"

COPYWRITING INSTRUCTIONS (CRITICAL):
- TRANSFORM the brief into compelling marketing copy in ${language}.
- DO NOT just copy-paste the brief. Reinterpret it to spark CURIOSITY.
- Tone: ${toneVoice}.

THE GOAL: Make the viewer STOP scrolling and WANT to know more.
- What's the hook? What's the "wait, what?" moment?
- What problem does this solve for THEM?
- What emotion should they feel? (curiosity, relief, ambition, FOMO...)

HEADLINE INSPIRATION (adapt freely):
- "Comment [action] sans [pain point]" → Curiosity + solution
- "[Chiffre impactant] + [promesse]" → Credibility + benefit
- "Le secret que [audience] ne vous dira jamais" → Intrigue
- "[Question qui pique]" → Engagement
- "Vous aussi vous [frustration commune] ?" → Empathy
- "[Statement audacieux]." → Authority

TEXT ELEMENTS - BE CREATIVE:
- You can use multiple text elements if it serves the story
- Play with hierarchy: big headline, smaller context, tiny detail
- Text can interact with visuals (wrap around, point to, emerge from...)
- Use shapes, badges, callouts if relevant
- BUT: every text must be 100% READABLE (contrast, size, spacing)

WHAT TO AVOID (= instant scroll-past):
- Generic corporate speak that means nothing ("solutions innovantes", "leader du marché")
- Tone mismatch: don't be "startup bro" for a law firm, don't be stiff for a yoga studio
- Empty buzzwords without substance
- Text that explains the obvious
- Cringe motivational quotes (unless the brand IS motivational)
- Fake urgency for non-urgent things
- Being clever for clever's sake - clarity > cleverness
- Anything that feels disconnected from what the brand actually DOES for people

BRAND IDENTITY (STRICTLY FOLLOW):

Brand: ${brandName}
Aesthetic: ${aesthetic}
Tone: ${toneVoice}
Colors: ${colors.join(', ')}
Fonts: Sans-serif (modern), Helvetica Neue

DESIGN GUIDELINES (AVOID GENERIC VISUALS):
- COMPOSITION: Use asymmetrical layouts, extreme close-ups, or bold negative space. Avoid standard "centered text on image" templates.
- STYLE: ${variationEmphasis} ${templateStyleEmphasis}
- LOGO: respect the client's logo, be precise in its reproduction
- ASSETS: Use the provided image as the HERO element. Integrate it naturally into a scene or layout. Do NOT just crop the image.
- COLOR: Use the brand palette with restraint. Specifically use ${primaryColor} as a primary accent.
- BRAND VISUAL MOTIFS: Incorporate these elements subtlety if possible: ${brand.visualMotifs?.join(', ') || 'None'}.
- LOGO PROTECTION (CRITICAL): A logo image is provided in the input. YOU MUST USE THIS EXACT LOGO. Do NOT generate a fake logo. Do NOT distort, warp, or modify the provided logo. It must remain perfectly legible.
- STYLE REFERENCES: If style reference images are provided, capture their MOOD, LIGHTING, and COMPOSITION only. Do NOT copy the specific objects or content of the reference.
- TYPOGRAPHY & TEXT: PERFECT SPELLING IS MANDATORY. Double-check all generated text for correctness. No typos, no gibberish. Use professional kerning and spacing.
- QUALITY: Editorial quality, sharp details, professional lighting. Avoid "stock photo" look, avoid 3D render artifacts, avoid generic tech graphics.

SPECIFIC AVOIDANCE LIST:
- No "businessmen shaking hands"
- No "generic team meeting around laptop"
- No "abstract blue nodes network"
- No "robot hand touching human hand"
- No "rocket ship launching"
- No "puzzle pieces"
- No "busy backgrounds with too much text"

🚫 FOR SAAS/TECH PRODUCTS - CRITICAL:
- DO NOT invent fake UI screens, dashboards, or app interfaces
- DO NOT generate fictional software interfaces that don't exist
- If no real screenshot is provided, be EVOCATIVE instead:
  → Abstract shapes, gradients, icons to suggest "digital/tech"
  → Focus on the MESSAGE and BENEFIT, not fake product visuals
  → Typography-first designs work great for SaaS
  → Show results/lifestyle imagery rather than invented interfaces
- Only use real UI screenshots if they are provided as assets

${feedbackGuidance ? feedbackGuidance : ''}
${knowledgeContext ? knowledgeContext : ''}

${imageRoleInstructions ? imageRoleInstructions : ''}

NEGATIVE PROMPT: stock photo, cheesy, low quality, blurry, distorted logo, fake logo, bad spelling, typos, gibberish, watermark, watermark, signature, cut off, ugly, amateur, template, generic business art, cluttered, messy, impossible geometry.
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
