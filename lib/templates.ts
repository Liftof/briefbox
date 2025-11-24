// ============================================================================
// TEMPLATE SYSTEM - Social Media Post Templates
// ============================================================================
// Each template is a structured layout with a deterministic prompt for Fal
// No GPT creativity needed - just fill in the blanks with brand data
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
  structure: string; // Visual ASCII representation
  fields: {
    headline: boolean;
    subheadline: boolean;
    metric?: boolean; // For stat template
    quote?: boolean; // For quote template
    date?: boolean; // For event template
    personName?: boolean; // For expert/quote
  };
  buildPrompt: (params: TemplateParams) => string;
  negativePrompt: string;
}

export interface TemplateParams {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  headline?: string;
  subheadline?: string;
  metric?: string; // "87%", "1.7M", etc.
  metricLabel?: string; // "de croissance", "utilisateurs"
  quote?: string;
  personName?: string;
  personTitle?: string;
  eventDate?: string;
  eventTime?: string;
}

// ============================================================================
// TEMPLATE DEFINITIONS
// ============================================================================

const TEMPLATES: Template[] = [
  // ---------------------------------------------------------------------------
  // 1. STAT - Big number + context (Patagonia, Webedia style)
  // ---------------------------------------------------------------------------
  {
    id: 'stat',
    name: 'Stat / Data',
    nameFr: 'Statistique',
    description: 'Big metric with context - perfect for results, growth, impact',
    descriptionFr: 'Chiffre clé avec contexte - résultats, croissance, impact',
    icon: '📊',
    keywords: ['%', 'résultat', 'croissance', 'chiffre', 'stat', 'data', 'million', 'milliard', 'augmentation', 'baisse', 'impact', 'performance'],
    structure: `
┌────────────────────┐
│   [Visual 40%]     │
├────────────────────┤
│      87%           │
│   de croissance    │
│          [Logo]    │
└────────────────────┘`,
    fields: { headline: false, subheadline: false, metric: true },
    buildPrompt: ({ brandName, primaryColor, secondaryColor, metric, metricLabel }) => {
      return `Social media stat post for ${brandName}. 
Split layout: top half has abstract gradient from ${primaryColor} to dark, bottom half is ${primaryColor} solid. 
Giant bold white number "${metric || '87%'}" centered in bottom zone, taking 60% width. 
Small label text "${metricLabel || 'growth'}" below the number. 
Brand logo small in bottom right corner. 
Clean data visualization style. Minimal. Bold typography. No photos, no people.
Style: Stripe, Linear, modern fintech aesthetic.`;
    },
    negativePrompt: 'photograph, people, office, hands, realistic scene, 3D, complex illustration, busy, cluttered'
  },

  // ---------------------------------------------------------------------------
  // 2. ANNOUNCEMENT - Logo + headline + CTA (Notion, Google style)
  // ---------------------------------------------------------------------------
  {
    id: 'announcement',
    name: 'Announcement',
    nameFr: 'Annonce',
    description: 'Big headline with brand identity - launches, partnerships, news',
    descriptionFr: 'Grande headline avec identité - lancements, partenariats, actus',
    icon: '📢',
    keywords: ['annonce', 'nouveau', 'lancement', 'partenariat', 'rejoindre', 'bienvenue', 'officiel', 'présente', 'dévoile'],
    structure: `
┌────────────────────┐
│ [Logo]             │
│                    │
│  GRANDE HEADLINE   │
│  Sous-titre        │
│                    │
│  [Partner logos]   │
│  ══════════════    │
└────────────────────┘`,
    fields: { headline: true, subheadline: true },
    buildPrompt: ({ brandName, primaryColor, secondaryColor, headline, subheadline }) => {
      return `Social media announcement post for ${brandName}.
Background: solid ${primaryColor} color, clean and flat.
Top left: brand logo, small and elegant.
Center: large bold white headline text "${headline || 'YOUR HEADLINE'}".
Below headline: smaller subtext "${subheadline || 'supporting text'}" in white or ${secondaryColor}.
Bottom: thin horizontal line or simple CTA button shape.
Typography-focused design. No photos. Flat graphic design. 
Style: Notion, Slack, modern SaaS announcement aesthetic.`;
    },
    negativePrompt: 'photograph, people, office, 3D render, realistic, complex scene, busy background'
  },

  // ---------------------------------------------------------------------------
  // 3. EVENT/WEBINAR - Date + speakers + CTA (Frisbii style)
  // ---------------------------------------------------------------------------
  {
    id: 'event',
    name: 'Event / Webinar',
    nameFr: 'Événement',
    description: 'Event promotion with date and call-to-action',
    descriptionFr: 'Promotion événement avec date et inscription',
    icon: '🎤',
    keywords: ['webinar', 'event', 'événement', 'conférence', 'live', 'inscription', 'rdv', 'rendez-vous', 'save the date', 'join'],
    structure: `
┌────────────────────┐
│ WEBINAR            │
│ ┌──────┐           │
│ │Photo │ Title     │
│ │zone  │ Date/Time │
│ └──────┘ [CTA]     │
│            [Logo]  │
└────────────────────┘`,
    fields: { headline: true, subheadline: true, date: true },
    buildPrompt: ({ brandName, primaryColor, secondaryColor, headline, eventDate, eventTime }) => {
      return `Social media event/webinar announcement for ${brandName}.
Background: gradient from ${primaryColor} to lighter shade, modern.
Top: large text "WEBINAR" or "EVENT" as decorative background element, 40% opacity.
Left side: rounded rectangle placeholder for speaker photo (abstract silhouette or gradient shape).
Right side: event title "${headline || 'Event Title'}" in bold white.
Below title: date "${eventDate || 'Date'}" and time "${eventTime || 'Time'}" in ${secondaryColor} accent color.
Bottom: CTA button shape "S'inscrire" and brand logo.
Clean event poster style. Professional but vibrant.`;
    },
    negativePrompt: 'realistic photo, 3D render, complex illustration, busy, cluttered, stock photo'
  },

  // ---------------------------------------------------------------------------
  // 4. QUOTE/TESTIMONIAL - Customer voice (Classic LinkedIn)
  // ---------------------------------------------------------------------------
  {
    id: 'quote',
    name: 'Quote / Testimonial',
    nameFr: 'Citation',
    description: 'Customer quote or inspiring statement',
    descriptionFr: 'Témoignage client ou citation inspirante',
    icon: '💬',
    keywords: ['témoignage', 'quote', 'citation', 'client', 'avis', 'feedback', 'dit', 'selon', 'confiance'],
    structure: `
┌────────────────────┐
│ ❝                  │
│ Citation ici       │
│ sur deux lignes    │
│              ❞     │
│ — Nom, Titre       │
│           [Logo]   │
└────────────────────┘`,
    fields: { headline: false, subheadline: false, quote: true, personName: true },
    buildPrompt: ({ brandName, primaryColor, secondaryColor, quote, personName, personTitle }) => {
      return `Social media testimonial post for ${brandName}.
Background: solid dark ${primaryColor} or charcoal gray, elegant.
Top left: giant quotation mark "❝" in ${secondaryColor} accent, decorative.
Center: quote text "${quote || 'Your testimonial here'}" in large white serif or elegant sans-serif typography.
Bottom left: attribution "— ${personName || 'Name'}, ${personTitle || 'Title'}" in smaller text.
Bottom right: brand logo small.
Minimal, editorial, sophisticated. Like a magazine pull quote.
Style: Harvard Business Review, The Economist, premium editorial.`;
    },
    negativePrompt: 'photograph, face, person, 3D, realistic, busy, colorful, playful'
  },

  // ---------------------------------------------------------------------------
  // 5. EXPERT/THOUGHT LEADER - Person feature (Tribune style)
  // ---------------------------------------------------------------------------
  {
    id: 'expert',
    name: 'Expert / Speaker',
    nameFr: 'Expert',
    description: 'Feature a person with graphic overlay',
    descriptionFr: 'Mettre en avant une personne avec design graphique',
    icon: '👤',
    keywords: ['expert', 'speaker', 'intervenant', 'tribune', 'portrait', 'interview', 'rencontre', 'présente'],
    structure: `
┌────────────────────┐
│  ╭──╮   ▲ ◯       │
│  │📷│             │
│  ╰──╯    ★        │
├────────────────────┤
│ NOM + TITRE        │
└────────────────────┘`,
    fields: { headline: true, subheadline: true, personName: true },
    buildPrompt: ({ brandName, primaryColor, secondaryColor, personName, personTitle, headline }) => {
      return `Social media expert feature post for ${brandName}.
Background: ${primaryColor} with geometric shapes overlay (circles, triangles, lines) in ${secondaryColor} and white, 30% opacity.
Center: circular or rounded placeholder for person photo (abstract gradient or silhouette shape).
Decorative elements: abstract geometric shapes around the photo zone (like Memphis design but refined).
Bottom bar: solid ${primaryColor} stripe with name "${personName || 'Expert Name'}" and title "${personTitle || 'Title'}" in white.
${headline ? `Top: "${headline}" as context headline.` : ''}
Style: Creative agency, design conference, modern editorial.`;
    },
    negativePrompt: 'realistic photo, stock photo, corporate, boring, 3D render, cluttered'
  },

  // ---------------------------------------------------------------------------
  // 6. PRODUCT - Screenshot/mockup feature (ChatGPT, Apple style)
  // ---------------------------------------------------------------------------
  {
    id: 'product',
    name: 'Product / Feature',
    nameFr: 'Produit',
    description: 'Showcase a product or feature with screenshot',
    descriptionFr: 'Mettre en avant un produit ou une fonctionnalité',
    icon: '✨',
    keywords: ['produit', 'feature', 'fonctionnalité', 'nouveau', 'découvrez', 'interface', 'app', 'outil', 'solution'],
    structure: `
┌────────────────────┐
│ [Logo]             │
│                    │
│  Headline produit  │
│                    │
│  ┌──────────────┐  │
│  │  Screenshot  │  │
│  └──────────────┘  │
└────────────────────┘`,
    fields: { headline: true, subheadline: true },
    buildPrompt: ({ brandName, primaryColor, secondaryColor, headline, subheadline }) => {
      return `Social media product showcase for ${brandName}.
Background: clean white or very light gray, minimal.
Top left: brand logo.
Center-top: product headline "${headline || 'Product Feature'}" in large bold black text.
Below headline: subtext "${subheadline || 'description'}" in gray.
Center-bottom: rounded rectangle mockup frame (like a floating app window or phone screen), with soft shadow.
Inside mockup: abstract UI elements suggesting an interface (colored blocks, lines, shapes representing content).
The mockup uses ${primaryColor} as accent color.
Style: Apple, Linear, Notion - clean product marketing.`;
    },
    negativePrompt: 'realistic photo, people, hands, 3D render, complex scene, busy, cluttered, dark'
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all templates
 */
export function getAllTemplates(): Template[] {
  return TEMPLATES;
}

/**
 * Get a template by ID
 */
export function getTemplate(id: TemplateId): Template | undefined {
  return TEMPLATES.find(t => t.id === id);
}

/**
 * Auto-detect best template based on brief text
 */
export function detectTemplate(brief: string): Template {
  const lowerBrief = brief.toLowerCase();
  
  let bestMatch: Template = TEMPLATES[1]; // Default to announcement
  let bestScore = 0;
  
  for (const template of TEMPLATES) {
    let score = 0;
    for (const keyword of template.keywords) {
      if (lowerBrief.includes(keyword.toLowerCase())) {
        score += 1;
        // Bonus for exact word match
        if (new RegExp(`\\b${keyword}\\b`, 'i').test(lowerBrief)) {
          score += 0.5;
        }
      }
    }
    // Check for numbers/percentages for stat template
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

/**
 * Extract metric from brief (for stat template)
 */
export function extractMetric(brief: string): { metric: string; label: string } | null {
  // Match patterns like "87%", "1.7M", "182,646", "+45%"
  const metricMatch = brief.match(/([+-]?\d+[.,]?\d*\s*[%KMB]?|\d{1,3}(?:[,.\s]\d{3})+)/i);
  
  if (metricMatch) {
    const metric = metricMatch[1].trim();
    // Try to find context around the metric
    const labelMatch = brief.match(new RegExp(`${metric.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:de\\s+)?([\\w\\s]+)`, 'i'));
    const label = labelMatch ? labelMatch[1].trim().slice(0, 30) : '';
    
    return { metric, label };
  }
  
  return null;
}

/**
 * Generate 3 template suggestions for a brand
 */
export function suggestTemplates(brandData: {
  name: string;
  industry?: string;
  toneVoice?: string[];
}): { templateId: TemplateId; suggestedHeadline: string; suggestedContent: string }[] {
  // Always suggest these 3 versatile templates with brand-specific content
  return [
    {
      templateId: 'stat',
      suggestedHeadline: '',
      suggestedContent: `Chiffre clé: ex. "+47% de croissance" ou "10 000 clients"`
    },
    {
      templateId: 'announcement',
      suggestedHeadline: `${brandData.name} présente...`,
      suggestedContent: 'Annonce, lancement, partenariat'
    },
    {
      templateId: 'quote',
      suggestedHeadline: '',
      suggestedContent: 'Témoignage client ou citation inspirante'
    }
  ];
}

// ============================================================================
// PROMPT BUILDER - Main function to call
// ============================================================================

export interface BuildPromptResult {
  prompt: string;
  negativePrompt: string;
  templateUsed: TemplateId;
}

/**
 * Build the final Fal prompt from template + params
 */
export function buildTemplatePrompt(
  templateId: TemplateId,
  params: TemplateParams
): BuildPromptResult {
  const template = getTemplate(templateId);
  
  if (!template) {
    // Fallback to announcement
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

