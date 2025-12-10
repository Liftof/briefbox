// Server-side i18n utilities (no 'use client')
// Can be imported in Server Components

export type Locale = 'fr' | 'en';

export function getServerLocale(acceptLanguage?: string): Locale {
  if (!acceptLanguage) return 'fr';
  return acceptLanguage.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

