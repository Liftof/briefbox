'use client';

import { useState, useEffect, useRef, Suspense, ChangeEvent, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from './components/Sidebar';
import BentoGrid from './components/BentoGrid';
import StyleGallery from './components/StyleGallery';
import CalendarView from './components/CalendarView';
import ProjectsView, { addGenerations, loadFeedbackPatterns } from './components/ProjectsView';
import RecentVisuals from './components/RecentVisuals';
import SettingsView from './components/SettingsView';
import { useGenerations, Generation } from '@/lib/useGenerations';
import StrategyView from './components/StrategyView';
import { UpgradePopup, CreditsToast, UpgradeInline } from './components/CreditsWidget';
import MobileNav from './components/MobileNav';
import { useCredits } from '@/lib/useCredits';
import { TemplateId } from '@/lib/templates';
import { useTranslation } from '@/lib/i18n';
import { useBrands, BrandSummary, getLastUsedBrandId, setLastUsedBrandId, clearLastUsedBrandId } from '@/lib/useBrands';
import { getTagInfo, getTagOptions as getTagOptionsList, EDITABLE_TAGS } from '@/lib/tagStyles';
import { notify, requestNotificationPermission } from '@/lib/notifications';
import confetti from 'canvas-confetti';
import { useUser } from '@clerk/nextjs';

type Step = 'loading' | 'url' | 'analyzing' | 'logo-confirm' | 'bento' | 'playground';

// Template definitions for the UI
const TEMPLATES = [
  { id: 'stat' as TemplateId, icon: '📊', name: 'Stat', desc: 'Chiffre clé impactant', placeholder: '+47% de croissance en 2024' },
  { id: 'announcement' as TemplateId, icon: '📢', name: 'Annonce', desc: 'Lancement, news', placeholder: 'Nouveau: notre Dashboard V2 est disponible' },
  { id: 'quote' as TemplateId, icon: '💬', name: 'Citation', desc: 'Témoignage client', placeholder: 'Grâce à [Brand], on a doublé notre ROI' },
  { id: 'event' as TemplateId, icon: '🎤', name: 'Event', desc: 'Webinar, conférence', placeholder: 'Webinar: Les tendances 2025' },
  { id: 'expert' as TemplateId, icon: '👤', name: 'Expert', desc: 'Thought leadership', placeholder: 'Interview de notre CEO sur l\'innovation' },
  { id: 'product' as TemplateId, icon: '✨', name: 'Produit', desc: 'Feature, showcase', placeholder: 'Découvrez notre nouvelle fonctionnalité' },
];

// Smart placeholder generator based on brand context
const getSmartPlaceholder = (templateId: TemplateId | null, brandData: any): string => {
  if (!brandData) return "Qu'est-ce que vous voulez communiquer ?";

  const brandName = brandData.name || 'votre marque';
  const industry = brandData.industry || '';
  const features = brandData.features || [];
  const values = brandData.values || [];
  const services = brandData.services || [];
  const realStats = brandData.contentNuggets?.realStats || [];
  const testimonials = brandData.contentNuggets?.testimonials || [];

  // Get first feature/service for context
  const mainFeature = features[0] || services[0] || '';
  const mainValue = values[0] || '';

  // Industry-specific terms
  const industryTerms: Record<string, { metric: string; action: string; event: string }> = {
    'saas': { metric: 'utilisateurs actifs', action: 'automatisé', event: 'Product Hunt Launch' },
    'fintech': { metric: 'transactions traitées', action: 'sécurisé', event: 'Finance Summit' },
    'ecommerce': { metric: 'commandes livrées', action: 'expédié', event: 'Black Friday' },
    'marketing': { metric: 'leads générés', action: 'converti', event: 'Marketing Week' },
    'tech': { metric: 'lignes de code', action: 'déployé', event: 'Tech Conference' },
    'health': { metric: 'patients accompagnés', action: 'soigné', event: 'Salon Santé' },
    'education': { metric: 'étudiants formés', action: 'certifié', event: 'EdTech Summit' },
    'default': { metric: 'clients satisfaits', action: 'accompagné', event: 'notre prochain événement' }
  };

  // Find matching industry or use default
  const industryKey = Object.keys(industryTerms).find(key =>
    industry.toLowerCase().includes(key)
  ) || 'default';
  const terms = industryTerms[industryKey];

  // Generate placeholder based on template
  const placeholders: Record<TemplateId, string[]> = {
    'stat': [
      realStats[0] ? `${realStats[0]}` : `+10K ${terms.metric} ce mois`,
      `${brandName} : 3x plus rapide que la moyenne du marché`,
      mainFeature ? `${mainFeature} : +47% d'efficacité` : `95% de satisfaction client`,
      `${industry ? industry : 'Notre secteur'} : les chiffres qui comptent`
    ],
    'announcement': [
      mainFeature ? `Nouveau : ${mainFeature} maintenant disponible` : `Grande nouvelle pour ${brandName}`,
      `${brandName} lance sa nouvelle version`,
      `Mise à jour majeure : ce qui change pour vous`,
      services[0] ? `${services[0]} : nouvelle offre disponible` : `Lancement officiel !`
    ],
    'quote': [
      testimonials[0]?.quote || `"${brandName} a transformé notre façon de travailler"`,
      `"Depuis qu'on utilise ${brandName}, tout a changé"`,
      mainValue ? `"Leur ${mainValue.toLowerCase()} fait vraiment la différence"` : `"Un partenaire de confiance"`,
      `"On ne reviendrait pas en arrière" — Client ${industry || 'satisfait'}`
    ],
    'event': [
      `Webinar : Comment ${mainFeature?.toLowerCase() || 'optimiser vos process'}`,
      `Rejoignez-nous pour ${terms.event}`,
      `Live : Les coulisses de ${brandName}`,
      `Masterclass : ${industry || 'Les tendances'} 2025`
    ],
    'expert': [
      `Ce que ${industry || 'le marché'} nous apprend en 2024`,
      mainValue ? `Pourquoi ${mainValue.toLowerCase()} est notre priorité` : `Notre vision du futur`,
      `3 conseils de notre équipe pour réussir`,
      `Interview : ${brandName} sur les défis de demain`
    ],
    'product': [
      mainFeature ? `${mainFeature} : découvrez comment ça marche` : `Notre produit phare en action`,
      `Pourquoi nos clients adorent ${services[0] || 'notre solution'}`,
      `Le détail qui change tout`,
      `${brandName} : la fonctionnalité que vous attendiez`
    ]
  };

  // Get placeholders for the template
  const templatePlaceholders = templateId ? placeholders[templateId] : null;

  if (!templatePlaceholders) {
    // Generic smart placeholder when no template selected
    const genericOptions = [
      `Que voulez-vous faire savoir sur ${brandName} ?`,
      realStats[0] ? `Ex: "${realStats[0]}"` : `Partagez une info clé sur ${brandName}`,
      mainFeature ? `Mettez en avant ${mainFeature.toLowerCase()}` : `Votre message principal...`,
      `Quelle est votre actu du moment ?`
    ];
    return genericOptions[Math.floor(Math.random() * genericOptions.length)];
  }

  // Return a random placeholder from the options (or first one for consistency)
  return templatePlaceholders[0];
};
type ToastType = 'success' | 'error' | 'info';

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type GeneratedImage = {
  id: string;
  url: string;
  aspectRatio?: string;
};

const mergeUniqueStrings = (base: string[] = [], extra: string[] = []) => {
  return Array.from(new Set([...(base || []), ...(extra || [])].filter(Boolean)));
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Helper: Convert GIF to PNG (extracts first frame if animated)
const convertGifToPng = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string); // Fallback
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Fallback prompt builder when Creative Director API fails
const buildFallbackPrompt = (brief: string, brand: any): string => {
  const primaryColor = Array.isArray(brand.colors) && brand.colors.length > 0 ? brand.colors[0] : '#1a365d';
  const secondaryColor = Array.isArray(brand.colors) && brand.colors.length > 1 ? brand.colors[1] : '#ffffff';
  const brandName = brand.name || 'Brand';

  // Premium LinkedIn-style static post prompt
  return `Premium LinkedIn static post for ${brandName}.

BRIEF: ${brief}

DESIGN STRUCTURE:
- TOP: Glassmorphism frosted pill badge floating elegantly with contextual label
- CENTER: ${brandName} logo or key message displayed large, crisp, perfectly centered
- BOTTOM: Elegant footer with website URL in refined white typography

BACKGROUND: Rich gradient from ${primaryColor} to deep navy/black. Subtle noise grain texture for premium editorial depth. NOT flat.

STYLE: Ultra-premium B2B aesthetic. Like McKinsey or Goldman Sachs LinkedIn posts. Clean lines, perfect contrast, authoritative yet elegant.

COLORS: Primary ${primaryColor}, accents in white and ${secondaryColor}. Sophisticated color harmony.

MUST HAVE: Glassmorphism effects, subtle shadows, premium grain, sharp typography zones, professional polish.

AVOID: Flat backgrounds, distorted logos, cluttered layout, amateur design, 3D renders, cinematic shots, photorealistic scenes, complex environments, stock photo vibes.`;
};

function PlaygroundContent() {
  const { t, locale, setLocale } = useTranslation();
  const { user } = useUser();
  const userId = user?.id;
  const searchParams = useSearchParams();
  const brandId = searchParams.get('brandId');
  const analyzeUrl = searchParams.get('analyzeUrl'); // From Hero input

  // Multi-brand system
  const { brands: userBrands, loading: brandsLoading, refresh: refreshBrands } = useBrands();
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);

  const [showStyleGallery, setShowStyleGallery] = useState(false);
  const [showAssetManager, setShowAssetManager] = useState(false);
  const [showAllAngles, setShowAllAngles] = useState(false);

  // Determine initial step:
  // - If we have URL params → go to analyzing
  // - Otherwise start with 'loading' to check if user has existing brands
  const [step, setStep] = useState<Step>(
    analyzeUrl ? 'analyzing' : brandId ? 'analyzing' : 'loading' as Step
  );
  const [stepBeforeBento, setStepBeforeBento] = useState<Step | null>(null); // Remember where to go back from bento
  const [hasCheckedBrands, setHasCheckedBrands] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState(t('status.analyzingBrand'));
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'preparing' | 'running' | 'complete' | 'error'>('idle');
  const [loadingStage, setLoadingStage] = useState(0);

  // Generation queue for parallel non-blocking generations
  interface GenerationJob {
    id: string;
    brief: string;
    status: 'preparing' | 'running' | 'complete' | 'error';
    progress: number;
    statusMessage: string;
    timestamp: number;
    aspectRatio?: string;
  }
  const [generationQueue, setGenerationQueue] = useState<GenerationJob[]>([]);
  const activeGenerations = generationQueue.filter(job => job.status === 'preparing' || job.status === 'running');

  // Fun loading messages that cycle through (locale-aware)
  const LOADING_STAGES = locale === 'fr' ? [
    { emoji: '🔍', message: 'Exploration du site...', sub: 'Accueil, à propos, services...' },
    { emoji: '🎨', message: 'Extraction des couleurs...', sub: 'Depuis votre site et vos visuels' },
    { emoji: '📸', message: 'Analyse des images...', sub: 'Logo, produits, équipe...' },
    { emoji: '🧠', message: 'L\'IA réfléchit...', sub: 'Analyse du style et du ton' },
    { emoji: '🔥', message: 'Enrichissement...', sub: 'Tendances de votre secteur' },
    { emoji: '📊', message: 'Compilation des insights...', sub: 'Pain points & positionnement' },
    { emoji: '✨', message: 'Finalisation...', sub: 'Votre profil de marque est prêt' },
  ] : [
    { emoji: '🔍', message: 'Exploring website...', sub: 'Homepage, about, services...' },
    { emoji: '🎨', message: 'Extracting colors...', sub: 'From your site and visuals' },
    { emoji: '📸', message: 'Analyzing images...', sub: 'Logo, products, team...' },
    { emoji: '🧠', message: 'AI is thinking...', sub: 'Analyzing style and tone' },
    { emoji: '🔥', message: 'Enriching data...', sub: 'Trends in your industry' },
    { emoji: '📊', message: 'Compiling insights...', sub: 'Pain points & positioning' },
    { emoji: '✨', message: 'Finalizing...', sub: 'Your brand profile is ready' },
  ];

  // Simulated discoveries that appear during loading (locale-aware)
  const DISCOVERY_ITEMS = locale === 'fr' ? [
    { threshold: 10, emoji: '🌐', text: 'Site web détecté' },
    { threshold: 20, emoji: '🖼️', text: 'Logo trouvé' },
    { threshold: 30, emoji: '🎨', text: 'Palette de couleurs extraite' },
    { threshold: 40, emoji: '📝', text: 'Tagline identifiée' },
    { threshold: 50, emoji: '🎯', text: 'Audience cible analysée' },
    { threshold: 60, emoji: '💡', text: 'Features clés repérées' },
    { threshold: 70, emoji: '📊', text: 'Données marché récupérées' },
    { threshold: 80, emoji: '🔥', text: 'Pain points détectés' },
    { threshold: 90, emoji: '✅', text: 'Brief prêt !' },
  ] : [
    { threshold: 10, emoji: '🌐', text: 'Website detected' },
    { threshold: 20, emoji: '🖼️', text: 'Logo found' },
    { threshold: 30, emoji: '🎨', text: 'Color palette extracted' },
    { threshold: 40, emoji: '📝', text: 'Tagline identified' },
    { threshold: 50, emoji: '🎯', text: 'Target audience analyzed' },
    { threshold: 60, emoji: '💡', text: 'Key features spotted' },
    { threshold: 70, emoji: '📊', text: 'Market data retrieved' },
    { threshold: 80, emoji: '🔥', text: 'Pain points detected' },
    { threshold: 90, emoji: '✅', text: 'Brief ready!' },
  ];

  // Rotating fun facts (locale-aware)
  const FUN_FACTS = locale === 'fr' ? [
    "🔍 Analyse de votre page d'accueil, à propos, services...",
    "🎨 Extraction des couleurs et du style visuel de votre site.",
    "📝 Identification de votre ton de voix et vocabulaire unique.",
    "🖼️ Découverte de vos visuels : logo, produits, équipe...",
    "💡 Analyse des tendances de votre industrie en temps réel.",
    "✨ Création de votre profil de marque personnalisé.",
  ] : [
    "🔍 Analyzing your homepage, about page, services...",
    "🎨 Extracting colors and visual style from your website.",
    "📝 Identifying your tone of voice and unique vocabulary.",
    "🖼️ Discovering your visuals: logo, products, team...",
    "💡 Analyzing trends in your industry in real time.",
    "✨ Creating your personalized brand profile.",
  ];

  const [currentFact, setCurrentFact] = useState(0);

  // Rotate fun facts every 5 seconds
  useEffect(() => {
    if (step !== 'analyzing') return;
    const interval = setInterval(() => {
      setCurrentFact(prev => (prev + 1) % FUN_FACTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [step]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Open by default on desktop

  const [brandData, setBrandData] = useState<any | null>(null);
  // Backgrounds/textures generation removed for cost optimization
  const backgrounds: string[] = [];
  const isGeneratingBackgrounds = false;

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const [showSourceManager, setShowSourceManager] = useState(false);
  const [sourceTab, setSourceTab] = useState<'library' | 'upload' | 'url'>('library');
  const sourceManagerInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newUploadLabel, setNewUploadLabel] = useState('product');

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  // Asset reproduction modes: 'exact' = copy exactly (screenshots, UI), 'inspire' = can reinterpret (diagrams, illustrations)
  const [assetModes, setAssetModes] = useState<Record<string, 'exact' | 'inspire'>>({});
  const [sourceUrl, setSourceUrl] = useState('');
  const [socialLinks, setSocialLinks] = useState<string[]>(['', '']);
  const [otherLinks, setOtherLinks] = useState<string>('');
  const [isAddingSource, setIsAddingSource] = useState(false);

  // Logo confirmation step state
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isConfirmingLogo, setIsConfirmingLogo] = useState(false);
  const logoUploadRef = useRef<HTMLInputElement>(null);

  const [editingImage, setEditingImage] = useState<string | null>(null);
  // Style references with optional descriptions
  const [styleRefImages, setStyleRefImages] = useState<{ url: string; note?: string }[]>([]);
  const [editPrompt, setEditPrompt] = useState('');
  const [editAdditionalImages, setEditAdditionalImages] = useState<string[]>([]); // NEW: Additional images for editing
  const [visualIdeas, setVisualIdeas] = useState<string[]>([]);
  const [brief, setBrief] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [lightboxImage, setLightboxImage] = useState<GeneratedImage | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [contentLanguage, setContentLanguage] = useState<'fr' | 'en' | 'es' | 'de'>(
    ['fr', 'en', 'es', 'de'].includes(locale) ? (locale as any) : 'fr'
  );

  // Credits & Upgrade state
  const { credits: creditsInfo, updateRemaining: updateCreditsRemaining, refresh: refreshCredits } = useCredits();
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState(0); // Track how many credits user has consumed
  const [showCreditsToast, setShowCreditsToast] = useState(false);

  // Recent generations for the bottom section
  const { generations: recentGenerations, refresh: refreshGenerations } = useGenerations(selectedBrandId || undefined);
  const [lastCreditsRemaining, setLastCreditsRemaining] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [resolution, setResolution] = useState<'2K' | '4K'>('2K');

  // Tag editing dropdown state (for BRAND VISUALS inline tag change)
  const [tagDropdownOpen, setTagDropdownOpen] = useState<string | null>(null); // URL of image with open dropdown
  const [showAssetHint, setShowAssetHint] = useState(false); // Hint to add assets when typing custom prompt
  const [showGiftOverlay, setShowGiftOverlay] = useState(false); // Celebrate free generation gift
  const [isSavingBrand, setIsSavingBrand] = useState(false); // Loading state for brand save button
  const [hasReceivedFreeGen, setHasReceivedFreeGen] = useState(false); // Track if user got their free gen already

  // Aspect ratio options
  const ASPECT_RATIOS = [
    { value: '1:1', label: '1:1', desc: 'Carré', icon: '◻️' },
    { value: '4:5', label: '4:5', desc: 'Portrait', icon: '📱' },
    { value: '9:16', label: '9:16', desc: 'Story/Reel', icon: '📲' },
    { value: '16:9', label: '16:9', desc: 'Paysage', icon: '🖥️' },
    { value: '3:2', label: '3:2', desc: 'Photo', icon: '📷' },
    { value: '21:9', label: '21:9', desc: 'Cinéma', icon: '🎬' },
  ];

  // Resolution options
  const RESOLUTIONS = [
    { value: '2K' as const, label: '2K', desc: '2048px' },
    { value: '4K' as const, label: '4K', desc: '4096px', badge: 'PRO' },
  ];

  // Language options
  const LANGUAGES = [
    { code: 'fr' as const, label: 'Français', flag: '🇫🇷' },
    { code: 'en' as const, label: 'English', flag: '🇬🇧' },
    { code: 'es' as const, label: 'Español', flag: '🇪🇸' },
    { code: 'de' as const, label: 'Deutsch', flag: '🇩🇪' },
  ];

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = createId();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (toastTimeouts.current[id]) {
      clearTimeout(toastTimeouts.current[id]);
    }
    toastTimeouts.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
      delete toastTimeouts.current[id];
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(toastTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  // Confetti celebration on successful payment
  useEffect(() => {
    const success = searchParams.get('success');
    const plan = searchParams.get('plan');

    if (success === 'true' && plan) {
      // Launch confetti animation
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Burst from two sides
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Show success message
      const planName = plan === 'pro' ? 'Pro' : 'Premium';
      const message = locale === 'fr'
        ? `Bienvenue dans le plan ${planName} ! 🎉`
        : `Welcome to ${planName} plan! 🎉`;

      setTimeout(() => {
        showToast(message, 'success');
      }, 500);

      // Clean up URL after showing confetti
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      url.searchParams.delete('plan');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, locale, showToast]);

  // Auto-detect and set locale + contentLanguage from brand's detected language
  // Runs when brand changes or detectedLanguage is set
  useEffect(() => {
    if (!brandData) {
      console.log('🔍 No brand data yet, skipping locale detection');
      return;
    }

    console.log('🔍 Locale detection check:', {
      hasDetectedLanguage: !!brandData?.detectedLanguage,
      detectedLanguage: brandData?.detectedLanguage,
      currentLocale: locale,
      currentContentLanguage: contentLanguage,
      brandName: brandData?.name,
      brandId: brandData?.id
    });

    if (brandData?.detectedLanguage) {
      const detectedLang = brandData.detectedLanguage;
      // Map detected language to supported content languages
      const supportedLangs = ['fr', 'en', 'es', 'de'] as const;
      const brandContentLang = supportedLangs.includes(detectedLang as any)
        ? (detectedLang as 'fr' | 'en' | 'es' | 'de')
        : 'en'; // Default to English for unsupported languages
      const brandLocale = (detectedLang === 'en' || detectedLang === 'es' || detectedLang === 'de') ? 'en' : 'fr';

      console.log(`🌐 Brand language: ${detectedLang}, content lang: ${brandContentLang}, UI locale: ${brandLocale}`);

      // Update UI locale
      if (brandLocale !== locale) {
        console.log(`✅ Switching UI locale from ${locale} to ${brandLocale}`);
        setLocale(brandLocale);
      }

      // Update content language to match brand's language
      if (brandContentLang !== contentLanguage) {
        console.log(`✅ Switching content language from ${contentLanguage} to ${brandContentLang}`);
        setContentLanguage(brandContentLang);
      }
    } else {
      console.log('⚠️ No detectedLanguage in brandData - might be an old brand');
      console.log('   Available keys:', Object.keys(brandData).join(', '));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandData?.id, brandData?.detectedLanguage]); // Trigger on brand change OR language change

  // Listen for "use-angle" events from BentoGrid (legacy)
  useEffect(() => {
    const handleUseAngle = (e: CustomEvent) => {
      if (e.detail) {
        setBrief(e.detail);
        setStep('playground');
        setActiveTab('create');
        showToast('Angle créatif chargé', 'success');
      }
    };
    window.addEventListener('use-angle', handleUseAngle as EventListener);
    return () => window.removeEventListener('use-angle', handleUseAngle as EventListener);
  }, [showToast, setStep, setActiveTab]); // Add missing dependencies

  // Listen for "use-template" events from BentoGrid (new template system)
  useEffect(() => {
    const handleUseTemplate = (e: CustomEvent) => {
      if (e.detail) {
        const { templateId, headline, metric, metricLabel } = e.detail;
        setSelectedTemplate(templateId as TemplateId);

        // Build the brief based on template type
        let briefText = headline || '';
        if (templateId === 'stat' && metric) {
          briefText = `${metric} ${metricLabel || ''}`.trim();
        }
        setBrief(briefText);

        setStep('playground');
        setActiveTab('create');
        showToast(`Template "${templateId}" sélectionné`, 'success');
      }
    };
    window.addEventListener('use-template', handleUseTemplate as EventListener);
    return () => window.removeEventListener('use-template', handleUseTemplate as EventListener);
  }, [showToast, setStep, setActiveTab]); // Add missing dependencies

  // generateBackgroundsForBrand removed - textures disabled for cost optimization

  const hydrateBrand = (brand: any) => {
    if (!brand) return;

    // setBackgrounds removed - textures disabled
    setVisualIdeas(Array.isArray(brand.visualConcepts) ? brand.visualConcepts : []);

    // SYNC images with same priority as handleValidateBento
    // This ensures returning users get the same quality images as new users
    const labeledImages = Array.isArray(brand.labeledImages) ? brand.labeledImages : [];

    // Priority order for DEFAULT SELECTION (what gets pre-selected for generation)
    // High priority: logo, app_ui, product, person, texture (useful for visuals)
    // Low priority: reference, other
    // EXCLUDED from default: icon, client_logo (not useful for generation)
    const logoImg = brand.logo ? [brand.logo] : [];
    const appImgs = labeledImages.filter((img: any) => img.category === 'app_ui').map((img: any) => img.url);
    const productImgs = labeledImages.filter((img: any) => img.category === 'product').map((img: any) => img.url);
    const personImgs = labeledImages.filter((img: any) => img.category === 'person').map((img: any) => img.url);
    const textureImgs = labeledImages.filter((img: any) => img.category === 'texture').map((img: any) => img.url);
    const referenceImgs = labeledImages.filter((img: any) => img.category === 'reference').map((img: any) => img.url);
    // "other" but NOT icons or client logos
    const otherImgs = labeledImages.filter((img: any) =>
      !['main_logo', 'reference', 'product', 'app_ui', 'person', 'texture', 'icon', 'client_logo'].includes(img.category)
    ).map((img: any) => img.url);
    // Icons and client logos still in library but not pre-selected
    const iconImgs = labeledImages.filter((img: any) => img.category === 'icon').map((img: any) => img.url);
    const clientLogoImgs = labeledImages.filter((img: any) => img.category === 'client_logo').map((img: any) => img.url);

    // ALL images for the library (user can select any)
    const fallback = Array.isArray(brand.images) ? brand.images : [];
    const allImages = [...new Set([
      ...logoImg, ...appImgs, ...productImgs, ...personImgs, ...textureImgs,
      ...referenceImgs, ...otherImgs, ...iconImgs, ...clientLogoImgs, ...fallback
    ])].filter(Boolean);

    // DEFAULT SELECTED: prioritize useful assets (exclude icons, client logos)
    const priorityImages = [...new Set([
      ...logoImg, ...appImgs, ...productImgs, ...personImgs, ...textureImgs, ...referenceImgs, ...otherImgs
    ])].filter(Boolean);

    // FIX: Add images array to brandData so BentoGrid Asset Library works
    // The DB stores labeledImages but BentoGrid expects brandData.images
    const hydratedBrand = {
      ...brand,
      images: allImages, // Populate images from labeledImages for BentoGrid
    };

    setBrandData(hydratedBrand);
    setUploadedImages(priorityImages.slice(0, 8)); // Pre-select best 8 assets

    // New: Use suggestedPosts (template-based) if available
    if (brand.suggestedPosts?.length && !brief) {
      const firstPost = brand.suggestedPosts[0];
      if (firstPost) {
        // Set template and brief
        setSelectedTemplate(firstPost.templateId as TemplateId);
        const briefText = firstPost.headline || (firstPost.metric ? `${firstPost.metric} ${firstPost.metricLabel || ''}` : '');
        if (briefText) setBrief(briefText);
      }
    }
    // Fallback to old marketingAngles format
    else if (brand.marketingAngles?.length && !brief) {
      const firstAngle = brand.marketingAngles[0];
      if (firstAngle?.concept || firstAngle?.title) {
        setBrief((firstAngle.concept || firstAngle.title).replace(/^(Concept \d+:|Title:|Concept:)\s*/i, ''));
      }
    }

    // Background generation removed for cost optimization
  };

  // FAST PATH: Check localStorage immediately for returning users
  // This runs before the API fetch completes
  useEffect(() => {
    // Skip if we have explicit URL params or already checked
    if (brandId || analyzeUrl || hasCheckedBrands) return;

    // Check localStorage immediately (no API wait)
    const lastUsedId = getLastUsedBrandId(userId);

    if (lastUsedId) {
      // User has used a brand before - go directly to playground
      console.log('⚡ Fast path: Loading last brand from localStorage:', lastUsedId);
      setHasCheckedBrands(true);
      setSelectedBrandId(lastUsedId);
      setStep('playground'); // Go to playground immediately
      setActiveTab('create');
      loadBrandById(lastUsedId, false, true); // Load data in background
    }
    // If no lastUsedId, wait for API to check if user has any brands at all
  }, [brandId, analyzeUrl, hasCheckedBrands, userId]);

  // SLOW PATH: Wait for API if no localStorage brand found
  useEffect(() => {
    // Skip if we have explicit URL params or already handled
    if (brandId || analyzeUrl || hasCheckedBrands || brandsLoading) return;

    // API finished loading and we haven't handled yet
    setHasCheckedBrands(true);

    if (userBrands.length > 0) {
      // User has brands but no localStorage - go to playground immediately
      const brandToLoad = userBrands[0];
      console.log('🏷️ Loading first available brand:', brandToLoad.name);
      setSelectedBrandId(brandToLoad.id);
      setStep('playground'); // Go to playground immediately
      setActiveTab('create');
      loadBrandById(brandToLoad.id, false, true); // Load data in background
    } else {
      // No brands at all - show onboarding
      setStep('url');
    }
  }, [brandsLoading, userBrands, brandId, analyzeUrl, hasCheckedBrands]);

  // Helper: Load a brand by ID
  // silent = true → don't show loading screen (for returning users)
  const loadBrandById = async (id: number, showBento = true, silent = false) => {
    let timer: NodeJS.Timeout | null = null;

    if (!silent) {
      setStep('analyzing');
      setStatusMessage(t('status.loadingBrand'));
      setProgress(5);

      timer = setInterval(() => {
        setProgress((prev) => prev >= 90 ? prev : prev + Math.random() * 15);
      }, 500);
    }

    try {
      const response = await fetch(`/api/brand/${id}`);
      const data = await response.json();

      // Handle 403 Forbidden - brand belongs to different user
      // This happens when localStorage has stale data from previous user
      if (response.status === 403) {
        console.log('⚠️ Brand belongs to different user, clearing localStorage');
        clearLastUsedBrandId(userId);
        if (timer) clearInterval(timer);

        // If user has other brands, load the first one instead of showing onboarding
        if (userBrands && userBrands.length > 0) {
          console.log('🔄 User has other brands, loading first one');
          loadBrandById(userBrands[0].id, false, true);
        } else {
          setStep('url'); // No brands - show onboarding
        }
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load brand');
      }

      if (timer) clearInterval(timer);
      setProgress(100);
      hydrateBrand(data.brand);
      setSelectedBrandId(id);
      setLastUsedBrandId(id, userId);

      // Go to bento or directly to playground
      if (silent) {
        // Direct transition for returning users
        setStep(showBento ? 'bento' : 'playground');
        setActiveTab('create');
      } else {
        setTimeout(() => {
          setStep(showBento ? 'bento' : 'playground');
          setActiveTab('create');
        }, 300);
      }

    } catch (error: any) {
      if (timer) clearInterval(timer);
      console.error('Brand load error', error);
      // If loading failed due to forbidden, clear stale localStorage
      if (error.message?.includes('Forbidden')) {
        clearLastUsedBrandId(userId);
      }
      showToast(error.message || t('toast.errorLoading'), 'error');

      // If user has other brands, try to load the first one instead of showing onboarding
      if (userBrands && userBrands.length > 0) {
        const fallbackBrand = userBrands.find(b => b.id !== id); // Try a different brand
        if (fallbackBrand) {
          console.log('🔄 Trying fallback brand:', fallbackBrand.name);
          loadBrandById(fallbackBrand.id, false, true);
          return;
        }
      }

      setStep('url'); // No other brands available - show onboarding
    }
  };

  // Switch to a different brand
  const switchBrand = (brand: BrandSummary) => {
    if (brand.id === selectedBrandId) return;
    loadBrandById(brand.id, false); // Don't show bento when switching
  };

  useEffect(() => {
    if (!brandId) return;

    let cancelled = false;
    const fetchBrand = async () => {
      setStep('analyzing');
      setStatusMessage(t('status.loadingBrand'));

      // Simulate initial progress
      setProgress(5);
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      try {
        const response = await fetch(`/api/brand/${brandId}`);
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Impossible de charger la marque');
        }
        if (cancelled) return;

        clearInterval(timer);
        setProgress(100);
        hydrateBrand(data.brand);
        setSelectedBrandId(parseInt(brandId));
        setLastUsedBrandId(parseInt(brandId), userId);

        // Small delay to show 100% before switching
        setTimeout(() => {
          setStep('bento');
          setActiveTab('create');
        }, 500);

      } catch (error: any) {
        if (!cancelled) {
          clearInterval(timer);
          console.error('Brand load error', error);
          showToast(error.message || 'Error loading', 'error');
          setStep('url');
        }
      }
    };

    fetchBrand();
    return () => {
      cancelled = true;
    };
  }, [brandId, showToast]);

  // Auto-analyze if URL came from Hero
  useEffect(() => {
    if (analyzeUrl && !brandId) {
      setWebsiteUrl(analyzeUrl);
      // Small delay to ensure state is set, then trigger analysis
      const timer = setTimeout(() => {
        handleAnalyzeBrandWithUrl(analyzeUrl);
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyzeUrl, brandId]);

  // Cycle through loading stages during analysis
  useEffect(() => {
    if (step !== 'analyzing') {
      setLoadingStage(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingStage((prev) => {
        // Cycle through stages based on progress
        const targetStage = Math.min(
          Math.floor((progress / 100) * LOADING_STAGES.length),
          LOADING_STAGES.length - 1
        );
        // Smooth transition: only go forward, never backward
        return Math.max(prev, targetStage);
      });
    }, 2500); // Change stage every 2.5s

    return () => clearInterval(interval);
  }, [step, progress, LOADING_STAGES.length]);

  const handleAnalyzeBrandWithUrl = async (urlToAnalyze: string) => {
    let url = urlToAnalyze.trim();
    if (!url) return;

    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    setStep('analyzing');
    setStatus('preparing');
    setStatusMessage('Nous scannons votre site...');

    setProgress(5);
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const increment = prev < 50 ? Math.random() * 5 : Math.random() * 2;
        return prev + increment;
      });
    }, 800);

    // Show notification after 10 seconds
    const notificationTimer = setTimeout(() => {
      showToast(t('toast.scrapingInProgress'), 'info');
    }, 10000);

    // Retry logic for failed scrapes
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          setStatusMessage(`Nouvelle tentative (${attempt}/${maxRetries})...`);
          setProgress(10); // Reset progress for retry
        }

        const response = await fetch('/api/brand/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            socialLinks: [],
            otherLinks: []
          })
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Analyse impossible');
        }

        clearInterval(timer);
        clearTimeout(notificationTimer);
        setProgress(100);
        hydrateBrand(data.brand);
        setStatus('idle');

        // If brand already exists for this user, skip onboarding and go to bento
        if (data.isUpdate && data.brand?.id) {
          setTimeout(() => {
            setSelectedBrandId(data.brand.id);
            setStep('bento');
            showToast(t('toast.brandAlreadyExists'), 'info');
            notify.brandReady(data.brand?.name, locale); // Browser notification
          }, 300);
          return; // Success! Exit the retry loop
        }

        // Show light scrape notice if applicable (daily quota reached)
        const wasLightScrape = data.wasLightScrape || data.brand?.scrapeDepth === 'light';

        setTimeout(() => {
          setStep('logo-confirm');
          if (wasLightScrape) {
            // Light scrape: show info message
            showToast(locale === 'fr'
              ? 'Analyse rapide effectuée. Passez Pro pour une analyse approfondie.'
              : 'Quick analysis done. Upgrade to Pro for a deeper analysis.',
              'info'
            );
          } else if (data.brand?.logo) {
            showToast('Logo détecté !', 'success');
          } else {
            showToast('Analyse terminée — uploadez votre logo', 'info');
          }
          // Browser notification with sound
          notify.brandReady(data.brand?.name, locale);
        }, 500);

        return; // Success! Exit the retry loop

      } catch (error: any) {
        lastError = error;
        console.error(`Analyze attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // All retries failed
    clearInterval(timer);
    clearTimeout(notificationTimer);
    console.error('All analyze attempts failed:', lastError);
    setStatus('error');
    setStep('url');
    showToast(lastError?.message || 'Impossible d\'analyser ce site après plusieurs tentatives', 'error');
  };

  const handleAnalyzeBrand = async () => {
    const url = websiteUrl.trim();
    if (!url) return;

    setStep('analyzing');
    setStatus('preparing');
    setStatusMessage('Nous scannons votre site...');

    // Simulate progress for analysis
    setProgress(5);
    const timer = setInterval(() => {
      setProgress((prev) => {
        // Slow down as we get closer to 90%
        if (prev >= 90) return prev;
        const increment = prev < 50 ? Math.random() * 5 : Math.random() * 2;
        return prev + increment;
      });
    }, 800);

    // Show notification after 10 seconds
    const notificationTimer = setTimeout(() => {
      showToast(t('toast.scrapingInProgress'), 'info');
    }, 10000);

    // Retry logic for failed scrapes
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          setStatusMessage(`Nouvelle tentative (${attempt}/${maxRetries})...`);
          setProgress(10);
        }

        const response = await fetch('/api/brand/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            socialLinks: socialLinks.filter(Boolean),
            otherLinks: otherLinks.split(',').map(l => l.trim()).filter(Boolean)
          })
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Analyse impossible');
        }

        clearInterval(timer);
        clearTimeout(notificationTimer);
        setProgress(100);
        hydrateBrand(data.brand);
        setStatus('idle');

        // If brand already exists for this user, skip onboarding and go to bento
        if (data.isUpdate && data.brand?.id) {
          setTimeout(() => {
            setSelectedBrandId(data.brand.id);
            setStep('bento');
            showToast(t('toast.brandAlreadyExists'), 'info');
          }, 300);
          return; // Success!
        }

        setTimeout(() => {
          setStep('logo-confirm');
          if (data.brand?.logo) {
            showToast('Logo détecté !', 'success');
          } else {
            showToast('Analyse terminée — uploadez votre logo', 'info');
          }
        }, 500);

        return; // Success!

      } catch (error: any) {
        lastError = error;
        console.error(`Analyze attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // All retries failed
    clearInterval(timer);
    clearTimeout(notificationTimer);
    console.error('All analyze attempts failed:', lastError);
    setStatus('error');
    setStep('url');
    showToast(lastError?.message || 'Impossible d\'analyser ce site après plusieurs tentatives', 'error');
  };

  // Check if user is new (no previous generations)
  const isNewUser = useCallback(() => {
    if (typeof window === 'undefined') return false;
    try {
      const data = localStorage.getItem('palette_generations');
      const generations = data ? JSON.parse(data) : [];
      return !Array.isArray(generations) || generations.length === 0;
    } catch {
      return true;
    }
  }, []);

  // Helper: Filter out useless industry meta-stats
  const isUsefulInsight = (text: string): boolean => {
    const lower = text.toLowerCase();
    const badPatterns = [
      'market is forecasted', 'market will reach', 'market grew', 'market growth',
      'market is projected', 'projected to reach', 'is projected to',
      'industry worth', 'industry will', 'industry is projected',
      'billion', 'trillion', 'usd ', ' usd', 'eur ', ' eur',
      '$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8', '$9',
      'cagr', 'rising at', 'growth rate', 'compound annual',
      'the global', 'the saas', 'the software', 'the market', 'the industry',
      'organizations will adopt', 'companies will', 'enterprises will',
      'by 2025', 'by 2026', 'by 2027', 'by 2028', 'by 2029', 'by 2030', 'by 2031', 'by 2032',
      'food safety', 'quality control market'
    ];
    return !badPatterns.some(p => lower.includes(p));
  };

  // Build a smart prompt from the RICH bento data (pain points, competitors, trends)
  // IMPORTANT: Keep briefs simple and direct - no forced marketing formulas
  const buildSmartWelcomePrompt = useCallback((brand: any): { brief: string; templateId: TemplateId } | null => {
    const rawInsights = Array.isArray(brand.industryInsights) ? brand.industryInsights : [];
    // Filter out garbage market stats
    const insights = rawInsights.filter((i: any) => {
      const text = i.painPoint || i.fact || i.didYouKnow || '';
      return isUsefulInsight(text);
    });
    const contentNuggets = brand.contentNuggets || {};
    const features = brand.features || [];
    const brandName = brand.name || 'nous';

    // Priority 1: Pain point - use DIRECT text, no marketing transformation
    let mainPainPoint: string | null = null;

    // Source 1: industryInsights with type 'pain_point' (already filtered)
    const painPointInsight = insights.find((i: any) => i.type === 'pain_point' && i.painPoint);
    if (painPointInsight?.painPoint) {
      mainPainPoint = painPointInsight.painPoint;
    }

    // Source 2: contentNuggets.painPoints (from Firecrawl search) - filter garbage
    if (!mainPainPoint && contentNuggets.painPoints && contentNuggets.painPoints.length > 0) {
      const validPainPoints = contentNuggets.painPoints.filter((p: any) => {
        const text = typeof p === 'string' ? p : p.point || p.problem || '';
        return isUsefulInsight(text);
      });
      if (validPainPoints.length > 0) {
        const firstPain = validPainPoints[0];
        mainPainPoint = typeof firstPain === 'string' ? firstPain : firstPain.point || firstPain.problem;
      }
    }

    // Source 3: brand.painPoints (direct)
    if (!mainPainPoint && brand.painPoints && brand.painPoints.length > 0) {
      mainPainPoint = brand.painPoints[0];
    }

    if (mainPainPoint) {
      // Use the pain point DIRECTLY - let the AI do the creative work
      return {
        brief: mainPainPoint,
        templateId: 'stat'
      };
    }

    // Priority 2: Trend (use directly)
    const trend = insights.find((i: any) => i.type === 'trend' && i.painPoint);
    if (trend?.painPoint) {
      return {
        brief: trend.painPoint,
        templateId: 'announcement'
      };
    }

    // Priority 3: Competitor positioning
    const competitor = insights.find((i: any) => i.type === 'competitive');
    if (competitor?.painPoint) {
      return {
        brief: competitor.painPoint,
        templateId: 'expert'
      };
    }

    // Priority 4: Real stat
    const realStats = contentNuggets.realStats || [];
    if (realStats.length > 0) {
      return {
        brief: realStats[0],
        templateId: 'stat'
      };
    }

    // Priority 5: Real testimonial
    const testimonials = contentNuggets.testimonials || [];
    if (testimonials.length > 0 && testimonials[0].quote) {
      const t = testimonials[0];
      return {
        brief: `"${t.quote}" — ${t.author || (locale === 'fr' ? 'Un client satisfait' : 'A happy customer')}`,
        templateId: 'quote'
      };
    }

    // Priority 6: Feature (use directly)
    if (features.length > 0) {
      return {
        brief: features[0],
        templateId: 'product'
      };
    }

    // Priority 7: Tagline
    if (brand.tagline && brand.tagline.length > 10) {
      return {
        brief: brand.tagline,
        templateId: 'announcement'
      };
    }

    // Fallback: Generic but branded
    if (brandName && brandName !== 'nous') {
      return {
        brief: locale === 'fr'
          ? `Découvrez ${brandName}`
          : `Discover ${brandName}`,
        templateId: 'announcement'
      };
    }

    return null;
  }, [locale]);

  const handleValidateBento = async () => {
    if (!brandData) {
      showToast('Analysez ou chargez une marque avant de continuer', 'error');
      return;
    }

    setIsSavingBrand(true); // Start loading

    // SYNC images from bento: prioritize logo + relevant categories
    const labeledImages = Array.isArray(brandData.labeledImages) ? brandData.labeledImages : [];

    // Priority order for DEFAULT SELECTION (useful for visual generation)
    // High priority: logo, app_ui, product, person, texture
    // EXCLUDED from default: icon, client_logo (not useful)
    const logoImg = brandData.logo ? [brandData.logo] : [];
    const appImgs = labeledImages.filter((img: any) => img.category === 'app_ui').map((img: any) => img.url);
    const productImgs = labeledImages.filter((img: any) => img.category === 'product').map((img: any) => img.url);
    const personImgs = labeledImages.filter((img: any) => img.category === 'person').map((img: any) => img.url);
    const textureImgs = labeledImages.filter((img: any) => img.category === 'texture').map((img: any) => img.url);
    const referenceImgs = labeledImages.filter((img: any) => img.category === 'reference').map((img: any) => img.url);
    const otherImgs = labeledImages.filter((img: any) =>
      !['main_logo', 'reference', 'product', 'app_ui', 'person', 'texture', 'icon', 'client_logo'].includes(img.category)
    ).map((img: any) => img.url);

    // Priority images (exclude icons, client logos from default selection)
    const priorityImages = [...new Set([
      ...logoImg, ...appImgs, ...productImgs, ...personImgs, ...textureImgs, ...referenceImgs, ...otherImgs
    ])].filter(Boolean);

    // ALWAYS sync with bento data (not conditional)
    setUploadedImages(priorityImages.slice(0, 8));

    // Save brand state to DB to persist nuggets & edits
    try {
      await handleSaveBrand();
    } catch (e) {
      console.error("Auto-save failed", e);
      setIsSavingBrand(false); // Stop loading on error
      return; // Don't proceed if save failed
    }

    setIsSavingBrand(false); // Stop loading
    setStep('playground');
    setActiveTab('create');

    // Auto-generate visuals based on smart bento data
    const smartPrompt = buildSmartWelcomePrompt(brandData);

    // IMPORTANT: Refresh credits to get accurate isEarlyBird status
    // This ensures we have the latest data after user creation
    await refreshCredits();

    // Check if user is early bird (first 30 signups of the day)
    // Note: We need to fetch fresh data since creditsInfo might be stale
    const freshCredits = await fetch('/api/user/credits').then(r => r.json()).catch(() => null);
    const isEarlyBird = freshCredits?.credits?.isEarlyBird ?? creditsInfo?.isEarlyBird ?? false;

    console.log('🐦 Early bird check:', { isEarlyBird, hasReceivedFreeGen, freshCredits: freshCredits?.credits?.isEarlyBird, cachedCredits: creditsInfo?.isEarlyBird });

    // Only give free generation if: early bird + has images + hasn't already received one
    if (smartPrompt && priorityImages.length > 0 && isEarlyBird && !hasReceivedFreeGen) {
      // Mark as received BEFORE triggering to prevent double triggers
      setHasReceivedFreeGen(true);

      // Early bird gets 1 FREE auto-generation
      setBrief(smartPrompt.brief);
      setSelectedTemplate(smartPrompt.templateId);

      // Show gift overlay instead of simple toast
      setShowGiftOverlay(true);

      // Small delay to let UI update and show the gift
      setTimeout(() => {
        handleGenerate(smartPrompt.brief, false, brandData, priorityImages.slice(0, 6), undefined, 1); // 1 image only
      }, 1500); // Longer delay to let user see the gift message
    } else if (smartPrompt && priorityImages.length > 0) {
      // Not early bird - just set up the prompt, user triggers manually
      setBrief(smartPrompt.brief);
      setSelectedTemplate(smartPrompt.templateId);
      showToast(
        locale === 'fr'
          ? '✨ Cliquez sur Générer pour créer votre premier visuel !'
          : '✨ Click Generate to create your first visual!',
        'success'
      );
    } else {
      // No good data - show helpful message
      showToast(
        locale === 'fr'
          ? 'Décrivez ce que vous voulez communiquer'
          : 'Describe what you want to communicate',
        'info'
      );
    }
  };

  // Handle rescrape for paid users who had a light scrape
  const handleRescrape = async () => {
    if (!brandData?.id) {
      showToast('Brand ID manquant', 'error');
      return;
    }

    try {
      setStep('analyzing');
      setStatus('preparing');
      setStatusMessage(locale === 'fr' ? 'Analyse approfondie en cours...' : 'Deep analyzing...');

      const response = await fetch(`/api/brand/${brandData.id}/rescrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Rescrape failed');
      }

      if (data.alreadyDeep) {
        showToast(locale === 'fr' ? 'Cette marque est déjà analysée en profondeur' : 'This brand is already deeply analyzed', 'info');
        setStep('bento');
        return;
      }

      // Update brand data with new deep analysis
      hydrateBrand(data.brand);
      setStep('bento');
      showToast(locale === 'fr' ? 'Analyse approfondie terminée !' : 'Deep analysis complete!', 'success');

    } catch (error: any) {
      console.error('Rescrape error:', error);
      showToast(error.message || 'Erreur lors de l\'analyse', 'error');
      setStep('bento');
    } finally {
      setStatus('idle');
    }
  };

  const handleSaveBrand = async () => {
    if (!brandData) {
      showToast('Aucune marque à sauvegarder', 'error');
      return;
    }

    try {
      const response = await fetch('/api/brand/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: { ...brandData, backgrounds } })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Sauvegarde impossible');
      }

      // IMPORTANT: Update brandData with the ID returned from DB
      if (data.brandId && !brandData.id) {
        console.log(`✅ Assigning brand ID: ${data.brandId}`);
        setBrandData((prev: any) => ({ ...prev, id: data.brandId }));
        setSelectedBrandId(data.brandId);
      }

      showToast(t('toast.brandSaved'), 'success');
    } catch (error: any) {
      console.error('Save brand error', error);
      showToast(error.message || t('toast.errorSaving'), 'error');
    }
  };

  // Change tag of an image (from BRAND VISUALS inline dropdown)
  const handleChangeImageTag = (imageUrl: string, newTag: string) => {
    setBrandData((prev: any) => {
      if (!prev) return prev;
      const existingLabeled = Array.isArray(prev.labeledImages) ? prev.labeledImages : [];
      const existingIndex = existingLabeled.findIndex((li: any) => li.url === imageUrl);

      let updatedLabeled;
      if (existingIndex >= 0) {
        updatedLabeled = [...existingLabeled];
        updatedLabeled[existingIndex] = { ...updatedLabeled[existingIndex], category: newTag };
      } else {
        updatedLabeled = [...existingLabeled, { url: imageUrl, category: newTag }];
      }

      return { ...prev, labeledImages: updatedLabeled };
    });
    setTagDropdownOpen(null); // Close dropdown after selection
  };

  // Close tag dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      if (tagDropdownOpen) setTagDropdownOpen(null);
    };
    if (tagDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [tagDropdownOpen]);

  const addImagesToState = (urls: string[], label = 'other') => {
    if (!urls || urls.length === 0) return;

    setUploadedImages((prev) => {
      const merged = Array.from(new Set([...prev, ...urls]));
      return merged.slice(0, 12);
    });

    setBrandData((prev: any) => {
      if (!prev) return prev;
      const existingImages = Array.isArray(prev.images) ? prev.images : [];
      const mergedImages = mergeUniqueStrings(existingImages, urls);
      const existingLabeled = Array.isArray(prev.labeledImages) ? prev.labeledImages : [];
      const filteredLabeled = existingLabeled.filter((item: any) => !urls.includes(item.url));
      const labeledToAppend = urls.map((url) => ({
        url,
        category: label,
        description: label === 'other' ? 'Uploaded manually' : label
      }));
      return {
        ...prev,
        images: mergedImages,
        labeledImages: [...filteredLabeled, ...labeledToAppend]
      };
    });
  };

  const processFiles = (files: FileList | null, label = 'other') => {
    if (!files || !files.length) return;
    Array.from(files).forEach((file) => {
      // Automatic GIF to PNG conversion
      if (file.type === 'image/gif') {
        convertGifToPng(file)
          .then((pngDataUrl) => {
            addImagesToState([pngDataUrl], label);
            showToast(t('toast.gifConverted'), 'success');
          })
          .catch((err) => {
            console.error('GIF conversion error:', err);
            showToast(t('toast.gifConversionError'), 'error');
          });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          addImagesToState([event.target.result], label);
          showToast('Image ajoutée', 'success');
        }
      };
      reader.onerror = () => {
        console.error(`Failed to read file: ${file.name}`);
        showToast(t('toast.errorLoadingImage'), 'error');
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
    event.target.value = '';
  };

  const handleSourceUpload = (event: ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files, newUploadLabel);
    event.target.value = '';
  };

  // Handle logo upload from the confirmation step
  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);

    // Automatic GIF to PNG conversion for Logos
    if (file.type === 'image/gif') {
      convertGifToPng(file)
        .then((logoDataUrl) => {
          if (logoDataUrl) {
            setBrandData((prev: any) => {
              if (!prev) return prev;
              const existingLabeled = Array.isArray(prev.labeledImages) ? prev.labeledImages : [];
              const filteredLabeled = existingLabeled.filter((img: any) => img.category !== 'main_logo');
              return {
                ...prev,
                logo: logoDataUrl,
                labeledImages: [
                  { url: logoDataUrl, category: 'main_logo', description: 'Brand logo (converted from GIF)' },
                  ...filteredLabeled
                ]
              };
            });
            showToast(t('toast.gifLogoConverted'), 'success');
          }
          setIsUploadingLogo(false);
        })
        .catch((err) => {
          console.error('Logo GIF conversion error:', err);
          showToast(t('toast.errorConversion'), 'error');
          setIsUploadingLogo(false);
        });
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const logoDataUrl = e.target?.result as string;
      if (logoDataUrl) {
        // Update brandData with the new logo
        setBrandData((prev: any) => {
          if (!prev) return prev;

          // Update labeledImages: remove old main_logo entries, add new one
          const existingLabeled = Array.isArray(prev.labeledImages) ? prev.labeledImages : [];
          const filteredLabeled = existingLabeled.filter((img: any) => img.category !== 'main_logo');

          return {
            ...prev,
            logo: logoDataUrl,
            labeledImages: [
              { url: logoDataUrl, category: 'main_logo', description: 'Brand logo (confirmed by user)' },
              ...filteredLabeled
            ]
          };
        });

        showToast('Logo mis à jour !', 'success');
      }
      setIsUploadingLogo(false);
    };
    reader.onerror = () => {
      showToast(t('toast.errorLoadingLogo'), 'error');
      setIsUploadingLogo(false);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  // Confirm logo and proceed to bento
  const handleConfirmLogo = async () => {
    if (!brandData) return;

    setIsConfirmingLogo(true);

    // Mark logo as confirmed in labeledImages
    setBrandData((prev: any) => {
      if (!prev) return prev;

      const existingLabeled = Array.isArray(prev.labeledImages) ? prev.labeledImages : [];
      const updatedLabeled = existingLabeled.map((img: any) => {
        if (img.category === 'main_logo') {
          return { ...img, confirmed: true };
        }
        return img;
      });

      // If no main_logo exists but we have a logo URL, add it
      if (!updatedLabeled.some((img: any) => img.category === 'main_logo') && prev.logo) {
        updatedLabeled.unshift({
          url: prev.logo,
          category: 'main_logo',
          description: 'Brand logo (confirmed by user)',
          confirmed: true
        });
      }

      return { ...prev, labeledImages: updatedLabeled };
    });

    // Save the brand with the confirmed logo
    try {
      const response = await fetch('/api/brand/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: { ...brandData, logoConfirmed: true } })
      });

      const data = await response.json();
      if (data.success && data.brandId) {
        setBrandData((prev: any) => ({ ...prev, id: data.brandId }));
        showToast(t('toast.brandSaved'), 'success');
      }
    } catch (error) {
      console.error('Error saving brand:', error);
      // Continue anyway - we'll try to save later
    }

    // Proceed to bento grid
    setStep('bento');
    setIsConfirmingLogo(false);
  };

  const fetchAndMergeSource = async (url: string) => {
    const response = await fetch('/api/source/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Impossible d\'ajouter la source');
    }

    const images = Array.isArray(data.data?.images) ? data.data.images : [];
    if (images.length) {
      addImagesToState(images);
    }

    setBrandData((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        features: mergeUniqueStrings(prev.features || [], data.data?.features || []),
        keyPoints: mergeUniqueStrings(prev.keyPoints || [], data.data?.keyPoints || [])
      };
    });
  };

  const handleAddSourceRequest = async () => {
    const url = sourceUrl.trim();
    if (!url) return;

    setIsAddingSource(true);
    try {
      await fetchAndMergeSource(url);
      setSourceUrl('');
      setSourceTab('library');
      showToast('Source ajoutée', 'success');
    } catch (error: any) {
      console.error('Add source error', error);
      showToast(error.message || t('toast.errorAdding'), 'error');
    } finally {
      setIsAddingSource(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMagicEnhance = () => {
    if (!brief.trim() || isThinking) return;
    setIsThinking(true);
    const brandHints = [
      brandData?.values?.[0],
      brandData?.toneVoice?.[0],
      brandData?.marketingAngles?.[0]?.title
    ]
      .filter(Boolean)
      .join(' • ');
    const enhancement = brandHints
      ? `Accent sur ${brandHints}`
      : 'Ajoute une lumière éditoriale premium, reflets doux, textures magazine';
    setBrief((prev) => `${prev.trim()}

${enhancement}`);
    setTimeout(() => setIsThinking(false), 400);
    showToast('Prompt enrichi', 'success');
  };

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);

  // DEDICATED IMAGE EDIT FUNCTION - bypasses Creative Director for direct edits
  const handleEditImage = async (
    imageToEdit: string,
    editInstruction: string,
    styleReferences: string[] = []
  ) => {
    if (!editInstruction.trim()) {
      showToast('Ajoutez une instruction de modification', 'error');
      return;
    }

    setStatus('preparing');
    setStatusMessage('✏️ Modification en cours...');
    setProgress(20);

    try {
      // Build a simple, direct edit prompt
      // The image to edit goes FIRST, then style refs
      const allImages = [imageToEdit, ...styleReferences];

      // Detect if user is asking to replace/fix the logo and has uploaded one
      const isLogoReplacement = styleReferences.length > 0 &&
        (editInstruction.toLowerCase().includes('logo') ||
          editInstruction.toLowerCase().includes('remplace') ||
          editInstruction.toLowerCase().includes('utilise') ||
          editInstruction.toLowerCase().includes('mets ce') ||
          editInstruction.toLowerCase().includes('met ce'));

      // Construct edit prompt with clear instructions
      let editPrompt: string;

      if (isLogoReplacement) {
        // SPECIAL CASE: User wants to replace logo with their uploaded image
        editPrompt = `[IMAGE EDIT - LOGO REPLACEMENT]
Image 1: The base image. This contains a logo that needs to be REPLACED.
Image 2: THIS IS THE CORRECT LOGO TO USE. Copy it EXACTLY as shown - same colors, same proportions, same design.

CRITICAL INSTRUCTION: ${editInstruction}

Replace the logo in Image 1 with the EXACT logo from Image 2. The new logo must be:
- Identical to Image 2 (no distortions, no color changes)
- Positioned in the same location as the original logo
- Properly sized to fit the composition
- Sharp and clear

Keep EVERYTHING else in Image 1 unchanged (background, products, text, layout).`;
      } else {
        // STANDARD EDIT: General modifications
        editPrompt = `[IMAGE EDIT REQUEST]
Image 1: The base image to modify. Keep its core composition.
${styleReferences.length > 0 ? `Images 2-${styleReferences.length + 1}: Visual references - use their style/elements as guidance.` : ''}

EDIT INSTRUCTION: ${editInstruction}

Apply the edit instruction to Image 1 while preserving what wasn't mentioned. Focus on the specific change requested.`;
      }

      console.log('✏️ Direct image edit:', {
        baseImage: imageToEdit.slice(0, 50) + '...',
        styleRefs: styleReferences.length,
        instruction: editInstruction,
        isLogoReplacement: isLogoReplacement
      });

      setProgress(40);
      setStatusMessage('🎨 Génération de la variante...');

      // Send directly to generate API - NO Creative Director
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editPrompt,
          negativePrompt: 'blurry, low quality, watermark, distorted',
          imageUrls: allImages, // Base image first, then style refs
          referenceImages: styleReferences, // Also mark them as style refs
          numImages: 1, // 1 credit = 1 image
          aspectRatio,
          resolution
        })
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Échec de la modification');
      }

      setProgress(80);

      const rawImages: GeneratedImage[] = (payload.images || [])
        .map((img: any, index: number) => {
          const url = typeof img === 'string' ? img : img?.url || img?.image;
          if (!url) return null;
          return {
            id: `edit-${createId()}-${index}`,
            url,
            aspectRatio: aspectRatio // Always use user-selected ratio
          };
        })
        .filter(Boolean) as GeneratedImage[];

      if (!rawImages.length) {
        throw new Error('Aucune image modifiée retournée');
      }

      // Upload to Vercel Blob to avoid localStorage quota issues
      setStatusMessage('📤 Sauvegarde...');
      const uploadedImages = await Promise.all(
        rawImages.map(async (img) => {
          if (img.url.startsWith('data:')) {
            try {
              const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageData: img.url })
              });
              const uploadResult = await uploadResponse.json();
              if (uploadResult.success && uploadResult.url) {
                console.log('✅ Edit uploaded to Blob:', uploadResult.url.slice(0, 50) + '...');
                return { ...img, url: uploadResult.url };
              } else {
                console.error('❌ Blob upload failed:', uploadResult.error);
                return { ...img, skipSave: true };
              }
            } catch (e) {
              console.error('❌ Blob upload error:', e);
              return { ...img, skipSave: true };
            }
          }
          return img;
        })
      );

      const normalized = uploadedImages as (GeneratedImage & { skipSave?: boolean })[];

      // Save to local generations - only successfully uploaded images
      const generationsToSave = normalized
        .filter(img => !img.skipSave)
        .map(img => ({
          url: img.url,
          prompt: `[EDIT] ${editInstruction}`,
          brandId: brandData?.id || undefined,
          brandName: brandData?.name,
          aspectRatio: img.aspectRatio || aspectRatio, // Save the ratio used
        }));

      if (generationsToSave.length > 0) {
        await addGenerations(generationsToSave);
      }
      window.dispatchEvent(new Event('generations-updated'));

      setGeneratedImages((prev) => [...normalized, ...prev].slice(0, 16));
      setStatus('complete');
      setProgress(100);
      showToast('Variante générée !', 'success');
      notify.visualReady(normalized.length, locale); // Browser notification with sound

    } catch (error: any) {
      console.error('Edit error:', error);
      setStatus('error');
      showToast(error.message || t('toast.errorEditing'), 'error');
    } finally {
      setTimeout(() => {
        setStatus('idle');
        setProgress(0);
      }, 1200);
    }
  };

  /* 
   * DIVERSITY MODES (Client-side replication of server logic)
   * Used when we have to generate multiple images from a single prompt (Fallback)
   */
  const MODE_FAITHFUL = `
[GENERATION MODE: FAITHFUL]
- Stay close to the provided assets and references
- Reproduce UI screenshots and diagrams as accurately as possible
- Maintain the exact layout and structure shown in references
- Be precise with brand elements`;

  const MODE_CREATIVE = `
[GENERATION MODE: CREATIVE INTERPRETATION]
- Take more artistic liberty while respecting the brand
- Simplify complex diagrams into cleaner, more impactful visuals
- Reinterpret UI elements in a fresh, modern way
- Add creative flair while keeping the core message
- Make it visually striking and scroll-stopping`;

  const handleGenerate = async (
    customPrompt?: string,
    useCurrentBrief = true,
    brandOverride?: any,
    referenceOverride?: string[],
    templateOverride?: TemplateId,
    numImagesToGenerate: number = 1 // Default to 1 image (1 credit = 1 image)
  ) => {
    const finalPrompt = (customPrompt && customPrompt.trim()) || (useCurrentBrief ? brief.trim() : '');
    if (!finalPrompt) {
      showToast('Ajoutez un brief avant de générer', 'error');
      return;
    }

    const references = referenceOverride && referenceOverride.length > 0 ? referenceOverride : uploadedImages;
    // Note: It's possible to generate without references if it's a text-only generation, but usually we enforce it.
    // Keeping existing check:
    if (!references.length) {
      showToast('Sélectionnez au moins une image source', 'error');
      return;
    }

    const targetBrand = brandOverride || brandData;
    const targetTemplate = templateOverride || selectedTemplate;

    if (!targetBrand) {
      showToast('Analysez d\'abord une marque', 'error');
      return;
    }

    // Create a unique job ID for EACH image we want to generate
    const jobIds = Array.from({ length: numImagesToGenerate }, () =>
      `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    );

    const newJobs: GenerationJob[] = jobIds.map(id => ({
      id,
      brief: finalPrompt.substring(0, 50) + (finalPrompt.length > 50 ? '...' : ''),
      status: 'preparing',
      progress: 5,
      statusMessage: '🎨 Le Creative Director analyse votre brief...',
      timestamp: Date.now(),
      aspectRatio: aspectRatio // Store ratio for the skeleton loader
    }));

    setGenerationQueue(prev => [...prev, ...newJobs]);

    // Helper function to update a specific job's progress
    const updateJob = (id: string, updates: Partial<GenerationJob>) => {
      setGenerationQueue(prev =>
        prev.map(job => job.id === id ? { ...job, ...updates } : job)
      );
    };

    // Helper to update ALL jobs in this batch (e.g. during CD phase)
    const updateAllThisBatch = (updates: Partial<GenerationJob>) => {
      setGenerationQueue(prev =>
        prev.map(job => jobIds.includes(job.id) ? { ...job, ...updates } : job)
      );
    };

    // Keep legacy status for backwards compatibility (show as running if any job is active)
    setStatus('preparing');
    setStatusMessage('🎨 Le Creative Director analyse votre brief...');
    setProgress(10);

    try {
      // ==========================================================================================
      // STEP 1: Call Creative Director API to get prompt variations + smart image selection
      // (We do this once for the whole batch)
      // ==========================================================================================
      let promptVariations: string[] | null = null;
      let finalGenerationPrompt: string = finalPrompt;
      let negativePrompt: string = 'blurry, low quality, watermark, amateur, generic stock photo, clipart';
      let smartImageSelection: string[] | null = null;
      let styleReferenceImages: string[] = [];
      let imageContextMap: Record<string, string> = {};

      try {
        // Load feedback patterns to personalize generation
        const feedbackPatterns = loadFeedbackPatterns();

        const cdResponse = await fetch('/api/creative-director', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brief: finalPrompt,
            brand: targetBrand,
            templateId: targetTemplate || undefined,
            language: contentLanguage,
            aspectRatio, // Pass the selected ratio to adapt composition
            feedbackPatterns: feedbackPatterns.likedKeywords.length > 0 || feedbackPatterns.dislikedKeywords.length > 0
              ? feedbackPatterns
              : undefined
          })
        });

        const cdData = await cdResponse.json();

        if (cdResponse.ok && cdData.success && cdData.concept) {
          finalGenerationPrompt = cdData.concept.finalPrompt;
          promptVariations = cdData.concept.promptVariations || null;
          negativePrompt = cdData.concept.negativePrompt || negativePrompt;

          // Use smart image selection if provided
          if (cdData.concept.imageSelection?.priority?.length > 0) {
            smartImageSelection = cdData.concept.imageSelection.priority;
            if (cdData.concept.imageSelection.imageRoles) {
              imageContextMap = cdData.concept.imageSelection.imageRoles;
            }
            console.log('🎯 Smart image selection:', cdData.concept.imageSelection.priority.length, 'images');

            // SYNC: Update uploadedImages so user sees what will be used
            // Only if user hasn't manually selected images (beyond just logo)
            const hasOnlyLogoOrEmpty = references.length === 0 ||
              (references.length === 1 && references[0] === targetBrand?.logo);

            if (hasOnlyLogoOrEmpty && smartImageSelection && smartImageSelection.length > 0) {
              // Add the smartly selected images to uploadedImages for visibility
              const imagesToShow = [targetBrand?.logo, ...smartImageSelection].filter(Boolean) as string[];
              setUploadedImages([...new Set(imagesToShow)].slice(0, 6));
              console.log('📍 Synced smart selection to uploadedImages for visibility');
            }
          }

          // Extract reference images for style guidance (only if user hasn't manually selected any)
          if (cdData.concept.imageSelection?.references?.length > 0 && styleRefImages.length === 0) {
            styleReferenceImages = cdData.concept.imageSelection.references;
            console.log('🎨 Auto-detected reference visuals for style:', styleReferenceImages.length);
          }

          console.log('🎬 Creative Director:', promptVariations ? `${promptVariations.length} variations` : 'single prompt');
          console.log('🚫 Negative prompt:', negativePrompt.substring(0, 50) + '...');

          updateAllThisBatch({ progress: 30, statusMessage: t('status.creating') });
          setProgress(30);
          setStatusMessage(t('status.creating'));
        } else {
          console.warn('Creative Director fallback:', cdData.error);
          finalGenerationPrompt = buildFallbackPrompt(finalPrompt, targetBrand);
        }
      } catch (cdError) {
        console.warn('Creative Director error, using fallback:', cdError);
        finalGenerationPrompt = buildFallbackPrompt(finalPrompt, targetBrand);
      }

      updateAllThisBatch({ progress: 40 });
      setProgress(40);

      // ========================================
      // STEP 2: Prepare Images & Context
      // ========================================

      const imagesToUse: string[] = [];

      // 1. LOGO FIRST - Always include and protect it
      console.log('🔍 LOGO DEBUG - handleGenerate:');
      console.log(`   targetBrand?.logo exists: ${!!targetBrand?.logo}`);

      if (targetBrand?.logo) {
        imagesToUse.push(targetBrand.logo);
        imageContextMap[targetBrand.logo] = "BRAND_LOGO (CRITICAL): This is the official brand logo. Display it clearly and prominently. DO NOT distort, warp, or modify it in any way. It must remain perfectly legible.";
        console.log('✅ Logo added to imagesToUse and imageContextMap');
      }

      // 2. USER SELECTION IS PRIORITY - Add all user-selected images (except logo already added)
      for (const img of references) {
        if (!imagesToUse.includes(img)) {
          imagesToUse.push(img);

          // Find label from brandData to give Fal context
          const labelObj = targetBrand?.labeledImages?.find((li: any) => li.url === img);
          const category = labelObj?.category || 'other';

          // Get reproduction mode for this asset (default: app_ui = exact, others = inspire)
          const mode = assetModes[img] || (category === 'app_ui' ? 'exact' : 'inspire');
          const modeInstruction = mode === 'exact'
            ? '[REPRODUCE EXACTLY - Copy this image as-is, do not modify or reinterpret]'
            : '[CAN REINTERPRET - Use as inspiration, feel free to recreate in the brand style]';

          // Assign context based on label + reproduction mode
          if (!imageContextMap[img]) {
            switch (category) {
              case 'main_logo':
                imageContextMap[img] = "BRAND_LOGO (CRITICAL): Official logo. DO NOT distort.";
                break;
              case 'product':
                imageContextMap[img] = `PRODUCT_IMAGE: Hero product visual. ${modeInstruction}`;
                break;
              case 'app_ui':
                imageContextMap[img] = `APP_SCREENSHOT: Product interface. ${modeInstruction}`;
                break;
              case 'person':
              case 'team':
                imageContextMap[img] = `PERSON_IMAGE: Human element. ${modeInstruction}`;
                break;
              case 'client_logo':
                imageContextMap[img] = "CLIENT_LOGO: Customer/partner logo. Can be shown smaller.";
                break;
              case 'texture':
                imageContextMap[img] = `TEXTURE: Background element. ${modeInstruction}`;
                break;
              case 'reference':
                imageContextMap[img] = "STYLE_REFERENCE: Match this visual style and aesthetic.";
                break;
              default:
                imageContextMap[img] = `SUPPORTING_VISUAL: ${modeInstruction}`;
            }
          }
        }
      }

      console.log('📸 Images to use (user priority):', imagesToUse.length, 'images');

      // ==========================================================================================
      // STYLE REFERENCES - Only for artistic guidance, NEVER affects logo/content
      // Priority: User-selected style refs > Auto-detected style refs
      // ==========================================================================================
      if (styleRefImages.length > 0) {
        const styleRefUrls = styleRefImages.map(ref => ref.url);
        // User manually selected style refs from gallery - use ONLY these (ignore auto-detected)
        styleReferenceImages = styleRefUrls;
        console.log(`🎨 Using ${styleRefImages.length} user-selected style references (ignoring auto-detected)`);

        // Build style notes for the prompt
        const styleNotes = styleRefImages
          .filter(ref => ref.note?.trim())
          .map((ref, i) => `Style ref ${i + 1}: "${ref.note}"`)
          .join('. ');

        if (styleNotes) {
          // Append style notes to the brief
          finalGenerationPrompt += `\n\n[USER STYLE NOTES: ${styleNotes}]`;
          console.log('📝 Style notes:', styleNotes);
        }
      } else if (styleReferenceImages.length > 0) {
        console.log(`🎨 Using ${styleReferenceImages.length} auto-detected style references`);
      }

      // ==========================================================================================
      // STEP 3: Determine Prompts for Parallel Requests
      // ==========================================================================================
      let promptsToRun: string[] = [];

      if (promptVariations && promptVariations.length > 0) {
        // CASE A: We have CD variations. Use them.
        // If we want more images than variations, cycle through them.
        for (let i = 0; i < numImagesToGenerate; i++) {
          promptsToRun.push(promptVariations[i % promptVariations.length]);
        }
      } else {
        // CASE B: Fallback (Single prompt). Replicate server-side diversity logic.
        // Mode 1: Faithful, Mode 2: Creative, Mode 3: Faithful, ...
        // We only append modes if we are generating multiple images from ONE prompt
        if (numImagesToGenerate > 1) {
          for (let i = 0; i < numImagesToGenerate; i++) {
            const isFaithful = i % 2 === 0; // Even = Faithful, Odd = Creative
            const suffix = isFaithful ? MODE_FAITHFUL : MODE_CREATIVE;
            promptsToRun.push(finalGenerationPrompt + "\n\n" + suffix);
          }
        } else {
          // Just 1 image? Just use the prompt as is (Faithful by default mostly)
          promptsToRun.push(finalGenerationPrompt + "\n\n" + MODE_FAITHFUL);
        }
      }

      updateAllThisBatch({ progress: 45, statusMessage: t('status.launching') });

      // ==========================================================================================
      // STEP 4: Launch Parallel Requests (Incremental Display)
      // ==========================================================================================

      const generationPromises = jobIds.map(async (jobId, index) => {
        const myPrompt = promptsToRun[index];
        updateJob(jobId, { status: 'running', progress: 50, statusMessage: t('status.generating') });

        try {
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              // KEY CHANGE: Send as 'promptVariations' (array of 1) to bypass server's 
              // auto-mode-appending logic, since we already handled diversity client-side.
              promptVariations: [myPrompt],
              negativePrompt: negativePrompt,
              imageUrls: imagesToUse,
              referenceImages: styleReferenceImages, // Style reference images
              imageContextMap: imageContextMap, // NEW: Pass explicit roles
              numImages: 1, // Generate 1 image per request
              aspectRatio,
              resolution // 2K by default, 4K for pro users
            })
          });

          const payload = await response.json();

          if (!response.ok || !payload.success) {
            throw new Error(payload.error || 'Impossible de générer des visuels');
          }

          // Handle Success for this single image
          const rawImages = (payload.images || [])
            .map((img: any) => {
              const url = typeof img === 'string' ? img : img?.url || img?.image;
              if (!url) return null;
              return {
                id: `${createId()}-${index}`,
                url,
                aspectRatio: aspectRatio // Always use user-selected ratio
              };
            })
            .filter(Boolean) as GeneratedImage[];

          if (!rawImages.length) {
            throw new Error('Aucune image retournée par le générateur');
          }

          // Upload data URLs to Vercel Blob (Parallelized inside this job)
          updateJob(jobId, { progress: 80, statusMessage: '📤 Sauvegarde...' });

          const uploadedImages = await Promise.all(
            rawImages.map(async (img) => {
              // Only upload if it's a data URL (base64)
              if (img.url.startsWith('data:')) {
                try {
                  const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageData: img.url })
                  });
                  const uploadResult = await uploadResponse.json();
                  if (uploadResult.success && uploadResult.url) {
                    console.log('✅ Image uploaded to Blob:', uploadResult.url.slice(0, 50) + '...');
                    return { ...img, url: uploadResult.url };
                  } else {
                    console.error('❌ Blob upload failed:', uploadResult.error);
                    return { ...img, url: img.url, skipSave: true }; // Mark to skip localStorage
                  }
                } catch (e) {
                  console.error('❌ Blob upload error:', e);
                  return { ...img, url: img.url, skipSave: true };
                }
              }
              return img;
            })
          );

          const normalized = uploadedImages as (GeneratedImage & { skipSave?: boolean })[];
          const validToSave = normalized.filter(img => !img.skipSave);

          // Add to global state one by one
          if (validToSave.length > 0) {
            const gensToSave = validToSave.map(img => ({
              url: img.url,
              prompt: myPrompt, // Save the specific prompt used
              templateId: selectedTemplate || undefined,
              brandId: brandData?.id || undefined,
              brandName: brandData?.name,
              aspectRatio: img.aspectRatio || aspectRatio, // Save the ratio used
            }));

            console.log('🗂️ SAVE DEBUG: Incremental save:', gensToSave.length);
            await addGenerations(gensToSave);

            // Update Credits info from the response
            if (payload.creditsRemaining !== undefined) {
              setLastCreditsRemaining(payload.creditsRemaining);
              updateCreditsRemaining(payload.creditsRemaining);

              // Show toast for low credits (optional logic)
              if (payload.plan === 'free' && payload.creditsRemaining <= 1) {
                setShowCreditsToast(true);
                setTimeout(() => setShowCreditsToast(false), 4000);
              }
            }

            // Update UI immediately for this image
            setGeneratedImages(prev => [...validToSave, ...prev].slice(0, 20));
            window.dispatchEvent(new Event('generations-updated'));
          }

          // Update Job Completion
          updateJob(jobId, {
            status: 'complete',
            progress: 100,
            statusMessage: t('common.done')
          });

          // Show Toast/Notify
          showToast(t('toast.newVisualReady'), 'success');
          notify.visualReady(1, locale);

          // Remove job from queue after delay
          setTimeout(() => {
            setGenerationQueue(prev => prev.filter(j => j.id !== jobId));
          }, 4000);

        } catch (err: any) {
          console.error(`Job ${jobId} failed:`, err);
          updateJob(jobId, { status: 'error', progress: 0, statusMessage: 'Erreur' });
          showToast(err.message || t('toast.errorGenerating'), 'error');
          setTimeout(() => {
            setGenerationQueue(prev => prev.filter(j => j.id !== jobId));
          }, 5000);
        }
      });

      // Wait for all promises to clean up global busy state
      await Promise.all(generationPromises);

      // Clean up global status only after all are done
      setStatus('idle');
      setProgress(100);
      setShowGiftOverlay(false);

    } catch (globalError: any) {
      console.error('Fatal generation error', globalError);
      // Fail all jobs
      jobIds.forEach(id => updateJob(id, { status: 'error', progress: 0, statusMessage: 'Erreur critique' }));

      setStatus('error');
      showToast(globalError.message || t('toast.errorGenerating'), 'error');

      setTimeout(() => {
        setGenerationQueue(prev => {
          const stillActive = prev.filter(job => job.status === 'preparing' || job.status === 'running');
          if (stillActive.length === 0) {
            setStatus('idle');
            setProgress(0);
          }
          return prev;
        });
      }, 2000);
    }
  };

  const renderContent = () => {
    // Loading state - checking if user has existing brands
    if (step === 'loading') {
      return (
        <div className="min-h-[85vh] flex items-center justify-center animate-fade-in">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">
              {t('common.loading')}
            </p>
          </div>
        </div>
      );
    }

    if (step === 'url') {
      return (
        <div className="min-h-[85vh] flex items-center justify-center animate-fade-in relative">
          {/* Subtle grid background */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />

          {/* Floating accent */}
          <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-amber-200/20 to-orange-300/10 rounded-full blur-3xl" />
          <div className="absolute bottom-32 left-16 w-48 h-48 bg-gradient-to-tr from-blue-200/15 to-sky-300/10 rounded-full blur-3xl" />

          <div className="relative z-10 w-full max-w-2xl mx-auto px-6">
            {/* Header with Logo */}
            <div className="mb-16">
              <div className="mb-8">
                <img src="/logo-icon.webp" alt="Palette" className="w-14 h-14 object-contain" width="56" height="56" />
              </div>

              <h1 className="text-4xl md:text-5xl font-light text-gray-900 leading-[1.1] mb-4" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {t('playground.urlStep.letsStartWith')}<br />
                <span className="font-semibold">{t('playground.urlStep.yourBrand')}</span>
              </h1>

              <p className="text-gray-400 text-lg max-w-md leading-relaxed">
                {locale === 'fr'
                  ? "On récupère votre logo, vos couleurs, votre ton — en quelques secondes. Ensuite, créez."
                  : "We extract your logo, colors, and tone — in seconds. Then, create."
                }
              </p>
            </div>

            {/* Main Input Card */}
            <div className="relative">
              {/* Decorative corner */}
              <div className="absolute -top-3 -left-3 w-6 h-6 border-l-2 border-t-2 border-gray-200" />
              <div className="absolute -bottom-3 -right-3 w-6 h-6 border-r-2 border-b-2 border-gray-200" />

              <div className="bg-white border border-gray-200 p-8 space-y-6">
                {/* Primary URL Input */}
                <div className="group">
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-2">
                    {t('playground.urlStep.mainWebsite')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="votresite.com"
                      className="w-full bg-transparent border-b-2 border-gray-200 py-4 text-xl font-light outline-none transition-all placeholder:text-gray-300 focus:border-black"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeBrand()}
                    />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expandable Additional Sources */}
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer text-sm text-gray-400 hover:text-gray-600 transition-colors list-none">
                    <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-mono text-xs uppercase tracking-wider">{t('playground.urlStep.additionalSources')}</span>
                    <span className="text-[10px] text-gray-300">({t('common.optional')})</span>
                  </summary>

                  <div className="mt-6 pt-6 border-t border-gray-100 space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-300 mb-2">
                          {t('playground.urlStep.socialNetwork1')}
                        </label>
                        <input
                          type="text"
                          placeholder="linkedin.com/company/..."
                          className="w-full bg-gray-50 border-0 py-3 px-4 text-sm outline-none focus:bg-gray-100 transition-colors"
                          value={socialLinks[0]}
                          onChange={(e) => {
                            const newLinks = [...socialLinks];
                            newLinks[0] = e.target.value;
                            setSocialLinks(newLinks);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-300 mb-2">
                          {t('playground.urlStep.socialNetwork2')}
                        </label>
                        <input
                          type="text"
                          placeholder="instagram.com/..."
                          className="w-full bg-gray-50 border-0 py-3 px-4 text-sm outline-none focus:bg-gray-100 transition-colors"
                          value={socialLinks[1]}
                          onChange={(e) => {
                            const newLinks = [...socialLinks];
                            newLinks[1] = e.target.value;
                            setSocialLinks(newLinks);
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-300 mb-2">
                        {t('playground.urlStep.otherLinks')}
                      </label>
                      <input
                        type="text"
                        placeholder="Séparés par des virgules"
                        className="w-full bg-gray-50 border-0 py-3 px-4 text-sm outline-none focus:bg-gray-100 transition-colors"
                        value={otherLinks}
                        onChange={(e) => setOtherLinks(e.target.value)}
                      />
                    </div>
                  </div>
                </details>

                {/* Action */}
                <div className="pt-6 flex items-end justify-between">
                  <p className="text-[11px] text-gray-300 max-w-[200px] leading-relaxed">
                    {t('playground.urlStep.enrichAfterAnalysis')}
                  </p>

                  <button
                    onClick={handleAnalyzeBrand}
                    disabled={!websiteUrl}
                    className="group bg-gray-900 text-white px-8 py-4 font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-blue-600"
                  >
                    <span className="flex items-center gap-3">
                      {t('playground.urlStep.scanBrand')}
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-300">
              <span className="flex items-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {t('playground.urlStep.secureData')}
              </span>
              <span className="w-1 h-1 bg-gray-200 rounded-full" />
              <span>~60 {t('common.seconds')}</span>
              {/* Only show skip if user has existing brands */}
              {userBrands.length > 0 && (
                <>
                  <span className="w-1 h-1 bg-gray-200 rounded-full" />
                  <button
                    onClick={() => {
                      // Load the first available brand instead of going to empty playground
                      const brandToLoad = userBrands[0];
                      if (brandToLoad) {
                        loadBrandById(brandToLoad.id, false, true);
                      } else {
                        setStep('playground');
                      }
                    }}
                    className="hover:text-gray-500 transition-colors underline underline-offset-2"
                  >
                    {t('playground.urlStep.backToMyBrands')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (step === 'analyzing') {
      return (
        <div className="min-h-screen flex items-center justify-center relative">
          {/* Subtle grid background */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(to right, #000 1px, transparent 1px),
                linear-gradient(to bottom, #000 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }}
          />

          {/* Floating accent */}
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-blue-100/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-gradient-to-tr from-amber-100/15 to-transparent rounded-full blur-3xl" />

          {/* Corner frames */}
          <div className="absolute top-8 left-8 w-16 h-16 border-l border-t border-gray-200" />
          <div className="absolute bottom-8 right-8 w-16 h-16 border-r border-b border-gray-200" />

          <div className="relative z-10 flex flex-col items-center max-w-lg w-full px-6">
            {/* Status label */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                {locale === 'fr' ? 'Analyse en cours' : 'Analysis in progress'}
              </span>
            </div>

            {/* Animated emoji + message */}
            <div className="mb-8 text-center">
              <div
                key={loadingStage}
                className="animate-fade-in"
              >
                <span className="text-5xl mb-4 block animate-bounce" style={{ animationDuration: '2s' }}>
                  {LOADING_STAGES[loadingStage]?.emoji || '🔍'}
                </span>
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
                  {LOADING_STAGES[loadingStage]?.message || 'Analyse...'}
                </h2>
                <p className="text-sm text-gray-400">
                  {LOADING_STAGES[loadingStage]?.sub || ''}
                </p>
              </div>
            </div>

            {/* Progress bar - modern style */}
            <div className="w-full max-w-md mb-6">
              <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-2">
                <span>{locale === 'fr' ? 'Progression' : 'Progress'}</span>
                <span className="tabular-nums">{Math.round(progress)}%</span>
              </div>

              {/* Progress bar */}
              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-sky-400 transition-all duration-700 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
                {/* Shimmer effect */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                  style={{
                    transform: 'skewX(-20deg)',
                    animation: 'shimmer 2s infinite'
                  }}
                />
              </div>

              {/* Stage labels */}
              <div className="flex justify-between mt-3">
                <span className={`text-[9px] font-mono uppercase ${loadingStage >= 0 ? 'text-blue-600' : 'text-gray-300'}`}>
                  {locale === 'fr' ? 'Scan' : 'Scan'}
                </span>
                <span className={`text-[9px] font-mono uppercase ${loadingStage >= 3 ? 'text-blue-600' : 'text-gray-300'}`}>
                  {locale === 'fr' ? 'IA' : 'AI'}
                </span>
                <span className={`text-[9px] font-mono uppercase ${loadingStage >= 5 ? 'text-blue-600' : 'text-gray-300'}`}>
                  {locale === 'fr' ? 'Enrichissement' : 'Enrichment'}
                </span>
              </div>
            </div>

            {/* Live discovery feed */}
            <div className="w-full max-w-md mb-6">
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-2">
                {locale === 'fr' ? 'Découvertes' : 'Discoveries'}
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 space-y-1.5 h-[120px] overflow-hidden">
                {DISCOVERY_ITEMS.filter(item => progress >= item.threshold).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs animate-fade-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <span className="text-sm">{item.emoji}</span>
                    <span className="text-gray-600">{item.text}</span>
                    <span className="text-blue-500 text-[10px]">✓</span>
                  </div>
                ))}
                {progress < 90 && (
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <span className="animate-pulse">⏳</span>
                    <span>{locale === 'fr' ? 'En cours...' : 'In progress...'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rotating fun facts */}
            <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg max-w-md">
              <p
                key={currentFact}
                className="text-xs text-gray-500 text-center animate-fade-in"
              >
                {FUN_FACTS[currentFact]}
              </p>
            </div>

            {/* Time estimate & Notification info */}
            <p className="mt-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest text-center max-w-xs mx-auto leading-relaxed">
              {t('playground.urlStep.scrapingTime')}
            </p>
          </div>
        </div>
      );
    }

    if (step === 'logo-confirm') {
      const currentLogo = brandData?.logo || brandData?.labeledImages?.find((img: any) => img.category === 'main_logo')?.url;

      return (
        <div className="min-h-[85vh] flex items-center justify-center animate-fade-in relative">
          {/* Subtle grid background - matching URL step */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />

          {/* Floating accents - matching URL step */}
          <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-sky-300/10 rounded-full blur-3xl" />
          <div className="absolute bottom-32 left-16 w-48 h-48 bg-gradient-to-tr from-amber-200/15 to-orange-300/10 rounded-full blur-3xl" />

          <div className="relative z-10 w-full max-w-xl mx-auto px-6">
            {/* Header - matching URL step style */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Logo Check</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-light text-gray-900 leading-[1.1] mb-3" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                C'est bien<br />
                <span className="font-semibold">votre logo ?</span>
              </h1>

              <p className="text-gray-400 text-base max-w-md leading-relaxed">
                Ce logo sera utilisé dans tous vos visuels générés. Assurez-vous qu'il est correct.
              </p>
            </div>

            {/* Logo Display Card - matching app design */}
            <div className="relative">
              {/* Decorative corners */}
              <div className="absolute -top-3 -left-3 w-6 h-6 border-l-2 border-t-2 border-gray-200" />
              <div className="absolute -bottom-3 -right-3 w-6 h-6 border-r-2 border-b-2 border-gray-200" />

              <div className="bg-white border border-gray-200">
                {/* Logo Container with checker pattern for transparent/white logos */}
                <div
                  className="aspect-[16/9] flex items-center justify-center p-8 relative overflow-hidden"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                      linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                      linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                    `,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    backgroundColor: '#fafafa'
                  }}
                >
                  {currentLogo ? (
                    <img
                      src={currentLogo}
                      alt={brandData?.name || 'Logo'}
                      className="max-w-full max-h-full object-contain relative z-10"
                      style={{ maxHeight: '160px' }}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-sm font-mono">Aucun logo détecté</span>
                    </div>
                  )}
                </div>

                {/* Warning ONLY if NO logo was found - removed false positive heuristic */}
                {!currentLogo && (
                  <div className="px-6 py-3 bg-amber-50 border-t border-amber-100 flex items-center gap-2 text-amber-700 text-sm">
                    <span>⚠️</span>
                    <span>Aucun logo détecté automatiquement. Uploadez le logo de <strong>{brandData?.name}</strong>.</span>
                  </div>
                )}

                {/* Action Section */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                  {/* Hidden file input for logo upload */}
                  <input
                    ref={logoUploadRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => logoUploadRef.current?.click()}
                      disabled={isUploadingLogo}
                      className={`flex-1 px-5 py-3 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${currentLogo
                        ? 'border border-gray-300 text-gray-600 hover:bg-white hover:border-gray-400'
                        : 'bg-gray-900 text-white hover:bg-black'
                        }`}
                    >
                      {isUploadingLogo ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          {t('common.loading')}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {currentLogo
                            ? t('playground.logo.uploadCorrectLogo')
                            : t('playground.logo.uploadYourLogo')
                          }
                        </span>
                      )}
                    </button>

                    {currentLogo && (
                      <button
                        onClick={handleConfirmLogo}
                        disabled={isUploadingLogo || isConfirmingLogo}
                        className="flex-1 px-5 py-3 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isConfirmingLogo ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            {t('common.loading')}
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {t('playground.logo.thatsIt')}
                          </span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* No logo option */}
                  <button
                    onClick={() => {
                      // Clear logo and continue
                      setBrandData((prev: any) => ({ ...prev, logo: null }));
                      setStep('bento');
                      showToast(t('toast.noLogoYet'), 'info');
                    }}
                    className="w-full mt-3 px-4 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {t('playground.logo.noLogoYet')}
                  </button>
                </div>
              </div>
            </div>

            {/* Brand name indicator */}
            {brandData?.name && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <div className="w-1 h-1 bg-gray-300 rounded-full" />
                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-[0.15em]">
                  {brandData.name}
                </span>
                <div className="w-1 h-1 bg-gray-300 rounded-full" />
              </div>
            )}
          </div>
        </div>
      );
    }

    if (step === 'bento') {
      // First time setup if we came from URL analysis (not from playground editing)
      const isFirstTime = stepBeforeBento !== 'playground';

      return (
        <BentoGrid
          brandData={brandData || {}}
          backgrounds={backgrounds}
          isGeneratingBackgrounds={isGeneratingBackgrounds}
          isSaving={isSavingBrand}
          onUpdate={setBrandData}
          onValidate={handleValidateBento}
          onAddSource={() => setShowSourceManager(true)}
          isFirstTimeSetup={isFirstTime}
          userPlan={creditsInfo?.plan || 'free'}
          onRescrape={handleRescrape}
          onBack={() => {
            // Go back to previous step (create if coming from Identité button, url if new analysis)
            if (stepBeforeBento && stepBeforeBento !== 'bento') {
              setStep(stepBeforeBento);
              setStepBeforeBento(null);
            } else {
              setStep('url');
            }
          }}
        />
      );
    }

    if (activeTab === 'calendar') {
      return <CalendarView brandId={brandData?.id} creditsInfo={creditsInfo || null} />;
    }

    if (activeTab === 'gallery') {
      return <ProjectsView key={selectedBrandId || 'no-brand'} brandId={selectedBrandId || undefined} />;
    }

    if (activeTab === 'settings') {
      return <SettingsView />;
    }

    // Strategy view merged into Create - angles carousel at top of the page

    return (
      <div className="animate-fade-in w-full max-w-5xl mx-auto px-3 sm:px-4">
        {/* ═══════════════════════════════════════════════════════════════════════════
            VERTICAL STACKED CREATIVE SPACE
            Clean top-to-bottom flow: Header → Ideas → Form → Results
            ═══════════════════════════════════════════════════════════════════════════ */}

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {brandData?.logo ? (
              <div className="w-10 h-10 bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src={brandData.logo} alt={brandData.name || 'Logo'} className="w-8 h-8 object-contain" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-gray-900 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">✦</span>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">{brandData?.name || t('common.brand')}</h1>
              <span className="text-xs text-gray-400">{t('playground.header.createVisuals')}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Aspect Ratio Toggle */}
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="text-xs bg-white border border-gray-200 px-3 py-2 outline-none cursor-pointer text-gray-600 hover:border-gray-300"
            >
              {ASPECT_RATIOS.map(ratio => (
                <option key={ratio.value} value={ratio.value}>{ratio.icon} {ratio.label}</option>
              ))}
            </select>
            {/* Resolution Toggle */}
            <div className="flex items-center border border-gray-200">
              {RESOLUTIONS.map(res => {
                const isPro = creditsInfo?.plan === 'pro' || creditsInfo?.plan === 'premium';
                const isLocked = res.value === '4K' && !isPro;

                return (
                  <button
                    key={res.value}
                    onClick={() => {
                      if (isLocked) {
                        showToast(t('toast.fourKProOnly'), 'info');
                        return;
                      }
                      setResolution(res.value);
                    }}
                    className={`text-xs px-3 py-2 transition-colors relative ${resolution === res.value
                      ? 'bg-gray-900 text-white'
                      : isLocked
                        ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                        : 'bg-white text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    {res.label}
                    {res.badge && isLocked && (
                      <span className="absolute -top-1 -right-1 text-[8px] bg-blue-500 text-white px-1 rounded">
                        {res.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Language Toggle */}
            <select
              value={contentLanguage}
              onChange={(e) => setContentLanguage(e.target.value as 'fr' | 'en' | 'es' | 'de')}
              className="text-xs bg-white border border-gray-200 px-3 py-2 outline-none cursor-pointer text-gray-600 hover:border-gray-300"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.flag} {lang.label}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setStepBeforeBento(step); // Remember current step
                setStep('bento');
              }}
              className="px-3 py-2 border border-gray-200 text-xs text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t('playground.content.identity')}
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════
            ANGLES CAROUSEL - Collapsed by default, shows 4 items + "voir plus"
            ═══════════════════════════════════════════════════════════════════════════ */}
        {brandData && brandData.industryInsights?.length > 0 && (
          <div className="mb-6">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">{t('playground.content.contentIdeas')}</span>
            </div>

            {/* AI-Generated Editorial Hooks - Collapsed with "voir plus" */}
            {(() => {
              const validInsights = brandData.industryInsights?.filter((insight: any) => {
                const hookText = insight.painPoint || insight.hook || insight.fact;
                return hookText && hookText.length >= 10;
              }) || [];

              // Sort: pain_points (red) first, then primary, then others
              const sortedInsights = [...validInsights].sort((a: any, b: any) => {
                const order = { 'pain_point': 0, 'primary': 1 };
                const aOrder = a.type === 'pain_point' ? 0 : (a.tier === 'primary' ? 1 : 2);
                const bOrder = b.type === 'pain_point' ? 0 : (b.tier === 'primary' ? 1 : 2);
                return aOrder - bOrder;
              });

              const visibleInsights = showAllAngles ? sortedInsights : sortedInsights.slice(0, 4);
              const hasMore = sortedInsights.length > 4;

              // Type-based styling for secondary angles
              const typeStyles: Record<string, { emoji: string; bg: string; border: string; hover: string }> = {
                'pain_point': { emoji: '⚡', bg: 'bg-rose-50', border: 'border-rose-200', hover: 'hover:border-rose-400' },
                'trend': { emoji: '📈', bg: 'bg-blue-50', border: 'border-blue-200', hover: 'hover:border-blue-400' },
                'provocation': { emoji: '🎯', bg: 'bg-purple-50', border: 'border-purple-200', hover: 'hover:border-purple-400' },
                'social_proof': { emoji: '💬', bg: 'bg-amber-50', border: 'border-amber-200', hover: 'hover:border-amber-400' },
                'tip': { emoji: '💡', bg: 'bg-emerald-50', border: 'border-emerald-200', hover: 'hover:border-emerald-400' },
                'competitive': { emoji: '🏆', bg: 'bg-indigo-50', border: 'border-indigo-200', hover: 'hover:border-indigo-400' },
                // Special styling for primary angles (gold/amber highlight)
                'primary': { emoji: '⭐', bg: 'bg-gradient-to-r from-amber-50 to-yellow-50', border: 'border-amber-300', hover: 'hover:border-amber-500' },
              };

              return (
                <div className="flex flex-wrap gap-2">
                  {visibleInsights.map((insight: any, i: number) => {
                    const hookText = insight.painPoint || insight.hook || insight.fact;
                    const isPrimary = insight.tier === 'primary';
                    // Primary angles use their own style, secondary use type-based
                    const style = isPrimary
                      ? typeStyles['primary']
                      : (typeStyles[insight.type] || { emoji: '💡', bg: 'bg-gray-50', border: 'border-gray-200', hover: 'hover:border-gray-400' });

                    return (
                      <button
                        key={`insight-${i}`}
                        onClick={() => {
                          const simpleBrief = insight.consequence
                            ? `${hookText}\n\n${insight.consequence}`
                            : hookText;
                          setBrief(simpleBrief);
                          setSelectedTemplate(insight.type === 'trend' ? 'announcement' : 'stat');
                        }}
                        className={`px-3 py-2 border transition-all text-left max-w-[280px] ${style.bg} ${style.border} ${style.hover}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-sm flex-shrink-0">{style.emoji}</span>
                          <span className="text-xs text-gray-700 line-clamp-2">{hookText}</span>
                        </div>
                      </button>
                    );
                  })}

                  {/* "Voir plus" / "Voir moins" button */}
                  {hasMore && (
                    <button
                      onClick={() => setShowAllAngles(!showAllAngles)}
                      className="px-3 py-2 border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all flex items-center gap-1"
                    >
                      {showAllAngles ? (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M5 15l7-7 7 7" />
                          </svg>
                          {t('common.less')}
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M19 9l-7 7-7-7" />
                          </svg>
                          +{validInsights.length - 4} {t('common.more')}
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* MAIN CREATION CARD */}
        <div className="bg-white border border-gray-200 shadow-sm mb-8">

          {/* Message Section */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Votre message</label>
              {brief.trim() && (
                <button
                  onClick={handleMagicEnhance}
                  disabled={isThinking}
                  className="text-xs text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-30 flex items-center gap-1"
                >
                  <span>✦</span> Enrichir
                </button>
              )}
            </div>
            <textarea
              value={brief}
              onChange={(e) => {
                setBrief(e.target.value);
                // Show hint if user is typing a custom prompt but has no assets beyond logo
                const hasOnlyLogo = uploadedImages.length === 0 ||
                  (uploadedImages.length === 1 && uploadedImages[0] === brandData?.logo);
                if (e.target.value.length > 20 && hasOnlyLogo && !showAssetHint) {
                  setShowAssetHint(true);
                }
              }}
              onBlur={() => setShowAssetHint(false)}
              placeholder={getSmartPlaceholder(selectedTemplate, brandData)}
              className="w-full min-h-[100px] text-base resize-none outline-none placeholder:text-gray-300 leading-relaxed"
            />
          </div>

          {/* Sources Row - Full width brand assets + compact inspiration */}
          <div className="p-5 space-y-4">

            {/* BRAND ASSETS - Full Width */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('playground.content.brandVisuals')}
                </label>
                <span className="text-[10px] text-gray-400">
                  {uploadedImages.length} {t('common.selected')}
                </span>
              </div>

              {/* Asset hint - shows when user types custom prompt with no assets */}
              {showAssetHint && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-lg animate-pulse">
                  <span className="text-amber-600 text-sm">💡</span>
                  <span className="text-xs text-amber-700">
                    {locale === 'fr'
                      ? 'Ajoutez un visuel pour enrichir votre création !'
                      : 'Add a visual to enrich your creation!'}
                  </span>
                  <button
                    onClick={() => {
                      setShowAssetHint(false);
                      setShowAssetManager(true);
                    }}
                    className="ml-auto text-[10px] font-medium text-amber-600 hover:text-amber-700 underline"
                  >
                    {t('common.add')}
                  </button>
                </div>
              )}

              {/* Selected assets preview - Overflow visible when dropdown open */}
              <div className={`flex gap-2 items-center pb-1 no-scrollbar ${tagDropdownOpen ? 'overflow-visible' : 'overflow-x-auto'}`}>
                {/* Logo - always first */}
                {brandData?.logo && (
                  <div
                    className="relative h-14 w-14 rounded-xl border-2 border-accent overflow-hidden flex-shrink-0"
                    style={{
                      backgroundImage: `linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)`,
                      backgroundSize: '8px 8px',
                      backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                    }}
                    title={t('playground.content.logoAlwaysIncluded')}
                  >
                    <img src={brandData.logo} className="w-full h-full object-contain p-1" alt="Logo" />
                    <div className="absolute bottom-0 left-0 right-0 bg-accent text-white text-[7px] text-center py-0.5 font-bold">
                      LOGO
                    </div>
                  </div>
                )}

                {/* ALL brand assets with toggle selection */}
                {(brandData?.images || []).filter((img: string) => img !== brandData?.logo).map((imgUrl: string, i: number) => {
                  const labelObj = brandData?.labeledImages?.find((li: any) => li.url === imgUrl);
                  const category = labelObj?.category || 'other';
                  const tagInfo = getTagInfo(category, locale === 'fr' ? 'fr' : 'en');
                  const isSelected = uploadedImages.includes(imgUrl);
                  const isDropdownOpen = tagDropdownOpen === imgUrl;

                  return (
                    <div
                      key={i}
                      onClick={() => {
                        // Toggle selection
                        if (isSelected) {
                          setUploadedImages(prev => prev.filter(img => img !== imgUrl));
                        } else {
                          setUploadedImages(prev => [...prev, imgUrl]);
                        }
                      }}
                      className={`relative h-14 w-14 rounded-xl border-2 overflow-visible cursor-pointer group flex-shrink-0 transition-all ${isSelected
                        ? 'border-accent shadow-md'
                        : 'border-gray-200 opacity-50 hover:opacity-80 hover:border-gray-400'
                        }`}
                      title={isSelected
                        ? t('playground.content.clickToDeselect')
                        : t('playground.content.clickToSelect')
                      }
                    >
                      <img src={imgUrl} className="w-full h-full object-cover rounded-lg" alt="" />

                      {/* Selection checkmark - only when selected */}
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center shadow-lg text-[10px] z-10">
                          ✓
                        </div>
                      )}

                      {/* Tag badge - only show on selected, clickable for dropdown */}
                      {isSelected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTagDropdownOpen(isDropdownOpen ? null : imgUrl);
                          }}
                          className={`absolute bottom-0 left-0 right-0 text-[7px] text-center py-0.5 font-bold ${tagInfo.className} cursor-pointer hover:opacity-90 transition-opacity rounded-b-lg flex items-center justify-center gap-0.5`}
                        >
                          <span>{tagInfo.shortLabel}</span>
                          <svg className="w-2 h-2 opacity-60" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}

                      {/* Dropdown menu */}
                      {isDropdownOpen && (
                        <div
                          className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[120px] z-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {getTagOptionsList(locale === 'fr' ? 'fr' : 'en')
                            .filter(opt => opt.value !== 'main_logo') // Can't change to logo
                            .map(opt => (
                              <button
                                key={opt.value}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleChangeImageTag(imgUrl, opt.value);
                                }}
                                className={`w-full px-3 py-1.5 text-left text-[10px] flex items-center gap-2 hover:bg-gray-50 ${category === opt.value ? 'bg-gray-50' : ''}`}
                              >
                                <span className={`w-2 h-2 rounded-sm ${opt.color.split(' ')[0]}`} />
                                <span className="text-gray-700">{opt.label}</span>
                                {category === opt.value && <span className="ml-auto text-accent">✓</span>}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add more button - triggers file input */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-14 w-14 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all flex-shrink-0"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[8px] text-gray-400 mt-0.5">+</span>
                </button>
              </div>

              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>

            {/* STYLE INSPIRATION - Compact inline */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                {t('playground.content.style')}
              </span>

              {/* Selected styles display */}
              {styleRefImages.length > 0 ? (
                <div className="flex gap-2 items-center">
                  {styleRefImages.map((ref, i) => (
                    <div key={i} className="relative group">
                      <div className="h-10 w-10 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                        <img src={ref.url} className="w-full h-full object-cover" alt="" />
                      </div>
                      <button
                        onClick={() => setStyleRefImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg text-[10px]"
                      >×</button>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowStyleGallery(true)}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {t('common.change')}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setShowStyleGallery(true)}
                    className="h-8 px-3 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1.5 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {t('sidebar.gallery')}
                  </button>

                  <label className="h-8 px-3 text-xs text-gray-500 bg-white border border-gray-200 hover:border-gray-300 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 4v16m8-8H4" />
                    </svg>
                    {t('common.upload')}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          const file = e.target.files[0];
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (typeof ev.target?.result === 'string') {
                              setStyleRefImages(prev => [...prev, { url: ev.target!.result as string }].slice(0, 3));
                            }
                          };
                          reader.onerror = () => {
                            console.error(`Failed to read style ref file: ${file.name}`);
                            showToast(t('toast.errorLoadingImage'), 'error');
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <div className="p-5 bg-gray-50 border-t border-gray-100">
            {/* Progress */}
            {status !== 'idle' && status !== 'complete' && status !== 'error' && (
              <div className="mb-4">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs text-gray-500">{statusMessage}</span>
              </div>
            )}

            <button
              onClick={() => {
                // Check if user has credits before generating
                if (lastCreditsRemaining !== null && lastCreditsRemaining === 0) {
                  setShowUpgradePopup(true);
                  return;
                }
                handleGenerate();
              }}
              disabled={!brief.trim() || uploadedImages.length === 0}
              className="w-full group bg-gray-900 text-white py-4 font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-black flex items-center justify-center gap-3"
            >
              {activeGenerations.length > 0 ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>{t('playground.buttons.generate')} {activeGenerations.length > 0 && `(${activeGenerations.length})`}</span>
                </>
              ) : (
                <>
                  <span className="text-blue-400 text-lg">✦</span>
                  <span>{t('playground.buttons.generate')}</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>

            {/* Validation hints */}
            {(uploadedImages.length === 0 || !brief.trim() || (lastCreditsRemaining !== null && lastCreditsRemaining === 0)) && (
              <div className="flex justify-center gap-4 mt-3">
                {!brief.trim() && <span className="text-xs text-amber-600">⚠ Message requis</span>}
                {uploadedImages.length === 0 && <span className="text-xs text-amber-600">⚠ Image requise</span>}
                {lastCreditsRemaining !== null && lastCreditsRemaining === 0 && (
                  <span className="text-xs text-red-600 font-medium">🚫 {t('common.creditsLeft')}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════
            RESULTS SECTION
            ═══════════════════════════════════════════════════════════════════════════ */}

        {/* Upgrade Inline Card - shows at the TOP when credits are low */}
        {lastCreditsRemaining !== null && lastCreditsRemaining <= 1 && (
          <div className="mb-6">
            <UpgradeInline
              creditsRemaining={lastCreditsRemaining}
              plan={creditsInfo?.plan || 'free'}
              locale={locale}
            />
          </div>
        )}

        {/* Active Generations Queue - Compact Indicator */}
        {activeGenerations.length > 0 && (
          <div className="mb-6 space-y-2">
            {activeGenerations.map((job, idx) => (
              <div key={job.id} className="bg-white border border-gray-200 p-3 rounded-lg animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-500 flex-shrink-0">
                      <svg className="w-3 h-3 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-600 truncate font-medium">
                      {job.brief}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">{job.progress}%</span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading State - Grid of Active Generations */}
        {activeGenerations.length > 0 && (
          <div className="mb-8">
            {/* Status header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: brandData?.colors?.[0] || '#3B82F6' }}
                >
                  <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {locale === 'fr'
                    ? (activeGenerations.length > 1 ? `${activeGenerations.length} visuels en cours...` : 'Création de votre visuel...')
                    : (activeGenerations.length > 1 ? `${activeGenerations.length} visuals processing...` : 'Creating your visual...')}
                </p>
                <p className="text-xs text-gray-500">
                  {statusMessage || (locale === 'fr' ? '~30 secondes' : '~30 seconds')}
                </p>
              </div>
            </div>

            {/* Grid of Skeleton Cards */}
            <div className={`grid gap-4 ${
              // Use the first job's ratio to guess the grid, or default to responsive
              (activeGenerations[0]?.aspectRatio === '9:16') ? 'grid-cols-2 sm:grid-cols-3' :
                (activeGenerations[0]?.aspectRatio === '16:9' || activeGenerations[0]?.aspectRatio === '21:9') ? 'grid-cols-1' :
                  'grid-cols-1 sm:grid-cols-2'
              }`}>
              {activeGenerations.map((job) => {
                const aspectClasses: Record<string, string> = {
                  '1:1': 'aspect-square',
                  '4:5': 'aspect-[4/5]',
                  '9:16': 'aspect-[9/16]',
                  '16:9': 'aspect-[16/9]',
                  '21:9': 'aspect-[21/9]',
                  '3:2': 'aspect-[3/2]',
                };
                const jobRatio = job.aspectRatio || aspectRatio || '1:1';
                const aspectClass = aspectClasses[jobRatio] || 'aspect-square';

                return (
                  <div
                    key={job.id}
                    className={`${aspectClass} rounded-xl relative overflow-hidden border border-gray-200 animate-fade-in`}
                    style={{
                      background: `linear-gradient(135deg, ${brandData?.colors?.[0] || '#f3f4f6'}15, ${brandData?.colors?.[1] || '#e5e7eb'}25)`
                    }}
                  >
                    {/* Shimmer effect */}
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      style={{ animation: 'shimmer 2s infinite' }}
                    />

                    {/* Content preview */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      {/* Brand logo preview if available */}
                      {brandData?.logo && (
                        <div className="w-16 h-16 mb-4 opacity-20 hidden sm:block">
                          <img src={brandData.logo} className="w-full h-full object-contain" alt="" />
                        </div>
                      )}

                      {/* Skeleton lines */}
                      <div className="space-y-2 w-full max-w-[80%] mb-4">
                        <div className="h-2 bg-gray-200/50 rounded-full animate-pulse" />
                        <div className="h-2 bg-gray-200/50 rounded-full w-2/3 mx-auto animate-pulse" style={{ animationDelay: '0.2s' }} />
                      </div>

                      {/* Job-specific Label */}
                      <p className="text-[10px] text-gray-500 font-medium mb-1 line-clamp-1 px-4 max-w-full">
                        {job.brief}
                      </p>

                      {/* Progress indicator */}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-400 font-mono">
                          {job.progress}%
                        </span>
                        <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Color bar at bottom using brand colors */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 flex">
                      {(brandData?.colors || ['#3B82F6', '#8B5CF6', '#EC4899']).slice(0, 4).map((color: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex-1 animate-pulse"
                          style={{ backgroundColor: color, animationDelay: `${idx * 0.3}s` }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Fun fact during loading */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400 italic">
                💡 {locale === 'fr'
                  ? '1 crédit = 1 visuel unique créé par l\'IA'
                  : '1 credit = 1 unique AI-generated visual'}
              </p>
            </div>
          </div>
        )}

        {/* Generated Results */}
        {generatedImages.length > 0 && status === 'idle' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{t('recentVisuals.yourCreations')}</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium">{generatedImages.length}</span>
              </div>
              <button
                onClick={() => setGeneratedImages([])}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                {t('playground.buttons.clear')}
              </button>
            </div>

            {/* Hint for editing */}
            <p className="text-xs text-gray-400 mb-3">
              💡 Une faute d'orthographe, un logo à corriger ou un détail à changer ? Cliquez sur ✏️ pour modifier n'importe quelle image.
            </p>

            {/* Grid adapts based on the actual images' aspect ratios */}
            {(() => {
              // Determine dominant ratio from the images themselves
              const imageRatios = generatedImages.map(img => img.aspectRatio || '1:1');
              const dominantRatio = imageRatios[0] || '1:1'; // Use first image's ratio

              // Grid layout based on dominant ratio
              const gridClass =
                dominantRatio === '9:16' ? 'grid-cols-2 sm:grid-cols-3' :
                  dominantRatio === '16:9' || dominantRatio === '21:9' ? 'grid-cols-1' :
                    'grid-cols-1 sm:grid-cols-2';

              return (
                <div className={`grid gap-4 ${gridClass}`}>
                  {generatedImages.map((img) => {
                    // Map aspect ratio to CSS class
                    const aspectClasses: Record<string, string> = {
                      '1:1': 'aspect-square',
                      '4:5': 'aspect-[4/5]',
                      '9:16': 'aspect-[9/16]',
                      '16:9': 'aspect-[16/9]',
                      '3:2': 'aspect-[3/2]',
                      '21:9': 'aspect-[21/9]',
                    };
                    const aspectClass = aspectClasses[img.aspectRatio || '1:1'] || 'aspect-square';

                    return (
                      <div
                        key={img.id}
                        onClick={() => setLightboxImage(img)}
                        className={`bg-gray-100 overflow-hidden relative group cursor-pointer border border-gray-200 hover:border-gray-400 transition-all hover:shadow-xl ${aspectClass}`}
                      >
                        <img src={img.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxImage(img);
                            }}
                            className="w-11 h-11 bg-white text-gray-900 flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
                            title={t('common.view')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingImage(img.url);
                              setEditPrompt('');
                            }}
                            className="w-11 h-11 bg-white text-gray-900 flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
                            title={t('common.edit')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const response = await fetch(img.url);
                                const blob = await response.blob();
                                const blobUrl = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = blobUrl;
                                link.download = `palette-${Date.now()}.png`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              } catch (err) {
                                window.open(img.url, '_blank');
                              }
                            }}
                            className="w-11 h-11 bg-white text-gray-900 flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
                            title={t('common.download')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Empty state hint - subtle, at the bottom */}
        {generatedImages.length === 0 && status === 'idle' && brief.trim() && uploadedImages.length > 0 && (
          <div className="text-center py-8 border-t border-gray-100">
            <p className="text-sm text-gray-400">
              ✨ {t('playground.empty.clickGenerateToCreate')} <span className="font-medium text-gray-600">{t('playground.empty.generate')}</span> {t('playground.empty.toCreate')}
            </p>
          </div>
        )}

        {/* Recent Visuals - bottom section */}
        <RecentVisuals
          generations={recentGenerations}
          onViewAll={() => setActiveTab('gallery')}
          onImageClick={(gen) => {
            // Convert Generation to GeneratedImage format for lightbox
            setLightboxImage({
              id: gen.id,
              url: gen.url,
              aspectRatio: gen.aspectRatio || '1:1', // Use stored ratio
            });
          }}
          locale={locale}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#414141] font-sans selection:bg-black selection:text-white flex">
      {/* Toast container - center-top on bento to avoid covering validate button */}
      <div className={`toast-container fixed z-50 flex flex-col gap-2 pointer-events-none ${step === 'bento'
        ? 'top-6 left-1/2 -translate-x-1/2'
        : 'top-6 right-6'
        }`}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 border flex items-center gap-3 bg-white animate-slide-in-right ${toast.type === 'error' ? 'border-red-200 text-red-600' : toast.type === 'success' ? 'border-blue-200' : 'border-gray-200'
              }`}
          >
            <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-blue-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-gray-400'
              }`} />
            <span className="text-sm text-gray-900">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* 🎁 Gift Overlay - Celebrate free generation */}
      {showGiftOverlay && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowGiftOverlay(false)}
        >
          <div
            className="relative bg-white rounded-2xl p-10 max-w-md mx-4 text-center shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowGiftOverlay(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Gift emoji */}
            <div className="text-7xl mb-6 animate-bounce">🎁</div>

            {/* Title */}
            <h3 className="text-3xl font-semibold text-gray-900 mb-3">
              {t('welcomeModal.title')}
            </h3>

            {/* Message */}
            <p className="text-lg text-gray-700 mb-2 font-medium">
              {t('welcomeModal.message')}
            </p>

            <p className="text-gray-500 mb-6">
              {t('welcomeModal.subtitle')}
            </p>

            {/* Loading indicator */}
            <div className="flex items-center justify-center gap-3 text-sm text-blue-600 bg-blue-50 py-3 px-4 rounded-lg">
              <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="font-medium">{t('welcomeModal.generating')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Style Gallery Modal */}
      <StyleGallery
        isOpen={showStyleGallery}
        onClose={() => setShowStyleGallery(false)}
        onSelect={(url: string) => {
          // Convert relative URL to absolute URL for Fal API
          const absoluteUrl = url.startsWith('/')
            ? `${window.location.origin}${url}`
            : url;
          console.log('🎨 Style ref selected:', absoluteUrl);
          setStyleRefImages(prev => [{ url: absoluteUrl }, ...prev].slice(0, 3));
          showToast(t('toast.styleAdded'), 'success');
        }}
      />

      {/* Asset Manager Modal - Temporarily disabled (component was removed) */}
      {/* <AssetManager ... /> */}

      {showSourceManager && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-3xl h-[80vh] flex flex-col relative border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1">
                  Bibliothèque
                </div>
                <h3 className="text-xl font-semibold">Sources visuelles</h3>
              </div>
              <button
                onClick={() => setShowSourceManager(false)}
                className="w-8 h-8 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 px-6 border-b border-gray-100">
              {[
                { id: 'library', label: 'Bibliothèque' },
                { id: 'upload', label: 'Importer' },
                { id: 'url', label: 'URL externe' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSourceTab(tab.id as 'library' | 'upload' | 'url')}
                  className={`py-3 text-sm font-medium transition-colors relative ${sourceTab === tab.id ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  {tab.label}
                  {sourceTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-900" />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0 p-6">
              {sourceTab === 'library' ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {[...(brandData?.images || []), ...(backgrounds || [])].map((img: string, i: number) => {
                    const isSelected = uploadedImages.includes(img);
                    const labelObj = brandData?.labeledImages?.find((li: any) => li.url === img);
                    const label = labelObj?.category || (img === brandData?.logo ? 'main_logo' : 'other');

                    return (
                      <div
                        key={`${img}-${i}`}
                        onClick={() => {
                          if (isSelected) {
                            setUploadedImages((prev) => prev.filter((u) => u !== img));
                          } else {
                            setUploadedImages((prev) => [...prev, img]);
                          }
                        }}
                        className={`aspect-square overflow-hidden relative cursor-pointer group border-2 transition-all ${isSelected ? 'border-gray-900' : 'border-transparent hover:border-gray-300'
                          }`}
                      >
                        <img src={img} className="w-full h-full object-cover" />
                        <div
                          className={`absolute inset-0 bg-black/30 transition-opacity flex items-center justify-center ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                        >
                          <div className={`w-6 h-6 flex items-center justify-center ${isSelected ? 'bg-gray-900 text-white' : 'bg-white text-gray-400'}`}>
                            {isSelected ? '✓' : ''}
                          </div>
                        </div>
                        <span className="absolute bottom-2 left-2 text-[9px] font-mono uppercase tracking-wider bg-white/90 text-gray-600 px-2 py-0.5">
                          {label}
                        </span>
                      </div>
                    );
                  })}
                  {[...(brandData?.images || []), ...(backgrounds || [])].length === 0 && (
                    <div className="col-span-full text-center text-gray-400 py-16 text-sm">
                      Aucune image dans la bibliothèque.
                    </div>
                  )}
                </div>
              ) : sourceTab === 'upload' ? (
                <div
                  className="flex flex-col items-center justify-center h-full border border-dashed border-gray-300 bg-gray-50/50 p-8 transition-colors hover:border-gray-400 cursor-pointer"
                  onClick={() => sourceManagerInputRef.current?.click()}
                >
                  <div className="w-12 h-12 border border-gray-200 flex items-center justify-center mb-4 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Cliquez pour uploader</p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-6">JPG, PNG, WEBP</p>

                  <div className="flex items-center gap-3 bg-white p-3 border border-gray-200" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Catégorie</span>
                    <select
                      value={newUploadLabel}
                      onChange={(e) => setNewUploadLabel(e.target.value)}
                      className="text-sm font-medium outline-none bg-transparent cursor-pointer text-gray-900"
                    >
                      <option value="product">Produit</option>
                      <option value="logo">Logo</option>
                      <option value="person">Humain</option>
                      <option value="icon">Icône</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  <input
                    ref={sourceManagerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSourceUpload}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <div className="w-12 h-12 border border-gray-200 flex items-center justify-center mb-4 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h4 className="text-base font-semibold mb-2">Source externe</h4>
                  <p className="text-sm text-gray-500 text-center mb-6 max-w-sm">
                    Entrez l'URL d'une page pour en extraire les images.
                  </p>

                  <div className="flex w-full max-w-lg gap-2">
                    <input
                      type="text"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 p-3 border border-gray-200 outline-none focus:border-gray-400 text-sm"
                    />
                    <button
                      onClick={handleAddSourceRequest}
                      disabled={!sourceUrl || isAddingSource}
                      className="bg-gray-900 text-white px-5 font-medium text-sm hover:bg-black transition-colors disabled:opacity-30"
                    >
                      {isAddingSource ? '...' : 'Ajouter'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                <span className="text-gray-900 font-medium">{uploadedImages.length}</span> sélectionnées
              </div>
              <button
                onClick={() => setShowSourceManager(false)}
                className="bg-gray-900 text-white px-6 py-3 font-medium text-sm hover:bg-black transition-colors"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}

      {editingImage && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-4xl flex flex-col md:flex-row relative border border-gray-200">
            {/* Close button */}
            <button
              onClick={() => {
                setEditingImage(null);
                setEditAdditionalImages([]);
              }}
              className="absolute top-4 right-4 z-10 w-8 h-8 border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image preview */}
            <div className="flex-1 bg-gray-50 flex items-center justify-center p-6 border-r border-gray-100">
              <img src={editingImage} className="max-h-[60vh] w-auto object-contain" />
            </div>

            {/* Edit form */}
            <div className="flex-1 flex flex-col justify-center p-8">
              <div className="text-[10px] font-mono uppercase tracking-widest text-blue-600 mb-2">
                {t('playground.gallery.editModeLabel')}
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('playground.gallery.editThisImage')}</h3>
              <p className="text-sm text-gray-500 mb-6">
                {t('playground.gallery.editDescription')}
              </p>

              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                className="w-full h-28 p-4 border border-gray-200 resize-none mb-4 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all text-sm"
                placeholder={t('playground.gallery.editPlaceholder')}
              />

              {/* Quick Logo Fix Button */}
              {brandData?.logo && (
                <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg border border-amber-300 p-1 flex-shrink-0">
                      <img src={brandData.logo} className="w-full h-full object-contain" alt={t('playground.gallery.logo')} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">
                        {t('playground.gallery.logoBadlyReproduced')}
                      </p>
                      <p className="text-xs text-amber-700">
                        {t('playground.gallery.fixLogoAutomatically')}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        // Add logo to reference images and set prompt
                        if (brandData.logo && !editAdditionalImages.includes(brandData.logo)) {
                          setEditAdditionalImages(prev => [brandData.logo, ...prev].slice(0, 3));
                        }
                        setEditPrompt(locale === 'fr'
                          ? 'Remplace le logo actuel par le logo officiel fourni. Reproduis-le exactement comme dans l\'image de référence, sans le modifier ni le styliser.'
                          : 'Replace the current logo with the official logo provided. Reproduce it exactly as shown in the reference image, without modifying or stylizing it.'
                        );
                      }}
                      className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
                    >
                      {t('playground.gallery.fix')}
                    </button>
                  </div>
                </div>
              )}

              {/* Additional Images for Editing */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">{t('playground.gallery.referenceImages')}</label>
                  <span className="text-[10px] text-gray-400">{editAdditionalImages.length}/3</span>
                </div>
                <p className="text-[10px] text-gray-400 mb-2">
                  {t('playground.gallery.referenceImagesHint')}
                </p>

                <div className="grid grid-cols-4 gap-2">
                  {editAdditionalImages.map((img, i) => (
                    <div key={i} className="relative aspect-square group rounded overflow-hidden border border-gray-200">
                      <img src={img} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setEditAdditionalImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/50 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-500 transition-colors"
                      >×</button>
                    </div>
                  ))}

                  {editAdditionalImages.length < 3 && (
                    <div
                      className="aspect-square border-2 border-dashed border-gray-200 rounded flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
                      onClick={() => document.getElementById('edit-image-upload')?.click()}
                    >
                      <span className="text-gray-400 text-xl">+</span>
                    </div>
                  )}
                </div>
                <input
                  id="edit-image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      Array.from(e.target.files).forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (typeof ev.target?.result === 'string') {
                            setEditAdditionalImages(prev => [...prev, ev.target!.result as string].slice(0, 3));
                          }
                        };
                        reader.onerror = () => {
                          console.error(`Failed to read edit image file: ${file.name}`);
                          showToast(t('toast.errorLoadingImage'), 'error');
                        };
                        reader.readAsDataURL(file);
                      });
                    }
                  }}
                />
              </div>

              <button
                onClick={() => {
                  if (!editPrompt.trim() || !editingImage) return;
                  // Use dedicated edit function - bypasses Creative Director
                  handleEditImage(editingImage, editPrompt, editAdditionalImages);
                  setEditingImage(null);
                  setEditPrompt('');
                  setEditAdditionalImages([]);
                }}
                className="group bg-gray-900 text-white py-4 font-medium text-sm hover:bg-black transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                disabled={!editPrompt.trim()}
              >
                <span className="text-blue-400">✏️</span>
                {t('playground.gallery.applyEdit')}
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Image View with Options Panel */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 z-10 w-10 h-10 border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 transition rounded-full bg-black/50"
            onClick={() => setLightboxImage(null)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Main content area */}
          <div className="flex flex-col md:flex-row w-full h-full" onClick={(e) => e.stopPropagation()}>
            {/* Image preview - takes most of the space */}
            <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden">
              <img
                src={lightboxImage.url}
                alt="Full view"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Options Panel - Right side on desktop, bottom on mobile */}
            <div className="w-full md:w-80 bg-gray-900 border-t md:border-t-0 md:border-l border-white/10 p-6 flex flex-col gap-4">
              {/* Header */}
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-white font-medium text-lg mb-1">Votre création</h3>
                <p className="text-gray-400 text-xs">
                  {lightboxImage.aspectRatio || '1:1'} • Prêt pour export
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {/* Download */}
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(lightboxImage.url);
                      const blob = await response.blob();
                      const blobUrl = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = blobUrl;
                      link.download = `palette-${Date.now()}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(blobUrl);
                    } catch (err) {
                      window.open(lightboxImage.url, '_blank');
                    }
                  }}
                  className="w-full py-3 bg-white text-gray-900 font-medium text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {t('common.download')}
                </button>

                {/* Edit/Modify */}
                <button
                  onClick={() => {
                    setEditingImage(lightboxImage.url);
                    setEditPrompt('');
                    setLightboxImage(null);
                  }}
                  className="w-full py-3 border border-white/20 text-white font-medium text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {t('common.edit')}
                </button>

                {/* Re-generate (iterate) */}
                <button
                  onClick={() => {
                    setLightboxImage(null);
                    // Trigger a new generation with the same brief
                    if (brief.trim()) {
                      handleGenerate();
                    }
                  }}
                  className="w-full py-3 border border-white/20 text-white font-medium text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('playground.buttons.regenerate')}
                </button>
              </div>

              {/* Tips */}
              <div className="mt-auto pt-4 border-t border-white/10">
                <p className="text-gray-500 text-xs leading-relaxed">
                  {locale === 'fr'
                    ? '💡 Cliquez sur "Modifier" pour corriger une faute, remplacer un logo, ou ajuster un détail.'
                    : '💡 Click "Edit" to fix a typo, replace a logo, or adjust a detail.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - hidden on mobile */}
      {step !== 'loading' && step !== 'url' && step !== 'analyzing' && step !== 'bento' && (
        <>
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              brandData={brandData}
              onEditBrand={() => {
                setStepBeforeBento(step);
                setStep('bento');
              }}
              isCollapsed={isSidebarCollapsed}
              toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              userBrands={userBrands}
              selectedBrandId={selectedBrandId}
              onSwitchBrand={switchBrand}
              onAddBrand={() => setStep('url')}
              onRescrape={() => {
                // Re-scrape current brand
                if (brandData?.url) {
                  setWebsiteUrl(brandData.url);
                  setStep('analyzing');
                  handleAnalyzeBrandWithUrl(brandData.url);
                }
              }}
              onDeleteBrand={async (brandId) => {
                try {
                  const res = await fetch('/api/brands', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ brandId }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    showToast(t('toast.brandDeleted'), 'success');

                    // Refresh brands list first
                    await refreshBrands();

                    // If we deleted the current brand, load another one
                    if (brandId === selectedBrandId) {
                      setBrandData(null);
                      setSelectedBrandId(null);

                      // Find another brand to load (exclude the deleted one)
                      const remainingBrands = userBrands.filter(b => b.id !== brandId);
                      if (remainingBrands.length > 0) {
                        // Load the first remaining brand
                        const nextBrand = remainingBrands[0];
                        loadBrandById(nextBrand.id, false, true); // silent load
                        showToast(t('toast.loadingNextBrand', { name: nextBrand.name }), 'info');
                      } else {
                        // No more brands - go to URL step
                        setStep('url');
                      }
                    }
                  } else {
                    showToast(data.error || t('common.error'), 'error');
                  }
                } catch (err) {
                  showToast(t('toast.errorDeleting'), 'error');
                }
              }}
              creditsInfo={creditsInfo}
            />
          </div>

          {/* Mobile Navigation */}
          <MobileNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            brandData={brandData}
            onEditBrand={() => setStep('bento')}
          />
        </>
      )}

      <div className={`flex-1 transition-all duration-300 ease-out overflow-x-hidden ${step !== 'loading' && step !== 'url' && step !== 'analyzing' && step !== 'bento' ? (isSidebarCollapsed ? 'md:ml-[80px]' : 'md:ml-[240px]') : 'w-full'}`}>
        <main className={`mx-auto min-h-screen flex flex-col justify-center transition-all duration-500 ${step === 'bento'
          ? 'w-full px-4 md:px-12 py-8 max-w-[1920px]'
          : step !== 'loading' && step !== 'url' && step !== 'analyzing'
            ? 'max-w-[900px] p-6 md:p-10 pt-20 pb-24 md:pt-10 md:pb-10' // Mobile: padding for header/nav 
            : 'max-w-[900px] p-6 md:p-10'
          }`}>
          {renderContent()}
        </main>
      </div>
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 bg-gradient-to-t from-[#F9F9F9] via-[#F9F9F9] to-transparent pt-4">
        <button
          onClick={() => {
            // Check if user has credits before generating
            if (lastCreditsRemaining !== null && lastCreditsRemaining === 0) {
              setShowUpgradePopup(true);
              return;
            }
            handleGenerate();
          }}
          disabled={!brief.trim() || uploadedImages.length === 0}
          className="w-full bg-gray-900 text-white py-3.5 font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-black flex items-center justify-center gap-2 shadow-lg"
        >
          {activeGenerations.length > 0 ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">{t('playground.buttons.generate')} ({activeGenerations.length})</span>
            </>
          ) : (
            <>
              <span className="text-blue-400">✦</span>
              <span className="text-sm">{t('playground.buttons.generate')}</span>
              {brief.trim() && uploadedImages.length > 0 && (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">1 crédit</span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Upgrade Popup (shown when user tries to generate with 0 credits) */}
      <UpgradePopup
        isOpen={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
        creditsRemaining={lastCreditsRemaining ?? 0}
      />

      {/* Credits Toast (subtle notification) */}
      <CreditsToast
        creditsRemaining={lastCreditsRemaining ?? 1}
        isVisible={showCreditsToast}
        locale={locale}
      />
    </div>
  );
}

export default function Playground() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PlaygroundContent />
    </Suspense>
  );
}
