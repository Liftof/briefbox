// ============================================================================
// TEMPLATE SYSTEM V3 - Creative Freedom + Quality Focus
// ============================================================================
// Key insight: Don't be too literal. Focus on:
// 1. Quality and style references
// 2. Brand identity (colors, aesthetic)
// 3. Using provided images CREATIVELY
// 4. Letting the model interpret the brief
// ============================================================================

export type TemplateId = 'stat' | 'announcement' | 'event' | 'quote' | 'expert' | 'product';

export interface Template {
  id: TemplateId;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  icon: string;
  keywords: string[];
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

// ============================================================================
// CORE PROMPT COMPONENTS
// ============================================================================

// This is the magic sauce - quality indicators that work
const QUALITY_BLOCK = `
QUALITY REQUIREMENTS:
- Trending on Behance, Dribbble shot of the week quality
- 8k resolution, sharp details, premium design
- Rich gradients, NO flat solid backgrounds
- Depth through shadows, overlays, and layering
- Premium editorial feel, NOT generic corporate`;

// Negative prompt to avoid common issues
const NEGATIVE_PROMPT = `solid black background, solid white background, plain flat background, messy, cluttered, ugly text, distorted logo, low resolution, blurry, amateur, generic stock photo, boring, flat design, plastic AI look, corporate clip art, PowerPoint style, basic, uninspired`;

// ============================================================================
// TEMPLATE DEFINITIONS
// ============================================================================

const TEMPLATES: Template[] = [
  // ---------------------------------------------------------------------------
  // 1. STAT - Data-driven visual
  // ---------------------------------------------------------------------------
  {
    id: 'stat',
    name: 'Stat / Data',
    nameFr: 'Statistique',
    description: 'Big metric with context - perfect for results, growth, impact',
    descriptionFr: 'Chiffre clé avec contexte - résultats, croissance, impact',
    icon: '📊',
    keywords: ['%', 'résultat', 'croissance', 'chiffre', 'stat', 'data', 'million', 'milliard', 'augmentation', 'baisse', 'impact', 'performance', 'x'],
    buildPrompt: ({ brandName, primaryColor, secondaryColor, aesthetic, toneVoice, headline, metric, metricLabel }) => {
      const fullContext = headline || `${metric || ''} ${metricLabel || ''}`.trim();
      
      return `ROLE: Expert Social Media Designer creating a high-impact visual.

TASK: Design a stunning social media post for ${brandName} about: "${fullContext}"

This is NOT just a number on a background. Create a COMPLETE, CREATIVE visual that tells a story.
The data point should be integrated into an engaging, premium design composition.

CREATIVE DIRECTION:
- Use the provided brand assets as hero elements
- Create visual metaphors or abstract representations of the data
- Rich gradient backgrounds using ${primaryColor} and ${secondaryColor}
- Dynamic composition with depth and movement
- Typography integrated naturally, not just overlaid

BRAND IDENTITY:
Brand: ${brandName}
Aesthetic: ${aesthetic || 'Modern, Bold, Premium'}
Vibe: ${toneVoice || 'Confident, Innovative'}
Colors: ${primaryColor} (primary), ${secondaryColor} (accent)

${QUALITY_BLOCK}

Style references: Spotify Wrapped, Apple keynotes, Stripe marketing, Nike campaigns.`;
    },
    negativePrompt: NEGATIVE_PROMPT
  },

  // ---------------------------------------------------------------------------
  // 2. ANNOUNCEMENT - News and launches
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
      return `ROLE: Expert Social Media Designer creating a high-impact visual.

TASK: Design a stunning announcement post for ${brandName}.
Message: "${headline || 'Exciting News'}"
${subheadline ? `Context: "${subheadline}"` : ''}

Create a visual that feels like a major brand moment - exciting, premium, shareable.
NOT a boring corporate announcement. Make it FEEL important.

CREATIVE DIRECTION:
- Use provided brand assets prominently and creatively
- Dynamic, energetic composition that draws attention
- Rich colors: gradients from ${primaryColor} to ${secondaryColor}
- Premium typography treatment
- Visual excitement through shapes, patterns, or abstract elements

BRAND IDENTITY:
Brand: ${brandName}
Aesthetic: ${aesthetic || 'Modern, Sleek, Professional'}
Vibe: ${toneVoice || 'Exciting, Confident'}
Colors: ${primaryColor}, ${secondaryColor}

${QUALITY_BLOCK}

Style references: Apple product launches, Tesla announcements, Notion updates.`;
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
      return `ROLE: Expert Social Media Designer creating a high-impact visual.

TASK: Design an exciting event promotion for ${brandName}.
Event: "${headline || 'Upcoming Event'}"
${eventDate ? `Date: ${eventDate}` : ''}

Create anticipation and FOMO. This should feel like an exclusive, must-attend event.
NOT a boring calendar invite. Make people WANT to register.

CREATIVE DIRECTION:
- Use provided assets to create an atmosphere of exclusivity
- Dynamic composition suggesting action and energy
- Rich gradient background from ${primaryColor} through ${secondaryColor}
- Clear visual hierarchy: event name prominent
- Modern, festival-poster or tech-conference vibe

BRAND IDENTITY:
Brand: ${brandName}
Aesthetic: ${aesthetic || 'Modern, Professional, Engaging'}
Vibe: ${toneVoice || 'Exciting, Exclusive'}
Colors: ${primaryColor}, ${secondaryColor}

${QUALITY_BLOCK}

Style references: TED talks, Web Summit, Apple WWDC, Figma Config.`;
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
      return `ROLE: Expert Social Media Designer creating a high-impact visual.

TASK: Design a compelling testimonial/quote post for ${brandName}.
Quote: "${headline || 'Customer testimonial'}"
${personName ? `From: ${personName}${personTitle ? `, ${personTitle}` : ''}` : ''}

Create an editorial, magazine-quality quote visual. Elegant, credible, premium.
NOT just text on a background. Create a DESIGNED piece.

CREATIVE DIRECTION:
- Use provided assets as supporting visual elements
- Sophisticated color palette based on ${primaryColor} and ${secondaryColor}
- Elegant typography treatment - quotation marks as design elements
- Subtle textures or gradients for depth
- Editorial, magazine-quality aesthetic

BRAND IDENTITY:
Brand: ${brandName}
Aesthetic: ${aesthetic || 'Editorial, Sophisticated, Trustworthy'}
Vibe: ${toneVoice || 'Authentic, Credible'}
Colors: ${primaryColor}, ${secondaryColor}

${QUALITY_BLOCK}

Style references: Harvard Business Review, Monocle magazine, The Economist, Kinfolk.`;
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
      return `ROLE: Expert Social Media Designer creating a high-impact visual.

TASK: Design a speaker/expert feature post for ${brandName}.
${headline ? `Topic: "${headline}"` : ''}
${personName ? `Expert: ${personName}${personTitle ? `, ${personTitle}` : ''}` : ''}

Create a bold, modern expert feature. Think TED talk speaker card meets fashion editorial.
Dynamic, memorable, authority-building.

CREATIVE DIRECTION:
- Use provided portrait/assets as the HERO element
- Add graphic elements: shapes, lines, patterns in ${primaryColor}
- Modern composition mixing photography with graphics
- Bold color accents using ${secondaryColor}
- Contemporary, design-forward aesthetic

BRAND IDENTITY:
Brand: ${brandName}
Aesthetic: ${aesthetic || 'Modern, Editorial, Professional'}
Vibe: ${toneVoice || 'Authoritative, Inspiring'}
Colors: ${primaryColor}, ${secondaryColor}

${QUALITY_BLOCK}

Style references: TED speakers, Forbes features, design conference programs.`;
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
      return `ROLE: Expert Social Media Designer creating a high-impact visual.

TASK: Design a product showcase post for ${brandName}.
Feature: "${headline || 'New Feature'}"
${subheadline ? `Description: "${subheadline}"` : ''}

Create an Apple-level product reveal. Premium, desirable, innovative.
The product/screenshot should be the hero, beautifully presented.

CREATIVE DIRECTION:
- Use provided product/UI assets as the HERO element
- Floating or staged presentation (like Apple product shots)
- Rich gradient background from ${primaryColor} to dark
- Subtle shadows and reflections for premium feel
- Clean but NOT boring - add visual interest

BRAND IDENTITY:
Brand: ${brandName}
Aesthetic: ${aesthetic || 'Clean, Modern, Tech-forward'}
Vibe: ${toneVoice || 'Innovative, Premium'}
Colors: ${primaryColor}, ${secondaryColor}

${QUALITY_BLOCK}

Style references: Apple product pages, Linear app marketing, Notion features.`;
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
    if (template.id === 'stat' && /\d+[%xXKMB]?/.test(brief)) {
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
  const metricMatch = brief.match(/([+-]?\d+[.,]?\d*\s*[%xXKMB]?|\d{1,3}(?:[,.\s]\d{3})+)/i);
  
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
