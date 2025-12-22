'use client';

import { useState, useEffect } from 'react';

// Simple i18n hook for client components
// Detects browser language and returns locale + translation function

type Locale = 'fr' | 'en';

const translations: Record<Locale, Record<string, any>> = {
  fr: {
    locale: 'fr-FR',
    common: {
      analyzing: 'Analyse en cours',
      analyze: 'Analyser',
      generate: 'Générer',
      generated: 'Généré par IA',
      soon: 'Bientôt',
      click: 'clic',
      pros: 'pros',
      coherent: 'cohérents',
      yourImage: '100% à votre image',
    },
    sidebar: {
      create: 'Créer',
      projects: 'Projets',
      calendar: 'Calendrier',
      stats: 'Stats',
      myBrand: 'Ma marque',
      noSlogan: 'Pas de slogan',
      freePlan: 'Plan gratuit',
      creditsRemaining: '{{count}} / {{total}} crédits',
      expand: 'Épingler la sidebar',
      collapse: 'Réduire la sidebar',
    },
    playground: {
      urlStep: {
        scrapingTime: 'Le processus peut prendre jusqu\'à 2 minutes. Vous serez notifié dès que c\'est prêt.',
      },
      gallery: {
        yourCreation: 'Votre création',
        readyForExport: 'Prêt pour export',
        edit: 'Modifier',
        download: 'Télécharger',
        delete: 'Supprimer',
        confirmDelete: 'Supprimer cette génération ?',
        promptUsed: 'Prompt utilisé',
        editMode: 'Mode édition',
        editThisImage: 'Modifier cette image',
        editDescription: 'Décrivez précisément ce que vous voulez changer. L\'IA modifiera l\'image en gardant le reste intact.',
        editPlaceholder: 'Ex: Change le fond en bleu nuit, ajoute un effet de lumière sur le produit, mets le logo en blanc...',
        referenceImages: 'Images de référence',
        referenceImagesHint: '💡 Ajoutez des images pour guider la modification (ex: nouveau logo, produit, texture...)',
        applyEdit: 'Appliquer la modification',
      },
      bento: {
        header: {
          validateCreate: 'Valider et créer',
          save: 'Sauvegarder',
          saveContinue: 'Sauvegarder et continuer',
          importRefVisuals: 'Importer visuels de référence',
          importRef: 'Importer références',
          changeLogo: 'Changer de logo',
          identity: 'Identité',
          strategy: 'Stratégie',
          story: 'Histoire',
          intelligence: 'Intelligence de marque',
        },
        import: {
          guideText: 'Comment ça marche ?',
          guideDetails: 'Importez vos assets (logo, produits, screenshots, visuels). L\'IA les analysera et les utilisera intelligemment dans vos créations.',
          autoTag: 'Catégorisation automatique par IA.',
          dragDrop: 'Glissez-déposez vos images ici',
          browse: 'ou cliquez pour parcourir',
          referenceTag: 'Style',
        },
        sections: {
          autoSave: 'Vos modifications sont sauvegardées automatiquement',
          add: 'Ajouter',
          change: 'Changer',
          colors: 'Couleurs',
          typography: 'Typographie',
          tagline: 'Slogan',
          taglinePlaceholder: 'Ex: L\'innovation au service de votre quotidien',
          targetAudience: 'Cible',
          targetPlaceholder: 'Ex: Entrepreneurs tech 25-40 ans cherchant à automatiser leur business',
          uvp: 'Promesse unique',
          uvpPlaceholder: 'Ex: Créez vos visuels pros en 60 secondes, sans designer',
          storyTitle: 'Ton histoire',
          storyPlaceholder: 'Ex: Nous avons créé cet outil après avoir passé des heures sur Canva...',
          targetPromise: 'Cible & Promesse',
          targetLabel: 'Public cible',
          uvpLabel: 'Promesse de valeur',
          strengths: 'Forces',
          addStrength: 'Ajoutez une force',
          strengthsPlaceholder: 'Ex: Interface intuitive, Support 24/7, Prix transparent...',
          tone: 'Tonalité',
          noTone: 'Aucune tonalité définie',
          tonePlaceholder: 'Ex: Professionnel mais accessible, Innovant, Rassurant...',
          painPoints: 'Pain Points',
          painPointPlaceholder: 'Ex: Perte de temps, Coûts élevés, Complexité technique...',
          competitors: 'Concurrents',
          news: 'Actualités',
          assetLibrary: 'Bibliothèque d\'assets',
          images: 'images',
          crawledPages: 'pages crawlées',
          noImages: 'Aucune image',
          noImagesHint: 'Importez ou uploadez des images pour enrichir votre marque',
        },
      },
    },
    landing: {
      hero: {
        headline1: 'Vos visuels de marque.',
        headline2: 'En 60 secondes.',
        subheadline: 'Importez votre charte, décrivez ce que vous voulez, publiez. Des visuels {{pros}}, {{coherent}}, {{yourImage}} — sans graphiste, sans agence, sans attendre.',
        placeholder: 'votresite.com',
        subtitle: 'Essai gratuit • Pas de carte bancaire • Résultat en 60 secondes',
        cta: 'Analyser',
        ctaLoading: 'Analyse...',
        badge: 'visuels générés aujourd\'hui',
        stats: {
          visuals: 'Visuels',
          highDef: 'Haute déf',
          oneClick: 'Modifier',
          free: 'Tester',
        },
        yourBrief: 'Votre brief',
        editMe: 'Modifiez-moi',
        enterToGenerate: 'Entrée pour générer',
        promptPlaceholder: 'Décrivez le visuel que vous voulez...',
        assetsLoaded: 'Assets chargés',
        defaultPrompt: 'Post pour annoncer le lancement de notre nouvelle fonctionnalité',
      },
    },
  },
  en: {
    locale: 'en-US',
    common: {
      analyzing: 'Analyzing',
      analyze: 'Analyze',
      generate: 'Generate',
      generated: 'AI Generated',
      soon: 'Soon',
      click: 'click',
      pros: 'professional',
      coherent: 'consistent',
      yourImage: '100% on-brand',
    },
    sidebar: {
      create: 'Create',
      projects: 'Projects',
      calendar: 'Calendar',
      stats: 'Stats',
      myBrand: 'My brand',
      noSlogan: 'No tagline',
      freePlan: 'Free plan',
      creditsRemaining: '{{count}} / {{total}} credits',
      expand: 'Pin sidebar',
      collapse: 'Collapse sidebar',
    },
    playground: {
      urlStep: {
        scrapingTime: 'The process can take up to 2 minutes. You will be notified when it\'s ready.',
      },
      gallery: {
        yourCreation: 'Your creation',
        readyForExport: 'Ready for export',
        edit: 'Edit',
        download: 'Download',
        delete: 'Delete',
        confirmDelete: 'Delete this generation?',
        promptUsed: 'Prompt used',
        editMode: 'Edit mode',
        editThisImage: 'Edit this image',
        editDescription: 'Describe precisely what you want to change. AI will modify the image while keeping the rest intact.',
        editPlaceholder: 'E.g., Change background to navy blue, add light effect on product, make logo white...',
        referenceImages: 'Reference images',
        referenceImagesHint: '💡 Add images to guide the edit (e.g., new logo, product, texture...)',
        applyEdit: 'Apply edit',
      },
      bento: {
        header: {
          validateCreate: 'Validate & create',
          save: 'Save',
          saveContinue: 'Save and continue',
          importRefVisuals: 'Import reference visuals',
          importRef: 'Import references',
          changeLogo: 'Change logo',
          identity: 'Identity',
          strategy: 'Strategy',
          story: 'Story',
          intelligence: 'Brand intelligence',
        },
        import: {
          guideText: 'How does it work?',
          guideDetails: 'Import your assets (logo, products, screenshots, visuals). AI will analyze them and use them intelligently in your creations.',
          autoTag: 'Automatic AI categorization.',
          dragDrop: 'Drag and drop your images here',
          browse: 'or click to browse',
          referenceTag: 'Style',
        },
        sections: {
          autoSave: 'Your changes are saved automatically',
          add: 'Add',
          change: 'Change',
          colors: 'Colors',
          typography: 'Typography',
          tagline: 'Tagline',
          taglinePlaceholder: 'E.g., Innovation for your daily life',
          targetAudience: 'Target',
          targetPlaceholder: 'E.g., Tech entrepreneurs 25-40 years old looking to automate their business',
          uvp: 'Unique promise',
          uvpPlaceholder: 'E.g., Create your pro visuals in 60 seconds, no designer needed',
          storyTitle: 'Your story',
          storyPlaceholder: 'E.g., We created this tool after spending hours on Canva...',
          targetPromise: 'Target & Promise',
          targetLabel: 'Target audience',
          uvpLabel: 'Value proposition',
          strengths: 'Strengths',
          addStrength: 'Add a strength',
          strengthsPlaceholder: 'E.g., Intuitive interface, 24/7 support, Transparent pricing...',
          tone: 'Tone',
          noTone: 'No tone defined',
          tonePlaceholder: 'E.g., Professional yet accessible, Innovative, Reassuring...',
          painPoints: 'Pain Points',
          painPointPlaceholder: 'E.g., Time waste, High costs, Technical complexity...',
          competitors: 'Competitors',
          news: 'News',
          assetLibrary: 'Asset library',
          images: 'images',
          crawledPages: 'crawled pages',
          noImages: 'No images',
          noImagesHint: 'Import or upload images to enrich your brand',
        },
      },
    },
    landing: {
      hero: {
        headline1: 'Your brand visuals.',
        headline2: 'In 60 seconds.',
        subheadline: 'Import your brand, describe what you want, publish. {{pros}}, {{coherent}}, {{yourImage}} visuals — no designer, no agency, no waiting.',
        placeholder: 'yoursite.com',
        subtitle: 'Free trial • No credit card • Results in 60 seconds',
        cta: 'Analyze',
        ctaLoading: 'Analyzing...',
        badge: 'visuals generated today',
        stats: {
          visuals: 'Visuals',
          highDef: 'High def',
          oneClick: 'Modify',
          free: 'Test',
        },
        yourBrief: 'Your brief',
        editMe: 'Edit me',
        enterToGenerate: 'Enter to generate',
        promptPlaceholder: 'Describe the visual you want...',
        assetsLoaded: 'Assets loaded',
        defaultPrompt: 'Post to announce the launch of our new feature',
      },
    },
  },
};

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'fr'; // SSR default
  
  const browserLang = navigator.language || (navigator as any).userLanguage || 'fr';
  return browserLang.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

// Deep get for nested translation keys like 'sidebar.create'
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Simple template interpolation: {{key}} -> value
function interpolate(template: string, values: Record<string, any> = {}): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? `{{${key}}}`);
}

export function useTranslation(overrideLocale?: Locale) {
  const [locale, setLocale] = useState<Locale>(overrideLocale || 'fr');

  // Detect browser locale only once on mount (if no override)
  useEffect(() => {
    if (!overrideLocale) {
      setLocale(detectLocale());
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = (key: string, values?: Record<string, any>): string => {
    const translation = getNestedValue(translations[locale], key);
    if (typeof translation === 'string') {
      return interpolate(translation, values);
    }
    return key; // Fallback to key if not found
  };

  return { t, locale, setLocale };
}

// For server components (using headers)
export function getServerLocale(acceptLanguage?: string): Locale {
  if (!acceptLanguage) return 'fr';
  return acceptLanguage.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

export function getTranslations(locale: Locale) {
  return translations[locale];
}

