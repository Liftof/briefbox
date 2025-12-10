'use client';

import { useState, useEffect, useCallback } from 'react';
import { translations, Locale } from './translations';

// ═══════════════════════════════════════════════════════════════════════════
// PALETTE - Translation Hook
// Detects browser language and provides translation function
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'palette_locale';

/**
 * Detect user's preferred language from browser
 * Priority: 1. localStorage, 2. navigator.language, 3. 'fr' default
 */
function detectLocale(): Locale {
  // Check if we're on the server
  if (typeof window === 'undefined') {
    return 'fr'; // Default for SSR
  }
  
  // 1. Check localStorage for saved preference
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'fr' || saved === 'en') {
    return saved;
  }
  
  // 2. Check browser language
  const browserLang = navigator.language?.toLowerCase() || '';
  
  // French-speaking regions
  if (browserLang.startsWith('fr')) {
    return 'fr';
  }
  
  // English-speaking regions (and fallback for others)
  return 'en';
}

/**
 * Hook for translations
 * @returns { locale, setLocale, t }
 */
export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>('fr'); // Default for SSR
  const [isClient, setIsClient] = useState(false);
  
  // Detect locale on client
  useEffect(() => {
    setIsClient(true);
    const detected = detectLocale();
    setLocaleState(detected);
  }, []);
  
  // Save locale preference
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLocale);
    }
  }, []);
  
  /**
   * Translation function
   * @param key - Dot-notation path to translation (e.g., 'landing.hero.headline1')
   * @returns Translated string
   */
  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation not found: ${key}`);
        return key; // Return key as fallback
      }
    }
    
    // If we reached a translation object with fr/en
    if (value && typeof value === 'object' && locale in value) {
      return value[locale];
    }
    
    // If value is a string (shouldn't happen, but safety)
    if (typeof value === 'string') {
      return value;
    }
    
    console.warn(`Translation not found for locale ${locale}: ${key}`);
    return key;
  }, [locale]);
  
  /**
   * Get an array of translations (for lists like steps, features, etc.)
   */
  const tArray = useCallback((key: string): any[] => {
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation array not found: ${key}`);
        return [];
      }
    }
    
    // If we reached a translation object with fr/en arrays
    if (value && typeof value === 'object' && locale in value) {
      return value[locale];
    }
    
    return [];
  }, [locale]);
  
  return {
    locale,
    setLocale,
    t,
    tArray,
    isClient
  };
}

/**
 * Simple translation getter (for non-component use)
 * Uses detected locale
 */
export function getTranslation(key: string, locale: Locale = 'fr'): string {
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key;
    }
  }
  
  if (value && typeof value === 'object' && locale in value) {
    return value[locale];
  }
  
  return key;
}

