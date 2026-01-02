// SEO Comparison Pages Data
// Each comparison targets a specific competitor/alternative

export type ComparisonData = {
  slug: string;
  competitor: string;
  meta: {
    fr: { title: string; description: string };
    en: { title: string; description: string };
  };
  hero: {
    fr: { headline: string; subheadline: string };
    en: { headline: string; subheadline: string };
  };
  painPoints: {
    fr: { title: string; items: { icon: string; title: string; description: string }[] };
    en: { title: string; items: { icon: string; title: string; description: string }[] };
  };
  comparison: {
    fr: {
      paletteTitle: string;
      competitorTitle: string;
      rows: { feature: string; palette: string; competitor: string; paletteWins: boolean }[];
    };
    en: {
      paletteTitle: string;
      competitorTitle: string;
      rows: { feature: string; palette: string; competitor: string; paletteWins: boolean }[];
    };
  };
  cta: {
    fr: { headline: string; subheadline: string; button: string };
    en: { headline: string; subheadline: string; button: string };
  };
  faq: {
    fr: { question: string; answer: string }[];
    en: { question: string; answer: string }[];
  };
};

export const comparisons: Record<string, ComparisonData> = {
  canva: {
    slug: 'canva',
    competitor: 'Canva',
    meta: {
      fr: {
        title: 'Palette vs Canva : Quelle alternative pour vos visuels de marque ?',
        description: 'Comparez Palette et Canva. Découvrez pourquoi Palette génère des visuels 100% à votre image en 60 secondes, sans templates génériques.',
      },
      en: {
        title: 'Palette vs Canva: Which tool for your brand visuals?',
        description: 'Compare Palette and Canva. Discover why Palette generates 100% on-brand visuals in 60 seconds, without generic templates.',
      },
    },
    hero: {
      fr: {
        headline: 'Palette vs Canva',
        subheadline: 'Arrêtez de ressembler à tout le monde. Créez des visuels uniques, 100% votre marque.',
      },
      en: {
        headline: 'Palette vs Canva',
        subheadline: 'Stop looking like everyone else. Create unique visuals, 100% your brand.',
      },
    },
    painPoints: {
      fr: {
        title: 'Le problème avec Canva',
        items: [
          {
            icon: '🎭',
            title: 'Templates génériques',
            description: 'Tout le monde utilise les mêmes templates. Vos visuels ressemblent à ceux de vos concurrents.',
          },
          {
            icon: '⏰',
            title: 'Temps de personnalisation',
            description: 'Adapter un template à votre marque prend 30 minutes à 1 heure. À chaque visuel.',
          },
          {
            icon: '🎨',
            title: 'Incohérence de marque',
            description: 'Difficile de maintenir une identité visuelle cohérente entre tous vos visuels.',
          },
        ],
      },
      en: {
        title: 'The problem with Canva',
        items: [
          {
            icon: '🎭',
            title: 'Generic templates',
            description: 'Everyone uses the same templates. Your visuals look like your competitors\' ones.',
          },
          {
            icon: '⏰',
            title: 'Customization time',
            description: 'Adapting a template to your brand takes 30 minutes to 1 hour. Every single visual.',
          },
          {
            icon: '🎨',
            title: 'Brand inconsistency',
            description: 'Hard to maintain a consistent visual identity across all your visuals.',
          },
        ],
      },
    },
    comparison: {
      fr: {
        paletteTitle: 'Palette',
        competitorTitle: 'Canva',
        rows: [
          { feature: 'Temps par visuel', palette: '60 secondes', competitor: '30-60 minutes', paletteWins: true },
          { feature: 'Cohérence de marque', palette: '100% automatique', competitor: 'Manuelle', paletteWins: true },
          { feature: 'Unicité', palette: 'Visuels uniques IA', competitor: 'Templates partagés', paletteWins: true },
          { feature: 'Courbe d\'apprentissage', palette: 'Aucune', competitor: 'Moyenne', paletteWins: true },
          { feature: 'Mode Autopilot', palette: '1 visuel/jour auto', competitor: 'Non disponible', paletteWins: true },
          { feature: 'Prix', palette: '19€/mois', competitor: '12€/mois', paletteWins: false },
        ],
      },
      en: {
        paletteTitle: 'Palette',
        competitorTitle: 'Canva',
        rows: [
          { feature: 'Time per visual', palette: '60 seconds', competitor: '30-60 minutes', paletteWins: true },
          { feature: 'Brand consistency', palette: '100% automatic', competitor: 'Manual', paletteWins: true },
          { feature: 'Uniqueness', palette: 'Unique AI visuals', competitor: 'Shared templates', paletteWins: true },
          { feature: 'Learning curve', palette: 'None', competitor: 'Medium', paletteWins: true },
          { feature: 'Autopilot mode', palette: '1 visual/day auto', competitor: 'Not available', paletteWins: true },
          { feature: 'Price', palette: '$19/month', competitor: '$12/month', paletteWins: false },
        ],
      },
    },
    cta: {
      fr: {
        headline: 'Prêt à créer des visuels uniques ?',
        subheadline: 'Essayez Palette gratuitement. Premier visuel offert.',
        button: 'Créer mon premier visuel',
      },
      en: {
        headline: 'Ready to create unique visuals?',
        subheadline: 'Try Palette for free. First visual on us.',
        button: 'Create my first visual',
      },
    },
    faq: {
      fr: [
        {
          question: 'Palette peut-il remplacer Canva ?',
          answer: 'Palette et Canva servent des besoins différents. Si vous cherchez des templates pour des projets ponctuels, Canva convient. Si vous voulez des visuels uniques, cohérents avec votre marque, générés en 60 secondes — Palette est fait pour vous.',
        },
        {
          question: 'Dois-je avoir des compétences en design ?',
          answer: 'Non. Palette génère automatiquement des visuels à partir de votre identité de marque. Vous n\'avez qu\'à décrire ce que vous voulez en quelques mots.',
        },
        {
          question: 'Comment Palette assure-t-il la cohérence de marque ?',
          answer: 'Palette analyse votre site web pour extraire vos couleurs, typographies, ton et style. Chaque visuel généré respecte automatiquement ces éléments.',
        },
      ],
      en: [
        {
          question: 'Can Palette replace Canva?',
          answer: 'Palette and Canva serve different needs. If you\'re looking for templates for one-off projects, Canva works. If you want unique visuals, consistent with your brand, generated in 60 seconds — Palette is for you.',
        },
        {
          question: 'Do I need design skills?',
          answer: 'No. Palette automatically generates visuals from your brand identity. You just need to describe what you want in a few words.',
        },
        {
          question: 'How does Palette ensure brand consistency?',
          answer: 'Palette analyzes your website to extract your colors, typography, tone, and style. Every generated visual automatically respects these elements.',
        },
      ],
    },
  },

  agence: {
    slug: 'agence',
    competitor: 'Agence',
    meta: {
      fr: {
        title: 'Palette vs Agence créative : Créez vos visuels en 60s au lieu de 3 semaines',
        description: 'Pourquoi attendre 3 semaines et payer 3000€ pour des visuels ? Palette génère des créations pro en 60 secondes pour 19€/mois.',
      },
      en: {
        title: 'Palette vs Creative Agency: Create visuals in 60s instead of 3 weeks',
        description: 'Why wait 3 weeks and pay $3000 for visuals? Palette generates pro creations in 60 seconds for $19/month.',
      },
    },
    hero: {
      fr: {
        headline: 'Palette vs Agence créative',
        subheadline: '3 semaines et 3000€ pour un post LinkedIn ? Il y a mieux.',
      },
      en: {
        headline: 'Palette vs Creative Agency',
        subheadline: '3 weeks and $3000 for a LinkedIn post? There\'s a better way.',
      },
    },
    painPoints: {
      fr: {
        title: 'Le problème avec les agences',
        items: [
          {
            icon: '📅',
            title: 'Délais interminables',
            description: 'Brief, devis, allers-retours, validations... Comptez 2-3 semaines minimum pour un visuel.',
          },
          {
            icon: '💸',
            title: 'Budget conséquent',
            description: '2000€ à 5000€ par campagne. Des "jours/homme" pour des réunions de cadrage.',
          },
          {
            icon: '🔄',
            title: 'Dépendance totale',
            description: 'Besoin d\'un visuel urgent ? Il faut attendre que l\'agence soit disponible.',
          },
        ],
      },
      en: {
        title: 'The problem with agencies',
        items: [
          {
            icon: '📅',
            title: 'Endless delays',
            description: 'Brief, quote, back-and-forth, approvals... Count 2-3 weeks minimum for one visual.',
          },
          {
            icon: '💸',
            title: 'Significant budget',
            description: '$2000 to $5000 per campaign. "Man-days" for kickoff meetings.',
          },
          {
            icon: '🔄',
            title: 'Total dependency',
            description: 'Need an urgent visual? You have to wait until the agency is available.',
          },
        ],
      },
    },
    comparison: {
      fr: {
        paletteTitle: 'Palette',
        competitorTitle: 'Agence créative',
        rows: [
          { feature: 'Délai de livraison', palette: '60 secondes', competitor: '2-3 semaines', paletteWins: true },
          { feature: 'Coût mensuel', palette: '19€/mois (50 visuels)', competitor: '2000-5000€/campagne', paletteWins: true },
          { feature: 'Disponibilité', palette: '24/7', competitor: 'Heures ouvrées', paletteWins: true },
          { feature: 'Modifications', palette: 'Illimitées, instantanées', competitor: 'Facturées, 48h+', paletteWins: true },
          { feature: 'Cohérence de marque', palette: 'Automatique', competitor: 'Manuel (brief requis)', paletteWins: true },
          { feature: 'Direction artistique', palette: 'IA guidée par votre marque', competitor: 'Humaine, experte', paletteWins: false },
        ],
      },
      en: {
        paletteTitle: 'Palette',
        competitorTitle: 'Creative Agency',
        rows: [
          { feature: 'Delivery time', palette: '60 seconds', competitor: '2-3 weeks', paletteWins: true },
          { feature: 'Monthly cost', palette: '$19/mo (50 visuals)', competitor: '$2000-5000/campaign', paletteWins: true },
          { feature: 'Availability', palette: '24/7', competitor: 'Business hours', paletteWins: true },
          { feature: 'Revisions', palette: 'Unlimited, instant', competitor: 'Billed, 48h+', paletteWins: true },
          { feature: 'Brand consistency', palette: 'Automatic', competitor: 'Manual (brief required)', paletteWins: true },
          { feature: 'Art direction', palette: 'AI guided by your brand', competitor: 'Human, expert', paletteWins: false },
        ],
      },
    },
    cta: {
      fr: {
        headline: 'Libérez-vous des agences',
        subheadline: 'Créez vos visuels en toute autonomie. Premier visuel offert.',
        button: 'Essayer gratuitement',
      },
      en: {
        headline: 'Free yourself from agencies',
        subheadline: 'Create your visuals independently. First visual on us.',
        button: 'Try for free',
      },
    },
    faq: {
      fr: [
        {
          question: 'La qualité est-elle comparable à une agence ?',
          answer: 'Palette génère des visuels professionnels en utilisant l\'IA et votre identité de marque. Pour du contenu social media récurrent, la qualité est comparable — pour une fraction du coût et du temps.',
        },
        {
          question: 'Dois-je quand même faire des briefs ?',
          answer: 'Non. Palette analyse votre marque une seule fois. Ensuite, décrivez simplement ce que vous voulez en langage naturel : "Un post LinkedIn pour notre Black Friday".',
        },
        {
          question: 'Que faire si j\'ai besoin d\'une direction artistique complexe ?',
          answer: 'Pour des projets nécessitant une direction artistique poussée (rebranding, campagne TV...), une agence reste pertinente. Palette excelle pour le contenu récurrent : social media, newsletters, ads.',
        },
      ],
      en: [
        {
          question: 'Is the quality comparable to an agency?',
          answer: 'Palette generates professional visuals using AI and your brand identity. For recurring social media content, quality is comparable — for a fraction of the cost and time.',
        },
        {
          question: 'Do I still need to write briefs?',
          answer: 'No. Palette analyzes your brand once. Then, simply describe what you want in plain language: "A LinkedIn post for our Black Friday sale".',
        },
        {
          question: 'What if I need complex art direction?',
          answer: 'For projects requiring advanced art direction (rebranding, TV campaign...), an agency is still relevant. Palette excels at recurring content: social media, newsletters, ads.',
        },
      ],
    },
  },
};

export function getComparison(slug: string): ComparisonData | undefined {
  return comparisons[slug];
}

export function getAllComparisonSlugs(): string[] {
  return Object.keys(comparisons);
}
