'use client';

// ============================================
// SHARED TAG CONSTANTS FOR IMAGE LABELING
// ============================================

// Premium gradient-based tag colors (more refined than flat colors)
export const TAG_STYLES: Record<string, {
    bg: string;
    text: string;
    label: { fr: string; en: string };
    shortLabel: { fr: string; en: string };
    icon: string;
}> = {
    main_logo: {
        bg: 'bg-gradient-to-r from-gray-800 to-gray-900',
        text: 'text-white',
        label: { fr: 'Logo', en: 'Logo' },
        shortLabel: { fr: 'LOGO', en: 'LOGO' },
        icon: '◆'
    },
    product: {
        bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
        text: 'text-white',
        label: { fr: 'Produit', en: 'Product' },
        shortLabel: { fr: 'PROD', en: 'PROD' },
        icon: '◼'
    },
    app_ui: {
        bg: 'bg-gradient-to-r from-purple-500 to-indigo-500',
        text: 'text-white',
        label: { fr: 'App/UI', en: 'App/UI' },
        shortLabel: { fr: 'UI', en: 'UI' },
        icon: '▣'
    },
    reference: {
        bg: 'bg-gradient-to-r from-amber-400 to-orange-500',
        text: 'text-white',
        label: { fr: 'Référence', en: 'Reference' },
        shortLabel: { fr: 'REF', en: 'REF' },
        icon: '★'
    },
    person: {
        bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
        text: 'text-white',
        label: { fr: 'Personne', en: 'Person' },
        shortLabel: { fr: 'PERS', en: 'PERS' },
        icon: '●'
    },
    team: {
        bg: 'bg-gradient-to-r from-cyan-500 to-blue-500',
        text: 'text-white',
        label: { fr: 'Équipe', en: 'Team' },
        shortLabel: { fr: 'TEAM', en: 'TEAM' },
        icon: '●●'
    },
    client_logo: {
        bg: 'bg-gradient-to-r from-slate-400 to-slate-500',
        text: 'text-white',
        label: { fr: 'Client', en: 'Client' },
        shortLabel: { fr: 'CLI', en: 'CLI' },
        icon: '◇'
    },
    texture: {
        bg: 'bg-gradient-to-r from-rose-400 to-pink-500',
        text: 'text-white',
        label: { fr: 'Texture', en: 'Texture' },
        shortLabel: { fr: 'TEX', en: 'TEX' },
        icon: '▤'
    },
    lifestyle: {
        bg: 'bg-gradient-to-r from-pink-400 to-rose-500',
        text: 'text-white',
        label: { fr: 'Lifestyle', en: 'Lifestyle' },
        shortLabel: { fr: 'LIFE', en: 'LIFE' },
        icon: '♡'
    },
    icon: {
        bg: 'bg-gradient-to-r from-violet-400 to-purple-500',
        text: 'text-white',
        label: { fr: 'Icône', en: 'Icon' },
        shortLabel: { fr: 'ICO', en: 'ICO' },
        icon: '⬡'
    },
    other: {
        bg: 'bg-gradient-to-r from-gray-200 to-gray-300',
        text: 'text-gray-700',
        label: { fr: 'Autre', en: 'Other' },
        shortLabel: { fr: 'LIBRE', en: 'FREE' },
        icon: '○'
    },
};

// Get tag display info
export function getTagInfo(category: string, locale: 'fr' | 'en' = 'fr') {
    const style = TAG_STYLES[category] || TAG_STYLES.other;
    return {
        bg: style.bg,
        text: style.text,
        label: style.label[locale],
        shortLabel: style.shortLabel[locale],
        icon: style.icon,
        className: `${style.bg} ${style.text}`,
    };
}

// Get all tag options for dropdowns
export function getTagOptions(locale: 'fr' | 'en' = 'fr') {
    return Object.entries(TAG_STYLES).map(([value, style]) => ({
        value,
        label: style.label[locale],
        shortLabel: style.shortLabel[locale],
        color: `${style.bg} ${style.text}`,
        icon: style.icon,
    }));
}

// All available tag values
export const TAG_VALUES = Object.keys(TAG_STYLES);

// Tags that should be editable by users (subset)
export const EDITABLE_TAGS = ['product', 'app_ui', 'reference', 'person', 'team', 'texture', 'lifestyle', 'other'];
