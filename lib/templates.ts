// ============================================================================
// TEMPLATE SYSTEM V2 - Creative prompts with quality focus
// ============================================================================
// Key insight: Don't over-specify layout. Focus on:
// 1. Role & task framing
// 2. Brand identity (colors, aesthetic, tone)
// 3. Quality indicators ("trending on Behance", "8k resolution")
// 4. Creative freedom with the provided images
// 5. Strong negative prompt
// ============================================================================

export type TemplateId = 'stat' | 'announcement' | 'event' | 'quote' | 'expert' | 'product';

export interface Template {
  id: TemplateId;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  icon: string;
  keywords: string[]; // For auto-detection
  buildPrompt: (params: TemplateParams) => string;
  negativePrompt: string;
}

export interface TemplateParams {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  aesthetic?: string;
  toneVoice?: string;
  headline?: string;
  subheadline?: string;
  metric?: string;
  metricLabel?: string;
  quote?: string;
  personName?: string;
  personTitle?: string;
  eventDate?: string;
  eventTime?: string;
}

// Shared quality indicators that make outputs look professional
const QUALITY_SUFFIX = `
High quality, 8k resolution, sharp details, premium design.
Trending on Behance, Dribbble quality.
Modern, balanced composition with adequate whitespace.`;

// Shared negative prompt
const NEGATIVE_PROMPT = `messy, cluttered, ugly text, distorted logo, low resolution, blurry, weird cropping, amateur, wrong colors, plastic look, AI artifacts, generic stock photo, boring, flat design without depth`;

// ============================================================================
// TEMPLATE DEFINITIONS
// ============================================================================

const TEMPLATES: Template[] = [
  // ---------------------------------------------------------------------------
  // 1. STAT - Big metric with impact
  // ---------------------------------------------------------------------------
  {
    id: 'stat',
    name: 'Stat / Data',
    nameFr: 'Statistique',
    description: 'Big metric with context - perfect for results, growth, impact',
    descriptionFr: 'Chiffre clé avec contexte - résultats, croissance, impact',
    icon: '📊',
    keywords: ['%', 'résultat', 'croissance', 'chiffre', 'stat', 'data', 'million', 'milliard', 'augmentation', 'baisse', 'impact', 'performance'],
    buildPrompt: ({ brandName, primaryColor, secondaryColor, aesthetic, toneVoice, metric, metricLabel }) => {
      return `ROLE: Expert Social Media Designer.
TASK: Create a high-converting social media visual featuring a KEY STATISTIC.

BRIEF: Professional data visualization post for ${brandName}.
The hero element is the metric "${metric || '+47%'}" ${metricLabel ? `representing "${metricLabel}"` : ''}.
Make the number BOLD, IMPACTFUL, and the focal point of the design.

Style: ${aesthetic || 'Modern, Professional, Bold'}
Vibe: ${toneVoice || 'Confident, Data-driven, Authoritative'}

BRAND IDENTITY (STRICTLY FOLLOW):
Brand: ${brandName}
Primary Color: ${primaryColor} (use prominently)
Secondary Color: ${secondaryColor}

DESIGN GUIDELINES:
- COMPOSITION: The metric should be large and impossible to miss
- ASSETS: Use the provided image(s) as design elements. Integrate naturally.
- COLOR: Use brand colors creatively - gradients, overlays, accents
- LOGO: Ensure brand logo is visible and respects brand guidelines
- DEPTH: Add visual interest through shadows, gradients, or layering

${QUALITY_SUFFIX}`;
    },
    negativePrompt: NEGATIVE_PROMPT
  },

  // ---------------------------------------------------------------------------
  // 2. ANNOUNCEMENT - News, launches, partnerships
  // ---------------------------------------------------------------------------
  {
    id: 'announcement',
    name: 'Announcement',
    nameFr: 'Annonce',
    description: 'Big headline with brand identity - launches, partnerships, news',
    descriptionFr: 'Grande headline avec identité - lancements, partenariats, actus',
    icon: '📢',
    keywords: ['annonce', 'nouveau', 'lancement', 'partenariat', 'rejoindre', 'bienvenue', 'officiel', 'présente', 'dévoile'],
    buildPrompt: ({ brandName, primaryColor, secondaryColor, aesthetic, toneVoice, headline, subheadline }) => {
      return `ROLE: Expert Social Media Designer.
TASK: Create a high-converting social media visual for an ANNOUNCEMENT.

BRIEF: Professional announcement post for ${brandName}.
Main message: "${headline || 'Exciting News'}"
${subheadline ? `Supporting text: "${subheadline}"` : ''}

Style: ${aesthetic || 'Modern, Sleek, Professional'}
Vibe: ${toneVoice || 'Exciting, Confident, Forward-thinking'}

BRAND IDENTITY (STRICTLY FOLLOW):
Brand: ${brandName}
Primary Color: ${primaryColor} (use as main accent)
Secondary Color: ${secondaryColor}

DESIGN GUIDELINES:
- COMPOSITION: Bold, attention-grabbing, news-worthy feel
- ASSETS: Use the provided image(s) as HERO elements. Integrate naturally into the scene.
- COLOR: Use brand palette creatively for backgrounds, shapes, overlays
- LOGO: Brand logo should be prominent and well-integrated
- TYPOGRAPHY: Headlines should feel important and newsworthy

${QUALITY_SUFFIX}`;
    },
    negativePrompt: NEGATIVE_PROMPT
  },

  // ---------------------------------------------------------------------------
  // 3. EVENT/WEBINAR
  // ---------------------------------------------------------------------------
  {
    id: 'event',
    name: 'Event / Webinar',
    nameFr: 'Événement',
    description: 'Event promotion with date and call-to-action',
    descriptionFr: 'Promotion événement avec date et inscription',
    icon: '🎤',
    keywords: ['webinar', 'event', 'événement', 'conférence', 'live', 'inscription', 'rdv', 'rendez-vous', 'save the date', 'join'],
    buildPrompt: ({ brandName, primaryColor, secondaryColor, aesthetic, toneVoice, headline, eventDate, eventTime }) => {
      return `ROLE: Expert Social Media Designer.
TASK: Create a high-converting social media visual for an EVENT/WEBINAR.

BRIEF: Professional event promotion for ${brandName}.
Event: "${headline || 'Upcoming Event'}"
${eventDate ? `Date: ${eventDate}` : ''}
${eventTime ? `Time: ${eventTime}` : ''}

Style: ${aesthetic || 'Modern, Professional, Engaging'}
Vibe: ${toneVoice || 'Exciting, Exclusive, Must-attend'}

BRAND IDENTITY (STRICTLY FOLLOW):
Brand: ${brandName}
Primary Color: ${primaryColor}
Secondary Color: ${secondaryColor}

DESIGN GUIDELINES:
- COMPOSITION: Event poster feel - clear hierarchy of information
- ASSETS: Use provided images as speakers, venue, or decorative elements
- COLOR: Brand colors should dominate, creating cohesive event branding
- CTA: Design should encourage registration/attendance
- ENERGY: Feel of anticipation and exclusivity

${QUALITY_SUFFIX}`;
    },
    negativePrompt: NEGATIVE_PROMPT
  },

  // ---------------------------------------------------------------------------
  // 4. QUOTE/TESTIMONIAL
  // ---------------------------------------------------------------------------
  {
    id: 'quote',
    name: 'Quote / Testimonial',
    nameFr: 'Citation',
    description: 'Customer quote or inspiring statement',
    descriptionFr: 'Témoignage client ou citation inspirante',
    icon: '💬',
    keywords: ['témoignage', 'quote', 'citation', 'client', 'avis', 'feedback', 'dit', 'selon', 'confiance'],
    buildPrompt: ({ brandName, primaryColor, secondaryColor, aesthetic, toneVoice, headline, personName, personTitle }) => {
      return `ROLE: Expert Social Media Designer.
TASK: Create a high-converting social media visual featuring a TESTIMONIAL/QUOTE.

BRIEF: Professional testimonial post for ${brandName}.
Quote: "${headline || 'Customer testimonial here'}"
${personName ? `Attribution: ${personName}${personTitle ? `, ${personTitle}` : ''}` : ''}

Style: ${aesthetic || 'Editorial, Sophisticated, Trustworthy'}
Vibe: ${toneVoice || 'Authentic, Credible, Human'}

BRAND IDENTITY (STRICTLY FOLLOW):
Brand: ${brandName}
Primary Color: ${primaryColor}
Secondary Color: ${secondaryColor}

DESIGN GUIDELINES:
- COMPOSITION: Quote should be the hero - elegant typography
- ASSETS: Use provided image as portrait or decorative element
- COLOR: Sophisticated palette, quote marks as design elements
- FEEL: Like a magazine pull-quote or editorial feature
- CREDIBILITY: Professional, trustworthy, authentic feeling

${QUALITY_SUFFIX}`;
    },
    negativePrompt: NEGATIVE_PROMPT
  },

  // ---------------------------------------------------------------------------
  // 5. EXPERT/THOUGHT LEADER
  // ---------------------------------------------------------------------------
  {
    id: 'expert',
    name: 'Expert / Speaker',
    nameFr: 'Expert',
    description: 'Feature a person with graphic overlay',
    descriptionFr: 'Mettre en avant une personne avec design graphique',
    icon: '👤',
    keywords: ['expert', 'speaker', 'intervenant', 'tribune', 'portrait', 'interview', 'rencontre', 'présente'],
    buildPrompt: ({ brandName, primaryColor, secondaryColor, aesthetic, toneVoice, headline, personName, personTitle }) => {
      return `ROLE: Expert Social Media Designer.
TASK: Create a high-converting social media visual featuring an EXPERT/SPEAKER.

BRIEF: Professional expert feature for ${brandName}.
${headline ? `Topic/Title: "${headline}"` : ''}
${personName ? `Expert: ${personName}${personTitle ? `, ${personTitle}` : ''}` : ''}

Style: ${aesthetic || 'Modern, Editorial, Professional'}
Vibe: ${toneVoice || 'Authoritative, Inspiring, Thought-provoking'}

BRAND IDENTITY (STRICTLY FOLLOW):
Brand: ${brandName}
Primary Color: ${primaryColor}
Secondary Color: ${secondaryColor}

DESIGN GUIDELINES:
- COMPOSITION: Person/expert as hero with supporting graphics
- ASSETS: Use provided portrait prominently, integrated with brand elements
- COLOR: Brand colors as overlays, accents, or graphic elements
- GRAPHICS: Add geometric shapes, lines, or patterns for visual interest
- AUTHORITY: Design should convey expertise and credibility

${QUALITY_SUFFIX}`;
    },
    negativePrompt: NEGATIVE_PROMPT
  },

  // ---------------------------------------------------------------------------
  // 6. PRODUCT/FEATURE
  // ---------------------------------------------------------------------------
  {
    id: 'product',
    name: 'Product / Feature',
    nameFr: 'Produit',
    description: 'Showcase a product or feature with screenshot',
    descriptionFr: 'Mettre en avant un produit ou une fonctionnalité',
    icon: '✨',
    keywords: ['produit', 'feature', 'fonctionnalité', 'nouveau', 'découvrez', 'interface', 'app', 'outil', 'solution'],
    buildPrompt: ({ brandName, primaryColor, secondaryColor, aesthetic, toneVoice, headline, subheadline }) => {
      return `ROLE: Expert Social Media Designer.
TASK: Create a high-converting social media visual showcasing a PRODUCT/FEATURE.

BRIEF: Professional product showcase for ${brandName}.
Feature: "${headline || 'New Feature'}"
${subheadline ? `Description: "${subheadline}"` : ''}

Style: ${aesthetic || 'Clean, Modern, Tech-forward'}
Vibe: ${toneVoice || 'Innovative, Sleek, Desirable'}

BRAND IDENTITY (STRICTLY FOLLOW):
Brand: ${brandName}
Primary Color: ${primaryColor}
Secondary Color: ${secondaryColor}

DESIGN GUIDELINES:
- COMPOSITION: Product/UI as hero, beautifully staged
- ASSETS: Use provided screenshot/product image as the main focus
- MOCKUP: Frame in device mockup or floating UI style if appropriate
- COLOR: Brand colors as backgrounds, accents, highlights
- PREMIUM: Apple/Linear-style product marketing aesthetic

${QUALITY_SUFFIX}`;
    },
    negativePrompt: NEGATIVE_PROMPT
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getAllTemplates(): Template[] {
  return TEMPLATES;
}

export function getTemplate(id: TemplateId): Template | undefined {
  return TEMPLATES.find(t => t.id === id);
}

export function detectTemplate(brief: string): Template {
  const lowerBrief = brief.toLowerCase();
  
  let bestMatch: Template = TEMPLATES[1]; // Default to announcement
  let bestScore = 0;
  
  for (const template of TEMPLATES) {
    let score = 0;
    for (const keyword of template.keywords) {
      if (lowerBrief.includes(keyword.toLowerCase())) {
        score += 1;
        if (new RegExp(`\\b${keyword}\\b`, 'i').test(lowerBrief)) {
          score += 0.5;
        }
      }
    }
    if (template.id === 'stat' && /\d+[%KMB]?/.test(brief)) {
      score += 2;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = template;
    }
  }
  
  return bestMatch;
}

export function extractMetric(brief: string): { metric: string; label: string } | null {
  const metricMatch = brief.match(/([+-]?\d+[.,]?\d*\s*[%KMB]?|\d{1,3}(?:[,.\s]\d{3})+)/i);
  
  if (metricMatch) {
    const metric = metricMatch[1].trim();
    const labelMatch = brief.match(new RegExp(`${metric.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:de\\s+)?([\\w\\s]+)`, 'i'));
    const label = labelMatch ? labelMatch[1].trim().slice(0, 30) : '';
    return { metric, label };
  }
  
  return null;
}

export interface BuildPromptResult {
  prompt: string;
  negativePrompt: string;
  templateUsed: TemplateId;
}

export function buildTemplatePrompt(
  templateId: TemplateId,
  params: TemplateParams
): BuildPromptResult {
  const template = getTemplate(templateId);
  
  if (!template) {
    const fallback = TEMPLATES[1];
    return {
      prompt: fallback.buildPrompt(params),
      negativePrompt: fallback.negativePrompt,
      templateUsed: fallback.id
    };
  }
  
  return {
    prompt: template.buildPrompt(params),
    negativePrompt: template.negativePrompt,
    templateUsed: template.id
  };
}
