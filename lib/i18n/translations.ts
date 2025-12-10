// ═══════════════════════════════════════════════════════════════════════════
// PALETTE - Translations (FR / EN)
// ═══════════════════════════════════════════════════════════════════════════

export type Locale = 'fr' | 'en';

export const translations = {
  // ─────────────────────────────────────────────────────────────────────────
  // LANDING PAGE
  // ─────────────────────────────────────────────────────────────────────────
  landing: {
    hero: {
      badge: {
        fr: 'visuels générés aujourd\'hui',
        en: 'visuals generated today'
      },
      headline1: {
        fr: 'Vos visuels de marque.',
        en: 'Your brand visuals.'
      },
      headline2: {
        fr: 'En 60 secondes.',
        en: 'In 60 seconds.'
      },
      subheadline: {
        fr: 'Importez votre charte, décrivez ce que vous voulez, publiez. Des visuels pros, cohérents, 100% à votre image — sans graphiste, sans agence, sans attendre.',
        en: 'Import your brand, describe what you want, publish. Professional visuals, consistent, 100% on-brand — no designer, no agency, no waiting.'
      },
      placeholder: {
        fr: 'votresite.com',
        en: 'yoursite.com'
      },
      cta: {
        fr: 'Analyser',
        en: 'Analyze'
      },
      ctaLoading: {
        fr: 'Analyse...',
        en: 'Analyzing...'
      },
      subtitle: {
        fr: 'Essai gratuit • Aucune CB requise • Résultats en 60 secondes',
        en: 'Free trial • No credit card required • Results in 60 seconds'
      },
      stats: {
        visuals: { fr: 'visuels', en: 'visuals' },
        highDef: { fr: 'haute déf', en: 'high def' },
        oneClick: { fr: 'pour modifier', en: 'to edit' },
        free: { fr: 'pour tester', en: 'to try' }
      }
    },
    problem: {
      eyebrow: { fr: 'Le problème', en: 'The problem' },
      headline1: { fr: 'Lundi 9h. Votre boss veut', en: 'Monday 9am. Your boss wants' },
      headline2: { fr: 'une campagne pour vendredi.', en: 'a campaign by Friday.' },
      subheadline: {
        fr: 'Vous n\'avez ni le temps, ni le budget, ni l\'envie de tout refaire à chaque demande. Et pourtant, il faut que ce soit beau.',
        en: 'You don\'t have the time, the budget, or the desire to redo everything for each request. Yet it has to look great.'
      },
      today: { fr: 'Ce que vous faites aujourd\'hui', en: 'What you do today' },
      withPalette: { fr: 'Ce que vous pourriez faire', en: 'What you could do' },
      todayItems: {
        fr: [
          { title: 'Appel au graphiste', desc: '3 jours minimum, 500€ de plus' },
          { title: 'Canva à 2h du mat\'', desc: 'Résultat : "C\'est pas vraiment nous"' },
          { title: 'L\'agence', desc: 'Devis sous 48h. Livraison dans 2 semaines.' }
        ],
        en: [
          { title: 'Call the designer', desc: '3 days minimum, $500 more' },
          { title: 'Canva at 2am', desc: 'Result: "That\'s not really us"' },
          { title: 'The agency', desc: 'Quote in 48h. Delivery in 2 weeks.' }
        ]
      },
      paletteItems: {
        fr: [
          { title: '2 minutes. Vraiment.', desc: 'Décrivez ce que vous voulez. Publiez. C\'est tout.' },
          { title: '19€/mois. Tout compris.', desc: 'Pas de surprise. Pas de devis. Pas de "ça dépend".' },
          { title: '100% votre marque', desc: 'Vos couleurs, votre logo, votre ton. Palette apprend, vous validez.' }
        ],
        en: [
          { title: '2 minutes. Really.', desc: 'Describe what you want. Publish. That\'s it.' },
          { title: '$19/month. All included.', desc: 'No surprises. No quotes. No "it depends".' },
          { title: '100% your brand', desc: 'Your colors, your logo, your tone. Palette learns, you approve.' }
        ]
      }
    },
    howItWorks: {
      eyebrow: { fr: 'Comment ça marche', en: 'How it works' },
      headline: { 
        fr: 'Plus simple que d\'expliquer à votre stagiaire', 
        en: 'Simpler than explaining to your intern' 
      },
      subheadline: {
        fr: 'Pas de tutoriel. Pas de formation. Pas de "c\'est compliqué au début".',
        en: 'No tutorial. No training. No "it\'s complicated at first".'
      },
      steps: {
        fr: [
          { num: '01', title: 'Collez votre site web', desc: 'Palette analyse votre marque en 30 secondes : logo, couleurs, ton, visuels.' },
          { num: '02', title: 'Dites ce que vous voulez', desc: '"Un post LinkedIn pour notre nouvelle feature" — c\'est tout ce qu\'il faut.' },
          { num: '03', title: 'Publiez ou ajustez', desc: 'Modifiez un détail en un clic. Changez le texte. Essayez une autre version.' }
        ],
        en: [
          { num: '01', title: 'Paste your website', desc: 'Palette analyzes your brand in 30 seconds: logo, colors, tone, visuals.' },
          { num: '02', title: 'Say what you want', desc: '"A LinkedIn post for our new feature" — that\'s all it takes.' },
          { num: '03', title: 'Publish or adjust', desc: 'Edit a detail in one click. Change the text. Try another version.' }
        ]
      }
    },
    gallery: {
      headline1: { fr: 'Ce que nos utilisateurs', en: 'What our users' },
      headline2: { fr: 'créent avec Palette', en: 'create with Palette' },
      subheadline: { fr: 'De vrais visuels, générés en quelques clics.', en: 'Real visuals, generated in a few clicks.' },
      cta: { fr: 'Créer votre premier visuel →', en: 'Create your first visual →' }
    },
    objections: {
      headline: { fr: '"Oui mais..."', en: '"Yes but..."' },
      items: {
        fr: [
          { q: '"Ça fait des trucs moches, non ?"', a: 'Palette ne génère pas d\'images génériques. Elle apprend votre marque. Vos couleurs. Votre style. C\'est pour ça que le résultat ressemble à vous, pas à une banque d\'images.' },
          { q: '"J\'ai déjà Canva"', a: 'Canva vous donne une page blanche et 10 000 templates. Palette part de votre marque et génère ce dont vous avez besoin. Zéro décision à prendre.' },
          { q: '"Mon agence connaît ma marque"', a: 'Votre agence aussi a besoin de temps. Et de budget. Palette ne remplace pas une agence pour la stratégie — mais pour sortir 10 posts en une heure, elle gagne.' }
        ],
        en: [
          { q: '"It makes ugly stuff, right?"', a: 'Palette doesn\'t generate generic images. It learns your brand. Your colors. Your style. That\'s why the result looks like you, not a stock image.' },
          { q: '"I already have Canva"', a: 'Canva gives you a blank page and 10,000 templates. Palette starts from your brand and generates what you need. Zero decisions to make.' },
          { q: '"My agency knows my brand"', a: 'Your agency also needs time. And budget. Palette doesn\'t replace an agency for strategy — but for creating 10 posts in an hour, it wins.' }
        ]
      }
    },
    pricing: {
      eyebrow: { fr: 'Tarifs', en: 'Pricing' },
      headline1: { fr: 'Moins cher qu\'un café par jour.', en: 'Cheaper than a coffee a day.' },
      headline2: { fr: 'Pour tous vos visuels.', en: 'For all your visuals.' },
      subheadline: { fr: 'Pas de devis. Pas de "ça dépend du scope". Tous les visuels en 2K haute résolution.', en: 'No quotes. No "it depends on the scope". All visuals in 2K high resolution.' },
      plans: {
        starter: {
          name: { fr: 'Starter', en: 'Starter' },
          price: { fr: 'Gratuit', en: 'Free' },
          desc: { fr: 'Pour voir si ça marche vraiment', en: 'To see if it really works' },
          cta: { fr: 'Tester gratuitement', en: 'Try for free' },
          features: {
            fr: ['3 générations offertes', 'Analyse de marque complète', 'Export 2K haute résolution'],
            en: ['3 free generations', 'Complete brand analysis', '2K high resolution export']
          }
        },
        pro: {
          name: { fr: 'Pro', en: 'Pro' },
          price: { fr: '19€', en: '$19' },
          period: { fr: '/mois', en: '/month' },
          desc: { fr: 'Pour ceux qui publient chaque semaine', en: 'For those who publish every week' },
          credits: { fr: '50 crédits/mois', en: '50 credits/month' },
          cta: { fr: 'Essai gratuit 7 jours', en: '7-day free trial' },
          badge: { fr: 'Populaire', en: 'Popular' },
          features: {
            fr: ['50 générations/mois', 'Galerie d\'inspirations complète', 'Tous les ratios et formats', 'Historique illimité'],
            en: ['50 generations/month', 'Full inspiration gallery', 'All ratios and formats', 'Unlimited history']
          }
        },
        business: {
          name: { fr: 'Business', en: 'Business' },
          price: { fr: '49€', en: '$49' },
          period: { fr: '/mois', en: '/month' },
          desc: { fr: 'Pour les équipes qui produisent', en: 'For teams that produce' },
          credits: { fr: '150 crédits/mois', en: '150 credits/month' },
          cta: { fr: 'Contacter les ventes', en: 'Contact sales' },
          features: {
            fr: ['150 générations/mois', 'Tout du plan Pro', '3 membres d\'équipe', 'Support prioritaire'],
            en: ['150 generations/month', 'Everything in Pro', '3 team members', 'Priority support']
          }
        }
      }
    },
    cta: {
      headline1: { fr: 'Prêt à créer', en: 'Ready to create' },
      headline2: { fr: 'votre premier visuel ?', en: 'your first visual?' },
      button: { fr: 'Générer mon premier visuel', en: 'Generate my first visual' },
      subtitle: { fr: 'Gratuit • Sans engagement • En 60 secondes', en: 'Free • No commitment • In 60 seconds' }
    },
    footer: {
      tagline: { fr: 'Des visuels de marque, en 60 secondes.', en: 'Brand visuals, in 60 seconds.' },
      product: { fr: 'Produit', en: 'Product' },
      resources: { fr: 'Ressources', en: 'Resources' },
      legal: { fr: 'Légal', en: 'Legal' },
      links: {
        features: { fr: 'Fonctionnalités', en: 'Features' },
        pricing: { fr: 'Tarifs', en: 'Pricing' },
        examples: { fr: 'Exemples', en: 'Examples' },
        blog: { fr: 'Blog', en: 'Blog' },
        help: { fr: 'Centre d\'aide', en: 'Help Center' },
        contact: { fr: 'Contact', en: 'Contact' },
        privacy: { fr: 'Confidentialité', en: 'Privacy' },
        terms: { fr: 'CGU', en: 'Terms' }
      },
      copyright: { fr: 'Tous droits réservés.', en: 'All rights reserved.' }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PLAYGROUND
  // ─────────────────────────────────────────────────────────────────────────
  playground: {
    urlStep: {
      headline: { fr: 'Analysez votre marque', en: 'Analyze your brand' },
      subheadline: { fr: 'Entrez l\'URL de votre site pour commencer', en: 'Enter your website URL to start' },
      placeholder: { fr: 'https://votresite.com', en: 'https://yoursite.com' },
      cta: { fr: 'Analyser', en: 'Analyze' },
      ctaLoading: { fr: 'Analyse en cours...', en: 'Analyzing...' }
    },
    logoConfirm: {
      headline: { fr: 'Est-ce bien votre logo ?', en: 'Is this your logo?' },
      subheadline: { fr: 'Confirmez que c\'est le bon logo pour une reproduction parfaite', en: 'Confirm this is the right logo for perfect reproduction' },
      confirm: { fr: 'C\'est le bon', en: 'That\'s it' },
      upload: { fr: 'Envoyer un autre', en: 'Upload another' },
      noLogo: { fr: 'Je n\'ai pas de logo', en: 'I don\'t have a logo' }
    },
    sidebar: {
      create: { fr: 'Créer', en: 'Create' },
      projects: { fr: 'Projets', en: 'Projects' },
      calendar: { fr: 'Calendrier', en: 'Calendar' },
      stats: { fr: 'Statistiques', en: 'Statistics' },
      myBrand: { fr: 'Ma Marque', en: 'My Brand' },
      noSlogan: { fr: 'Aucun slogan', en: 'No slogan' },
      freePlan: { fr: 'Free Plan', en: 'Free Plan' },
      credits: { fr: 'crédits', en: 'credits' },
      soon: { fr: 'bientôt', en: 'soon' },
      collapse: { fr: 'Replier la barre latérale', en: 'Collapse sidebar' },
      expand: { fr: 'Déplier la barre latérale', en: 'Expand sidebar' }
    },
    create: {
      angles: { fr: 'Angles de contenu', en: 'Content angles' },
      styleRef: { fr: 'Style ref', en: 'Style ref' },
      yourBrief: { fr: 'Votre brief', en: 'Your brief' },
      briefPlaceholder: { 
        fr: 'Décrivez le visuel que vous voulez créer...\n\nExemples :\n• "Story Instagram Black Friday avec mon logo"\n• "Post LinkedIn pour annoncer notre nouvelle feature"\n• "Bannière web moderne avec nos couleurs"',
        en: 'Describe the visual you want to create...\n\nExamples:\n• "Instagram Story Black Friday with my logo"\n• "LinkedIn post to announce our new feature"\n• "Modern web banner with our colors"'
      },
      aspectRatio: { fr: 'Ratio', en: 'Ratio' },
      resolution: { fr: 'Résolution', en: 'Resolution' },
      generate: { fr: 'Générer', en: 'Generate' },
      generating: { fr: 'Génération...', en: 'Generating...' },
      yourCreations: { fr: 'Vos créations', en: 'Your creations' },
      editHint: { 
        fr: '💡 Une faute d\'orthographe, un logo à corriger ou un détail à changer ? Cliquez sur ✏️ pour modifier n\'importe quelle image.',
        en: '💡 A typo, a logo to fix or a detail to change? Click ✏️ to edit any image.'
      },
      clear: { fr: 'Effacer', en: 'Clear' },
      styleInspiration: { fr: 'Style à imiter', en: 'Style inspiration' },
      gallery: { fr: 'Galerie', en: 'Gallery' },
      brandAssets: { fr: 'Assets de marque', en: 'Brand assets' },
      manage: { fr: 'Gérer', en: 'Manage' }
    },
    loading: {
      analyzing: { fr: 'Analyse en cours...', en: 'Analyzing...' },
      generating: { fr: 'Génération en cours...', en: 'Generating...' },
      saving: { fr: 'Sauvegarde...', en: 'Saving...' },
      stages: {
        fr: [
          '🔍 Lecture du site web...',
          '🎨 Extraction des couleurs...',
          '📝 Analyse du contenu...',
          '🖼️ Identification des visuels...',
          '🧠 Compréhension de la marque...',
          '✨ Génération des insights...',
          '🎯 Finalisation...'
        ],
        en: [
          '🔍 Reading the website...',
          '🎨 Extracting colors...',
          '📝 Analyzing content...',
          '🖼️ Identifying visuals...',
          '🧠 Understanding the brand...',
          '✨ Generating insights...',
          '🎯 Finalizing...'
        ]
      }
    },
    bento: {
      validate: { fr: 'C\'est parti !', en: 'Let\'s go!' },
      editBrand: { fr: 'Modifier', en: 'Edit' },
      identity: { fr: 'Identité visuelle', en: 'Visual identity' },
      colors: { fr: 'Couleurs', en: 'Colors' },
      typography: { fr: 'Typographie', en: 'Typography' },
      assets: { fr: 'Assets', en: 'Assets' },
      insights: { fr: 'Données & Insights', en: 'Data & Insights' },
      forces: { fr: 'Forces & USPs', en: 'Strengths & USPs' },
      tone: { fr: 'Ton & Langage', en: 'Tone & Language' },
      painPoints: { fr: 'Pain Points & Contexte', en: 'Pain Points & Context' },
      target: { fr: 'Cible', en: 'Target' },
      uvp: { fr: 'Proposition de valeur', en: 'Value proposition' }
    },
    lightbox: {
      yourCreation: { fr: 'Votre création', en: 'Your creation' },
      readyToExport: { fr: 'Prêt pour export', en: 'Ready to export' },
      download: { fr: 'Télécharger', en: 'Download' },
      edit: { fr: 'Modifier', en: 'Edit' },
      regenerate: { fr: 'Regénérer', en: 'Regenerate' }
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COMMON
  // ─────────────────────────────────────────────────────────────────────────
  common: {
    loading: { fr: 'Chargement...', en: 'Loading...' },
    error: { fr: 'Erreur', en: 'Error' },
    success: { fr: 'Succès', en: 'Success' },
    cancel: { fr: 'Annuler', en: 'Cancel' },
    save: { fr: 'Enregistrer', en: 'Save' },
    close: { fr: 'Fermer', en: 'Close' },
    next: { fr: 'Suivant', en: 'Next' },
    back: { fr: 'Retour', en: 'Back' },
    or: { fr: 'ou', en: 'or' }
  }
} as const;

// Type helper to get translation
export type TranslationKey = keyof typeof translations;

