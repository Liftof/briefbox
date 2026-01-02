// SEO Target Audience Pages Data
// Each target page addresses a specific persona/audience

export type TargetData = {
  slug: string;
  persona: string;
  meta: {
    fr: { title: string; description: string };
    en: { title: string; description: string };
  };
  hero: {
    fr: { headline: string; subheadline: string };
    en: { headline: string; subheadline: string };
  };
  problems: {
    fr: { title: string; items: { icon: string; title: string; description: string }[] };
    en: { title: string; items: { icon: string; title: string; description: string }[] };
  };
  solution: {
    fr: { title: string; items: { icon: string; title: string; description: string }[] };
    en: { title: string; items: { icon: string; title: string; description: string }[] };
  };
  testimonial: {
    fr: { quote: string; author: string; role: string };
    en: { quote: string; author: string; role: string };
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

export const targets: Record<string, TargetData> = {
  solopreneurs: {
    slug: 'solopreneurs',
    persona: 'Solopreneurs',
    meta: {
      fr: {
        title: 'Palette pour Solopreneurs : Visuels pro sans graphiste',
        description: 'Solopreneur, créez des visuels professionnels en 60 secondes. Sans compétences design, sans budget agence. Votre marque, votre style.',
      },
      en: {
        title: 'Palette for Solopreneurs: Pro visuals without a designer',
        description: 'Solopreneur, create professional visuals in 60 seconds. No design skills, no agency budget. Your brand, your style.',
      },
    },
    hero: {
      fr: {
        headline: 'Solopreneur ? Créez des visuels pro en 60 secondes',
        subheadline: 'Vous gérez tout seul. Marketing, ventes, produit. Palette gère vos visuels.',
      },
      en: {
        headline: 'Solopreneur? Create pro visuals in 60 seconds',
        subheadline: 'You handle everything alone. Marketing, sales, product. Palette handles your visuals.',
      },
    },
    problems: {
      fr: {
        title: 'On connaît vos galères',
        items: [
          {
            icon: '⏰',
            title: 'Pas le temps',
            description: 'Entre les clients, la compta et le produit, créer des visuels passe toujours en dernier.',
          },
          {
            icon: '💸',
            title: 'Budget serré',
            description: 'Payer 500€ pour un pack de visuels quand on démarre ? Impossible.',
          },
          {
            icon: '🎨',
            title: 'Pas graphiste',
            description: 'Vos visuels Canva ressemblent à ceux de tout le monde. Difficile de se démarquer.',
          },
        ],
      },
      en: {
        title: 'We know your struggles',
        items: [
          {
            icon: '⏰',
            title: 'No time',
            description: 'Between clients, accounting, and product, creating visuals always comes last.',
          },
          {
            icon: '💸',
            title: 'Tight budget',
            description: 'Paying $500 for a visual pack when starting out? Impossible.',
          },
          {
            icon: '🎨',
            title: 'Not a designer',
            description: 'Your Canva visuals look like everyone else\'s. Hard to stand out.',
          },
        ],
      },
    },
    solution: {
      fr: {
        title: 'Palette, votre directeur artistique IA',
        items: [
          {
            icon: '🚀',
            title: '60 secondes par visuel',
            description: 'Décrivez ce que vous voulez en 2 phrases. Palette génère un visuel unique, à votre image.',
          },
          {
            icon: '🎯',
            title: '100% votre marque',
            description: 'Palette analyse votre site et respecte vos couleurs, typos et ton. Cohérence garantie.',
          },
          {
            icon: '🤖',
            title: 'Mode Autopilote',
            description: '50 bots scannent votre marché. Chaque matin, un visuel prêt à publier vous attend.',
          },
        ],
      },
      en: {
        title: 'Palette, your AI art director',
        items: [
          {
            icon: '🚀',
            title: '60 seconds per visual',
            description: 'Describe what you want in 2 sentences. Palette generates a unique visual, matching your brand.',
          },
          {
            icon: '🎯',
            title: '100% your brand',
            description: 'Palette analyzes your site and respects your colors, fonts, and tone. Consistency guaranteed.',
          },
          {
            icon: '🤖',
            title: 'Autopilot mode',
            description: '50 bots scan your market. Every morning, a ready-to-publish visual awaits.',
          },
        ],
      },
    },
    testimonial: {
      fr: {
        quote: 'Je passais 2h par semaine sur mes visuels LinkedIn. Maintenant, c\'est 5 minutes. Et ils sont meilleurs.',
        author: 'Marie L.',
        role: 'Coach indépendante',
      },
      en: {
        quote: 'I used to spend 2 hours a week on my LinkedIn visuals. Now it\'s 5 minutes. And they\'re better.',
        author: 'Marie L.',
        role: 'Independent coach',
      },
    },
    cta: {
      fr: {
        headline: 'Concentrez-vous sur votre business',
        subheadline: 'Palette gère vos visuels. Premier visuel offert.',
        button: 'Créer mon premier visuel',
      },
      en: {
        headline: 'Focus on your business',
        subheadline: 'Palette handles your visuals. First visual free.',
        button: 'Create my first visual',
      },
    },
    faq: {
      fr: [
        {
          question: 'Faut-il des compétences en design ?',
          answer: 'Absolument pas. Palette génère automatiquement des visuels à partir de votre identité de marque. Vous n\'avez qu\'à décrire ce que vous voulez.',
        },
        {
          question: 'Combien coûte Palette ?',
          answer: '19€/mois pour 50 visuels. Moins qu\'un café par jour pour des visuels pro illimités.',
        },
        {
          question: 'C\'est adapté si je n\'ai pas de charte graphique ?',
          answer: 'Oui ! Palette analyse votre site web ou vos réseaux pour extraire votre style. Si vous partez de zéro, l\'IA vous propose un style cohérent.',
        },
      ],
      en: [
        {
          question: 'Do I need design skills?',
          answer: 'Absolutely not. Palette automatically generates visuals from your brand identity. You just describe what you want.',
        },
        {
          question: 'How much does Palette cost?',
          answer: '$19/month for 50 visuals. Less than a coffee a day for unlimited pro visuals.',
        },
        {
          question: 'Does it work if I don\'t have brand guidelines?',
          answer: 'Yes! Palette analyzes your website or social media to extract your style. If you\'re starting from scratch, the AI suggests a consistent style.',
        },
      ],
    },
  },

  marketers: {
    slug: 'marketers',
    persona: 'Marketers',
    meta: {
      fr: {
        title: 'Palette pour Marketers : Scalez votre production de contenu',
        description: 'Marketers, produisez 10x plus de visuels sans 10x plus de budget. Cohérence de marque automatique, variations A/B en un clic.',
      },
      en: {
        title: 'Palette for Marketers: Scale your content production',
        description: 'Marketers, produce 10x more visuals without 10x more budget. Automatic brand consistency, A/B variations in one click.',
      },
    },
    hero: {
      fr: {
        headline: 'Marketers, scalez vos visuels sans perdre en qualité',
        subheadline: 'Plus de contenu, plus de tests, plus de résultats. Sans exploser votre budget créa.',
      },
      en: {
        headline: 'Marketers, scale your visuals without losing quality',
        subheadline: 'More content, more tests, more results. Without blowing your creative budget.',
      },
    },
    problems: {
      fr: {
        title: 'Le quotidien du marketer moderne',
        items: [
          {
            icon: '📊',
            title: 'Pression du volume',
            description: 'LinkedIn, ads, newsletters, blog... Le contenu est roi mais votre équipe créa ne suit pas.',
          },
          {
            icon: '🔄',
            title: 'Allers-retours sans fin',
            description: 'Brief, V1, corrections, V2, re-corrections... Chaque visuel prend 3 jours.',
          },
          {
            icon: '🎯',
            title: 'Tests limités',
            description: 'Vous aimeriez A/B tester 5 visuels par campagne. En réalité, vous en testez 2.',
          },
        ],
      },
      en: {
        title: 'The modern marketer\'s daily life',
        items: [
          {
            icon: '📊',
            title: 'Volume pressure',
            description: 'LinkedIn, ads, newsletters, blog... Content is king but your creative team can\'t keep up.',
          },
          {
            icon: '🔄',
            title: 'Endless back-and-forth',
            description: 'Brief, V1, corrections, V2, more corrections... Each visual takes 3 days.',
          },
          {
            icon: '🎯',
            title: 'Limited testing',
            description: 'You\'d like to A/B test 5 visuals per campaign. In reality, you test 2.',
          },
        ],
      },
    },
    solution: {
      fr: {
        title: 'Palette, votre machine à créer du contenu',
        items: [
          {
            icon: '⚡',
            title: 'Production en masse',
            description: '50 visuels/mois inclus. Déclinaisons, formats, langues. Tout en quelques clics.',
          },
          {
            icon: '🧪',
            title: 'Tests illimités',
            description: 'Générez 5 variations en 5 minutes. Testez, itérez, optimisez sans limite.',
          },
          {
            icon: '✅',
            title: 'Cohérence garantie',
            description: 'Chaque visuel respecte automatiquement votre charte. Fini les débats avec le brand manager.',
          },
        ],
      },
      en: {
        title: 'Palette, your content creation machine',
        items: [
          {
            icon: '⚡',
            title: 'Mass production',
            description: '50 visuals/month included. Variations, formats, languages. All in a few clicks.',
          },
          {
            icon: '🧪',
            title: 'Unlimited testing',
            description: 'Generate 5 variations in 5 minutes. Test, iterate, optimize without limits.',
          },
          {
            icon: '✅',
            title: 'Guaranteed consistency',
            description: 'Every visual automatically respects your guidelines. No more debates with the brand manager.',
          },
        ],
      },
    },
    testimonial: {
      fr: {
        quote: 'On a triplé notre production de contenu LinkedIn sans embaucher. Nos ads performent 40% mieux grâce aux tests.',
        author: 'Thomas R.',
        role: 'Head of Marketing, SaaS B2B',
      },
      en: {
        quote: 'We tripled our LinkedIn content production without hiring. Our ads perform 40% better thanks to testing.',
        author: 'Thomas R.',
        role: 'Head of Marketing, B2B SaaS',
      },
    },
    cta: {
      fr: {
        headline: 'Scalez votre marketing visuel',
        subheadline: 'Premier visuel gratuit. Setup en 2 minutes.',
        button: 'Commencer maintenant',
      },
      en: {
        headline: 'Scale your visual marketing',
        subheadline: 'First visual free. 2-minute setup.',
        button: 'Start now',
      },
    },
    faq: {
      fr: [
        {
          question: 'Comment Palette gère-t-il notre charte graphique ?',
          answer: 'Palette analyse votre site web ou votre charte PDF pour extraire couleurs, typos, style et ton. Chaque visuel généré est automatiquement conforme.',
        },
        {
          question: 'Peut-on avoir plusieurs marques/produits ?',
          answer: 'Oui. Chaque marque a son profil distinct. Passez de l\'une à l\'autre en un clic.',
        },
        {
          question: 'Comment ça marche pour les déclinaisons multilingues ?',
          answer: 'Générez un visuel en français, puis traduisez-le en anglais, espagnol ou allemand en 20 secondes. Même style, autre langue.',
        },
      ],
      en: [
        {
          question: 'How does Palette handle our brand guidelines?',
          answer: 'Palette analyzes your website or PDF guidelines to extract colors, fonts, style, and tone. Every generated visual is automatically compliant.',
        },
        {
          question: 'Can we have multiple brands/products?',
          answer: 'Yes. Each brand has its own distinct profile. Switch between them in one click.',
        },
        {
          question: 'How do multilingual variations work?',
          answer: 'Generate a visual in English, then translate it to French, Spanish, or German in 20 seconds. Same style, different language.',
        },
      ],
    },
  },

  founders: {
    slug: 'founders',
    persona: 'Founders',
    meta: {
      fr: {
        title: 'Palette pour Founders : Visuels pro dès le jour 1',
        description: 'Founders, ayez l\'air pro dès le lancement. Visuels de qualité agence en 60 secondes, pour 19€/mois.',
      },
      en: {
        title: 'Palette for Founders: Pro visuals from day 1',
        description: 'Founders, look professional from launch. Agency-quality visuals in 60 seconds, for $19/month.',
      },
    },
    hero: {
      fr: {
        headline: 'Founders, ayez l\'air d\'une licorne dès le jour 1',
        subheadline: 'Votre produit est incroyable. Vos visuels doivent l\'être aussi.',
      },
      en: {
        headline: 'Founders, look like a unicorn from day 1',
        subheadline: 'Your product is amazing. Your visuals should be too.',
      },
    },
    problems: {
      fr: {
        title: 'Les galères du fondateur early-stage',
        items: [
          {
            icon: '💰',
            title: 'Chaque euro compte',
            description: '5000€ pour une identité visuelle ? Quand on bootstrape, c\'est 3 mois de runway.',
          },
          {
            icon: '🎭',
            title: 'Perception = Réalité',
            description: 'Les investisseurs et clients jugent sur l\'apparence. Des visuels amateurs = startup amateure.',
          },
          {
            icon: '⚡',
            title: 'Besoin de vitesse',
            description: 'Lancement dans 2 semaines, Product Hunt la semaine prochaine. Pas le temps d\'attendre une agence.',
          },
        ],
      },
      en: {
        title: 'Early-stage founder struggles',
        items: [
          {
            icon: '💰',
            title: 'Every dollar counts',
            description: '$5000 for visual identity? When bootstrapping, that\'s 3 months of runway.',
          },
          {
            icon: '🎭',
            title: 'Perception = Reality',
            description: 'Investors and customers judge on appearance. Amateur visuals = amateur startup.',
          },
          {
            icon: '⚡',
            title: 'Need for speed',
            description: 'Launch in 2 weeks, Product Hunt next week. No time to wait for an agency.',
          },
        ],
      },
    },
    solution: {
      fr: {
        title: 'Palette, le DA des startups ambitieuses',
        items: [
          {
            icon: '🚀',
            title: 'Pro dès le jour 1',
            description: 'Visuels de qualité agence instantanément. Impressionnez investisseurs et premiers clients.',
          },
          {
            icon: '💸',
            title: '19€ au lieu de 5000€',
            description: 'Le prix d\'un abonnement Notion pour une identité visuelle complète et cohérente.',
          },
          {
            icon: '🔄',
            title: 'Pivotez sans limite',
            description: 'Nouveau positionnement ? Nouvelle cible ? Régénérez tous vos visuels en une heure.',
          },
        ],
      },
      en: {
        title: 'Palette, the AD for ambitious startups',
        items: [
          {
            icon: '🚀',
            title: 'Pro from day 1',
            description: 'Agency-quality visuals instantly. Impress investors and first customers.',
          },
          {
            icon: '💸',
            title: '$19 instead of $5000',
            description: 'The price of a Notion subscription for a complete, consistent visual identity.',
          },
          {
            icon: '🔄',
            title: 'Pivot without limits',
            description: 'New positioning? New target? Regenerate all your visuals in one hour.',
          },
        ],
      },
    },
    testimonial: {
      fr: {
        quote: 'On a levé notre seed avec un deck créé en 2 jours grâce à Palette. Les VCs pensaient qu\'on avait une équipe design.',
        author: 'Alex M.',
        role: 'CEO, Startup FinTech',
      },
      en: {
        quote: 'We raised our seed with a deck created in 2 days thanks to Palette. VCs thought we had a design team.',
        author: 'Alex M.',
        role: 'CEO, FinTech Startup',
      },
    },
    cta: {
      fr: {
        headline: 'Lancez avec l\'image d\'une licorne',
        subheadline: 'Premier visuel offert. Aucune carte requise.',
        button: 'Créer mon premier visuel',
      },
      en: {
        headline: 'Launch with unicorn-level branding',
        subheadline: 'First visual free. No card required.',
        button: 'Create my first visual',
      },
    },
    faq: {
      fr: [
        {
          question: 'Palette convient-il pour un pitch deck ?',
          answer: 'Absolument. Beaucoup de founders utilisent Palette pour créer des visuels de pitch deck cohérents et professionnels en quelques heures.',
        },
        {
          question: 'Et si on pivote ou change de branding ?',
          answer: 'Mettez à jour votre profil de marque et régénérez vos visuels. Palette s\'adapte instantanément à votre nouvelle direction.',
        },
        {
          question: 'C\'est vraiment 60 secondes par visuel ?',
          answer: 'Oui, une fois votre marque analysée (5 minutes au setup). Décrivez votre besoin, obtenez un visuel pro en moins d\'une minute.',
        },
      ],
      en: [
        {
          question: 'Is Palette suitable for pitch decks?',
          answer: 'Absolutely. Many founders use Palette to create consistent, professional pitch deck visuals in just a few hours.',
        },
        {
          question: 'What if we pivot or rebrand?',
          answer: 'Update your brand profile and regenerate your visuals. Palette instantly adapts to your new direction.',
        },
        {
          question: 'Is it really 60 seconds per visual?',
          answer: 'Yes, once your brand is analyzed (5-minute setup). Describe your need, get a pro visual in under a minute.',
        },
      ],
    },
  },

  'equipes-produit': {
    slug: 'equipes-produit',
    persona: 'Product Teams',
    meta: {
      fr: {
        title: 'Palette pour Équipes Produit : Mockups et visuels en self-service',
        description: 'Équipes produit, créez vos mockups et visuels de feature sans attendre l\'équipe design. Cohérence de marque garantie.',
      },
      en: {
        title: 'Palette for Product Teams: Self-service mockups and visuals',
        description: 'Product teams, create your mockups and feature visuals without waiting for design. Brand consistency guaranteed.',
      },
    },
    hero: {
      fr: {
        headline: 'Équipes Produit, libérez-vous de la file d\'attente design',
        subheadline: 'Créez vos visuels de feature en self-service. Sans compromettre la marque.',
      },
      en: {
        headline: 'Product Teams, free yourself from the design queue',
        subheadline: 'Create your feature visuals self-service. Without compromising the brand.',
      },
    },
    problems: {
      fr: {
        title: 'Le bottleneck design',
        items: [
          {
            icon: '⏳',
            title: 'File d\'attente',
            description: 'L\'équipe design est débordée. Votre visuel de feature ? Dans 2 sprints.',
          },
          {
            icon: '📝',
            title: 'Briefs interminables',
            description: 'Rédiger un brief détaillé pour un simple visuel d\'annonce. Temps perdu.',
          },
          {
            icon: '🎨',
            title: 'Cohérence risquée',
            description: 'Faire soi-même = risquer un visuel off-brand. Attendre = retarder le lancement.',
          },
        ],
      },
      en: {
        title: 'The design bottleneck',
        items: [
          {
            icon: '⏳',
            title: 'Queue',
            description: 'The design team is overwhelmed. Your feature visual? In 2 sprints.',
          },
          {
            icon: '📝',
            title: 'Endless briefs',
            description: 'Writing a detailed brief for a simple announcement visual. Time wasted.',
          },
          {
            icon: '🎨',
            title: 'Risky consistency',
            description: 'DIY = risking an off-brand visual. Waiting = delaying the launch.',
          },
        ],
      },
    },
    solution: {
      fr: {
        title: 'Palette, le design en self-service',
        items: [
          {
            icon: '🔓',
            title: 'Autonomie totale',
            description: 'Créez vos visuels de release notes, annonces produit, docs en 60 secondes.',
          },
          {
            icon: '✅',
            title: 'Toujours on-brand',
            description: 'Palette respecte automatiquement votre design system. Impossible de faire du off-brand.',
          },
          {
            icon: '🤝',
            title: 'Design libéré',
            description: 'L\'équipe design peut se concentrer sur les vrais challenges UX/UI.',
          },
        ],
      },
      en: {
        title: 'Palette, self-service design',
        items: [
          {
            icon: '🔓',
            title: 'Total autonomy',
            description: 'Create your release notes, product announcements, docs visuals in 60 seconds.',
          },
          {
            icon: '✅',
            title: 'Always on-brand',
            description: 'Palette automatically respects your design system. Impossible to go off-brand.',
          },
          {
            icon: '🤝',
            title: 'Design freed up',
            description: 'The design team can focus on real UX/UI challenges.',
          },
        ],
      },
    },
    testimonial: {
      fr: {
        quote: 'On a réduit de 80% les demandes de \"petits visuels\" à l\'équipe design. Tout le monde est content.',
        author: 'Julie P.',
        role: 'Product Manager, Scale-up',
      },
      en: {
        quote: 'We reduced \"small visual\" requests to the design team by 80%. Everyone\'s happy.',
        author: 'Julie P.',
        role: 'Product Manager, Scale-up',
      },
    },
    cta: {
      fr: {
        headline: 'Débloquez votre équipe produit',
        subheadline: 'Visuels self-service, cohérence garantie.',
        button: 'Essayer gratuitement',
      },
      en: {
        headline: 'Unblock your product team',
        subheadline: 'Self-service visuals, guaranteed consistency.',
        button: 'Try for free',
      },
    },
    faq: {
      fr: [
        {
          question: 'Comment garantir la cohérence avec notre design system ?',
          answer: 'Palette analyse votre design system et l\'applique automatiquement. Couleurs, typos, espacements, ton — tout est respecté sans effort.',
        },
        {
          question: 'L\'équipe design garde-t-elle le contrôle ?',
          answer: 'Oui. L\'équipe design configure Palette une fois (profil de marque) et tout le monde peut ensuite créer des visuels conformes.',
        },
        {
          question: 'Quels types de visuels peut-on créer ?',
          answer: 'Release notes, annonces de features, visuels de documentation, posts LinkedIn produit, bannières d\'app... Tout ce dont une équipe produit a besoin.',
        },
      ],
      en: [
        {
          question: 'How do you guarantee consistency with our design system?',
          answer: 'Palette analyzes your design system and applies it automatically. Colors, fonts, spacing, tone — everything is respected effortlessly.',
        },
        {
          question: 'Does the design team keep control?',
          answer: 'Yes. The design team configures Palette once (brand profile) and everyone can then create compliant visuals.',
        },
        {
          question: 'What types of visuals can we create?',
          answer: 'Release notes, feature announcements, documentation visuals, product LinkedIn posts, app banners... Everything a product team needs.',
        },
      ],
    },
  },

  'community-managers': {
    slug: 'community-managers',
    persona: 'Community Managers',
    meta: {
      fr: {
        title: 'Palette pour Community Managers : 30 visuels/mois en autopilote',
        description: 'CM, remplissez votre calendrier éditorial automatiquement. 30 visuels brandés par mois, générés pendant que vous dormez.',
      },
      en: {
        title: 'Palette for Community Managers: 30 visuals/month on autopilot',
        description: 'CM, fill your editorial calendar automatically. 30 branded visuals per month, generated while you sleep.',
      },
    },
    hero: {
      fr: {
        headline: 'Community Managers, le calendrier éditorial qui se remplit tout seul',
        subheadline: 'Plus jamais la panne d\'inspiration. Plus jamais de visuels faits à la va-vite.',
      },
      en: {
        headline: 'Community Managers, the editorial calendar that fills itself',
        subheadline: 'Never run out of inspiration again. Never rush visuals again.',
      },
    },
    problems: {
      fr: {
        title: 'La vie de CM',
        items: [
          {
            icon: '📅',
            title: 'Calendrier vide',
            description: 'Lundi matin. 5 posts à préparer pour la semaine. 0 visuels prêts. Panique.',
          },
          {
            icon: '🔥',
            title: 'Réactivité impossible',
            description: 'Une actu tombe. Le temps de créer un visuel, c\'est déjà trop tard.',
          },
          {
            icon: '😫',
            title: 'Créativité épuisée',
            description: 'Après 3 ans de posts, les idées s\'épuisent. Les visuels se ressemblent tous.',
          },
        ],
      },
      en: {
        title: 'The CM life',
        items: [
          {
            icon: '📅',
            title: 'Empty calendar',
            description: 'Monday morning. 5 posts to prepare for the week. 0 visuals ready. Panic.',
          },
          {
            icon: '🔥',
            title: 'Impossible reactivity',
            description: 'News drops. By the time you create a visual, it\'s already too late.',
          },
          {
            icon: '😫',
            title: 'Exhausted creativity',
            description: 'After 3 years of posts, ideas run dry. All visuals look the same.',
          },
        ],
      },
    },
    solution: {
      fr: {
        title: 'Palette, votre assistant créatif 24/7',
        items: [
          {
            icon: '🤖',
            title: 'Mode Autopilote',
            description: '50 bots scannent votre secteur. Chaque matin, un visuel prêt à publier dans votre inbox.',
          },
          {
            icon: '⚡',
            title: 'Réaction en 60s',
            description: 'Actu chaude ? Décrivez le post en 2 phrases, visuel prêt en 1 minute.',
          },
          {
            icon: '🎨',
            title: 'Créativité infinie',
            description: 'L\'IA propose des angles et visuels auxquels vous n\'auriez pas pensé.',
          },
        ],
      },
      en: {
        title: 'Palette, your 24/7 creative assistant',
        items: [
          {
            icon: '🤖',
            title: 'Autopilot mode',
            description: '50 bots scan your industry. Every morning, a ready-to-publish visual in your inbox.',
          },
          {
            icon: '⚡',
            title: '60s reaction',
            description: 'Hot news? Describe the post in 2 sentences, visual ready in 1 minute.',
          },
          {
            icon: '🎨',
            title: 'Infinite creativity',
            description: 'AI suggests angles and visuals you wouldn\'t have thought of.',
          },
        ],
      },
    },
    testimonial: {
      fr: {
        quote: 'Mon calendrier est rempli 2 semaines à l\'avance. Je ne suis plus jamais à court d\'idées.',
        author: 'Léa S.',
        role: 'CM, Agence digitale',
      },
      en: {
        quote: 'My calendar is filled 2 weeks in advance. I never run out of ideas anymore.',
        author: 'Léa S.',
        role: 'CM, Digital agency',
      },
    },
    cta: {
      fr: {
        headline: 'Remplissez votre calendrier en dormant',
        subheadline: 'Activez l\'Autopilote. Visuels livrés chaque matin.',
        button: 'Activer l\'Autopilote',
      },
      en: {
        headline: 'Fill your calendar while you sleep',
        subheadline: 'Activate Autopilot. Visuals delivered every morning.',
        button: 'Activate Autopilot',
      },
    },
    faq: {
      fr: [
        {
          question: 'Comment fonctionne le mode Autopilote ?',
          answer: '50 bots scannent votre marché 24/7 (actus, tendances, concurrents). Ils génèrent des idées de posts pertinents et créent les visuels associés. Vous n\'avez qu\'à valider et publier.',
        },
        {
          question: 'Les visuels sont-ils vraiment prêts à publier ?',
          answer: 'Oui. Ils respectent votre charte graphique, ont le bon format et incluent le texte. Vous pouvez publier directement ou ajuster en quelques secondes.',
        },
        {
          question: 'Puis-je créer des visuels à la demande aussi ?',
          answer: 'Bien sûr. L\'Autopilote remplit votre calendrier de base, mais vous pouvez créer des visuels ad-hoc en 60 secondes quand vous en avez besoin.',
        },
      ],
      en: [
        {
          question: 'How does Autopilot mode work?',
          answer: '50 bots scan your market 24/7 (news, trends, competitors). They generate relevant post ideas and create associated visuals. You just validate and publish.',
        },
        {
          question: 'Are visuals really ready to publish?',
          answer: 'Yes. They respect your brand guidelines, have the right format, and include text. You can publish directly or adjust in seconds.',
        },
        {
          question: 'Can I also create visuals on demand?',
          answer: 'Of course. Autopilot fills your base calendar, but you can create ad-hoc visuals in 60 seconds whenever you need them.',
        },
      ],
    },
  },
};

export function getTarget(slug: string): TargetData | undefined {
  return targets[slug];
}

export function getAllTargetSlugs(): string[] {
  return Object.keys(targets);
}
