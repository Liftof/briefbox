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
    landing: {
      hero: {
        headline1: 'Vos visuels de marque.',
        headline2: 'En 60 secondes.',
        subheadline: 'Importez votre charte, décrivez ce que vous voulez, publiez. Des visuels {{pros}}, {{coherent}}, {{yourImage}} — sans graphiste, sans agence, sans attendre.',
        urlPlaceholder: 'votresite.com',
        trialInfo: 'Essai gratuit • Pas de carte bancaire • Résultat en 60 secondes',
        stats: {
          visuals: 'Visuels',
          highDef: 'Haute déf',
          modify: 'Modifier',
          test: 'Tester',
        },
        generatedVisualsToday: 'visuels générés aujourd\'hui',
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
    landing: {
      hero: {
        headline1: 'Your brand visuals.',
        headline2: 'In 60 seconds.',
        subheadline: 'Import your brand, describe what you want, publish. {{pros}}, {{coherent}}, {{yourImage}} visuals — no designer, no agency, no waiting.',
        urlPlaceholder: 'yoursite.com',
        trialInfo: 'Free trial • No credit card • Results in 60 seconds',
        stats: {
          visuals: 'Visuals',
          highDef: 'High def',
          modify: 'Modify',
          test: 'Test',
        },
        generatedVisualsToday: 'visuals generated today',
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

export function useTranslation() {
  const [locale, setLocale] = useState<Locale>('fr');
  
  useEffect(() => {
    setLocale(detectLocale());
  }, []);
  
  const t = (key: string, values?: Record<string, any>): string => {
    const translation = getNestedValue(translations[locale], key);
    if (typeof translation === 'string') {
      return interpolate(translation, values);
    }
    return key; // Fallback to key if not found
  };
  
  return { t, locale };
}

// For server components (using headers)
export function getServerLocale(acceptLanguage?: string): Locale {
  if (!acceptLanguage) return 'fr';
  return acceptLanguage.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

export function getTranslations(locale: Locale) {
  return translations[locale];
}

