'use client';

import { useState, useEffect, useRef, Suspense, ChangeEvent, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from './components/Sidebar';
import BentoGrid from './components/BentoGrid';
import StyleGallery from './components/StyleGallery'; // NEW
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
import { useBrands, BrandSummary, getLastUsedBrandId, setLastUsedBrandId } from '@/lib/useBrands';

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
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  const brandId = searchParams.get('brandId');
  const analyzeUrl = searchParams.get('analyzeUrl'); // From Hero input
  
  // Multi-brand system
  const { brands: userBrands, loading: brandsLoading, refresh: refreshBrands } = useBrands();
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);

  const [showStyleGallery, setShowStyleGallery] = useState(false); // NEW
  
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
  const [statusMessage, setStatusMessage] = useState(locale === 'fr' ? 'Nous analysons votre identité...' : 'Analyzing your brand identity...');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'preparing' | 'running' | 'complete' | 'error'>('idle');
  const [loadingStage, setLoadingStage] = useState(0);
  
  // Fun loading messages that cycle through (locale-aware)
  const LOADING_STAGES = locale === 'fr' ? [
    { emoji: '🔍', message: 'Exploration du site...', sub: 'On scrape les pages clés' },
    { emoji: '🎨', message: 'Extraction des couleurs...', sub: 'Palette & identité visuelle' },
    { emoji: '📸', message: 'Analyse des images...', sub: 'Logo, produits, visuels' },
    { emoji: '🧠', message: 'L\'IA réfléchit...', sub: 'Analyse intelligente en cours' },
    { emoji: '🔥', message: 'Enrichissement...', sub: 'Recherche de tendances' },
    { emoji: '📊', message: 'Compilation des insights...', sub: 'Pain points & concurrents' },
    { emoji: '✨', message: 'Finalisation...', sub: 'On prépare votre brief' },
  ] : [
    { emoji: '🔍', message: 'Exploring website...', sub: 'Scraping key pages' },
    { emoji: '🎨', message: 'Extracting colors...', sub: 'Palette & visual identity' },
    { emoji: '📸', message: 'Analyzing images...', sub: 'Logo, products, visuals' },
    { emoji: '🧠', message: 'AI is thinking...', sub: 'Smart analysis in progress' },
    { emoji: '🔥', message: 'Enriching data...', sub: 'Searching for trends' },
    { emoji: '📊', message: 'Compiling insights...', sub: 'Pain points & competitors' },
    { emoji: '✨', message: 'Finalizing...', sub: 'Preparing your brief' },
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
    "💡 On analyse jusqu'à 10 pages de votre site pour extraire le maximum d'insights.",
    "🎨 Les couleurs sont extraites directement de votre logo pour une cohérence parfaite.",
    "🔥 On recherche les tendances de votre industrie en temps réel.",
    "🧠 Notre IA analyse même les captures d'écran de votre site.",
    "📊 On identifie vos concurrents pour mieux vous positionner.",
    "✨ Chaque génération crée 2 versions : fidèle et créative.",
  ] : [
    "💡 We analyze up to 10 pages of your site to extract maximum insights.",
    "🎨 Colors are extracted directly from your logo for perfect consistency.",
    "🔥 We search for trends in your industry in real time.",
    "🧠 Our AI even analyzes screenshots from your site.",
    "📊 We identify your competitors for better positioning.",
    "✨ Each generation creates 2 versions: faithful and creative.",
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
  const [styleRefImages, setStyleRefImages] = useState<{url: string; note?: string}[]>([]);
  const [editPrompt, setEditPrompt] = useState('');
  const [editAdditionalImages, setEditAdditionalImages] = useState<string[]>([]); // NEW: Additional images for editing
  const [visualIdeas, setVisualIdeas] = useState<string[]>([]);
  const [brief, setBrief] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [lightboxImage, setLightboxImage] = useState<GeneratedImage | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [contentLanguage, setContentLanguage] = useState<'fr' | 'en' | 'es' | 'de'>('fr');
  
  // Credits & Upgrade state
  const { credits: creditsInfo, updateRemaining: updateCreditsRemaining, refresh: refreshCredits } = useCredits();
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState(0); // Track how many credits user has consumed
  const [showCreditsToast, setShowCreditsToast] = useState(false);
  
  // Recent generations for the bottom section
  const { generations: recentGenerations, refresh: refreshGenerations } = useGenerations();
  const [lastCreditsRemaining, setLastCreditsRemaining] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [resolution, setResolution] = useState<'2K' | '4K'>('2K');
  
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
    setBrandData(brand);
    // setBackgrounds removed - textures disabled
    setVisualIdeas(Array.isArray(brand.visualConcepts) ? brand.visualConcepts : []);

    // SYNC images with same priority as handleValidateBento
    // This ensures returning users get the same quality images as new users
    const labeledImages = Array.isArray(brand.labeledImages) ? brand.labeledImages : [];
    
    // Priority order: logo first, then reference, product, app_ui, others
    const logoImg = brand.logo ? [brand.logo] : [];
    const referenceImgs = labeledImages.filter((img: any) => img.category === 'reference').map((img: any) => img.url);
    const productImgs = labeledImages.filter((img: any) => img.category === 'product').map((img: any) => img.url);
    const appImgs = labeledImages.filter((img: any) => img.category === 'app_ui').map((img: any) => img.url);
    const otherImgs = labeledImages.filter((img: any) => !['main_logo', 'reference', 'product', 'app_ui'].includes(img.category)).map((img: any) => img.url);
    
    // Combine in priority order with fallback to legacy images array
    const fallback = Array.isArray(brand.images) ? brand.images : [];
    const allImages = [...new Set([...logoImg, ...referenceImgs, ...productImgs, ...appImgs, ...otherImgs, ...fallback])].filter(Boolean);
    
    setUploadedImages(allImages.slice(0, 8)); // Same limit as handleValidateBento

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
    const lastUsedId = getLastUsedBrandId();
    
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
  }, [brandId, analyzeUrl, hasCheckedBrands]);
  
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
      setStatusMessage(locale === 'fr' ? 'Chargement de la marque...' : 'Loading brand...');
      setProgress(5);
      
      timer = setInterval(() => {
        setProgress((prev) => prev >= 90 ? prev : prev + Math.random() * 15);
      }, 500);
    }

    try {
      const response = await fetch(`/api/brand/${id}`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load brand');
      }
      
      if (timer) clearInterval(timer);
      setProgress(100);
      hydrateBrand(data.brand);
      setSelectedBrandId(id);
      setLastUsedBrandId(id);
      
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
      showToast(error.message || (locale === 'fr' ? 'Erreur pendant le chargement' : 'Error loading'), 'error');
      setStep('url');
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
      setStatusMessage(locale === 'fr' ? 'Chargement de la marque...' : 'Loading brand...');
      
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
        setLastUsedBrandId(parseInt(brandId));
        
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
        setProgress(100);
        hydrateBrand(data.brand);
        setStatus('idle');
        
        setTimeout(() => {
            setStep('logo-confirm');
            if (data.brand?.logo) {
              showToast('Logo détecté !', 'success');
            } else {
              showToast('Analyse terminée — uploadez votre logo', 'info');
            }
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
      setProgress(100);
      hydrateBrand(data.brand);
      setStatus('idle');
      
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
    
    // Priority 1: Pain point with emotional hook (most engaging!)
    // Check multiple sources for pain points
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
      // Clean up the pain point text for use in hook
      const cleanPainPoint = mainPainPoint.replace(/^[0-9%]+\s*(of|des|de)\s*/i, '').trim();
      const hooks = [
        `Vous aussi vous en avez marre de "${cleanPainPoint.toLowerCase()}" ?`,
        `Stop. ${cleanPainPoint}. Voici la solution.`,
        `${cleanPainPoint} ? On a la réponse.`,
        `Le problème que personne ne veut voir : ${cleanPainPoint.toLowerCase()}`,
      ];
      return {
        brief: hooks[Math.floor(Math.random() * hooks.length)],
        templateId: 'stat'
      };
    }

    // Priority 2: Trend with urgency (timely content)
    const trend = insights.find((i: any) => i.type === 'trend' && i.painPoint);
    if (trend?.painPoint) {
      return {
        brief: `📈 ${trend.painPoint} — Comment ${brandName} vous aide à en profiter`,
        templateId: 'announcement'
      };
    }

    // Priority 3: Competitor positioning (differentiator)
    const competitor = insights.find((i: any) => i.type === 'competitive');
    if (competitor?.painPoint) {
        return {
        brief: competitor.painPoint,
        templateId: 'expert'
      };
    }

    // Priority 4: Real stat with impact
    const realStats = contentNuggets.realStats || [];
    if (realStats.length > 0) {
      const stat = realStats[0];
      return {
        brief: `${stat} — Voici comment on y arrive`,
          templateId: 'stat'
        };
    }

    // Priority 5: Real testimonial
    const testimonials = contentNuggets.testimonials || [];
    if (testimonials.length > 0 && testimonials[0].quote) {
      const t = testimonials[0];
      return {
        brief: `"${t.quote}" — ${t.author || 'Un client satisfait'}`,
        templateId: 'quote'
      };
    }

    // Priority 6: Feature as benefit (transform feature into hook)
    if (features.length > 0) {
      const feature = features[0];
      const hooks = [
        `Comment ${feature.toLowerCase()} change tout pour nos clients`,
        `${feature} : le game-changer que vous attendiez`,
        `Pourquoi ${feature.toLowerCase()} fait la différence`,
      ];
      return {
        brief: hooks[Math.floor(Math.random() * hooks.length)],
        templateId: 'product'
      };
    }

    // Priority 7: Tagline or description
    if (brand.tagline && brand.tagline.length > 10) {
      return {
        brief: brand.tagline,
        templateId: 'announcement'
      };
    }

    // Fallback: Generic but branded
    if (brandName && brandName !== 'nous') {
      return {
        brief: `Découvrez ce que ${brandName} peut faire pour vous`,
        templateId: 'announcement'
      };
    }

    return null;
  }, []);

  const handleValidateBento = async () => {
    if (!brandData) {
      showToast('Analysez ou chargez une marque avant de continuer', 'error');
      return;
    }
    
    // SYNC images from bento: prioritize logo + relevant categories
    const labeledImages = Array.isArray(brandData.labeledImages) ? brandData.labeledImages : [];
    
    // Priority order: logo first, then reference, product, app_ui, others
    const logoImg = brandData.logo ? [brandData.logo] : [];
    const referenceImgs = labeledImages.filter((img: any) => img.category === 'reference').map((img: any) => img.url);
    const productImgs = labeledImages.filter((img: any) => img.category === 'product').map((img: any) => img.url);
    const appImgs = labeledImages.filter((img: any) => img.category === 'app_ui').map((img: any) => img.url);
    const otherImgs = labeledImages.filter((img: any) => !['main_logo', 'reference', 'product', 'app_ui'].includes(img.category)).map((img: any) => img.url);
    
    // Combine in priority order, ensuring logo is first
    const allImages = [...new Set([...logoImg, ...referenceImgs, ...productImgs, ...appImgs, ...otherImgs])].filter(Boolean);
    
    // ALWAYS sync with bento data (not conditional)
    setUploadedImages(allImages.slice(0, 8));
    
    // Save brand state to DB to persist nuggets & edits
    try {
      await handleSaveBrand();
    } catch (e) {
      console.error("Auto-save failed", e);
    }

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
    
    console.log('🐦 Early bird check:', { isEarlyBird, freshCredits: freshCredits?.credits?.isEarlyBird, cachedCredits: creditsInfo?.isEarlyBird });
    
    if (smartPrompt && allImages.length > 0 && isEarlyBird) {
      // Early bird gets 1 FREE auto-generation
      setBrief(smartPrompt.brief);
      setSelectedTemplate(smartPrompt.templateId);
      showToast(
        locale === 'fr' 
          ? '🎁 Génération offerte en cours...' 
          : '🎁 Free generation in progress...', 
        'success'
      );
      
      // Small delay to let UI update
      setTimeout(() => {
        handleGenerate(smartPrompt.brief, false, brandData, allImages.slice(0, 6), undefined, 1); // 1 image only
      }, 800);
    } else if (smartPrompt && allImages.length > 0) {
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
      showToast(locale === 'fr' ? 'Marque sauvegardée' : 'Brand saved', 'success');
    } catch (error: any) {
      console.error('Save brand error', error);
      showToast(error.message || (locale === 'fr' ? 'Erreur pendant la sauvegarde' : 'Error saving'), 'error');
    }
  };

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
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          addImagesToState([event.target.result], label);
          showToast('Image ajoutée', 'success');
        }
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
      showToast(locale === 'fr' ? 'Erreur lors du chargement du logo' : 'Error loading logo', 'error');
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
        showToast(locale === 'fr' ? 'Marque sauvegardée !' : 'Brand saved!', 'success');
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
      showToast(error.message || (locale === 'fr' ? 'Erreur pendant l\'ajout de la source' : 'Error adding source'), 'error');
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
        }));
      
      if (generationsToSave.length > 0) {
        addGenerations(generationsToSave);
      }
      window.dispatchEvent(new Event('generations-updated'));

      setGeneratedImages((prev) => [...normalized, ...prev].slice(0, 16));
      setStatus('complete');
      setProgress(100);
      showToast('Variante générée !', 'success');
      
    } catch (error: any) {
      console.error('Edit error:', error);
      setStatus('error');
      showToast(error.message || (locale === 'fr' ? 'Erreur pendant la modification' : 'Error editing'), 'error');
    } finally {
      setTimeout(() => {
        setStatus('idle');
        setProgress(0);
      }, 1200);
    }
  };

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

    setStatus('preparing');
    setStatusMessage('🎨 Le Creative Director analyse votre brief...');
    setProgress(10);

    try {
      // STEP 1: Call Creative Director API to get prompt variations + smart image selection
      let promptVariations: string[] | null = null;
      let finalGenerationPrompt: string;
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
          }
          
          // Extract reference images for style guidance
          if (cdData.concept.imageSelection?.references?.length > 0) {
            styleReferenceImages = cdData.concept.imageSelection.references;
            console.log('🎨 Reference visuals for style:', styleReferenceImages.length);
          }
          
          console.log('🎬 Creative Director:', promptVariations ? `${promptVariations.length} variations` : 'single prompt');
          console.log('🚫 Negative prompt:', negativePrompt.substring(0, 50) + '...');
          setProgress(30);
          setStatusMessage('✨ 2 créations en cours, veuillez patienter');
        } else {
          console.warn('Creative Director fallback:', cdData.error);
          finalGenerationPrompt = buildFallbackPrompt(finalPrompt, targetBrand);
        }
      } catch (cdError) {
        console.warn('Creative Director error, using fallback:', cdError);
        finalGenerationPrompt = buildFallbackPrompt(finalPrompt, targetBrand);
      }

      setProgress(40);

      // ========================================
      // IMAGE SELECTION PRIORITY (UPDATED)
      // 1. Logo ALWAYS first (protected)
      // 2. User selection is PRIORITY (not overridden by CD)
      // 3. Labels from brandData for proper context
      // ========================================
      
      const imagesToUse: string[] = [];
      
      // 1. LOGO FIRST - Always include and protect it
      console.log('🔍 LOGO DEBUG - handleGenerate:');
      console.log(`   targetBrand?.logo exists: ${!!targetBrand?.logo}`);
      console.log(`   targetBrand?.logo value: ${targetBrand?.logo ? targetBrand.logo.slice(0, 80) + '...' : 'NONE'}`);
      
      if (targetBrand?.logo) {
        imagesToUse.push(targetBrand.logo);
        imageContextMap[targetBrand.logo] = "BRAND_LOGO (CRITICAL): This is the official brand logo. Display it clearly and prominently. DO NOT distort, warp, or modify it in any way. It must remain perfectly legible.";
        console.log('✅ Logo added to imagesToUse and imageContextMap');
      } else {
        console.log('⚠️ NO LOGO in targetBrand - will check references for main_logo category');
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
      console.log('   Labels:', Object.entries(imageContextMap).map(([k, v]) => `${k.slice(-20)}: ${v.slice(0, 30)}`).slice(0, 4));

    // Add manual style references if present (with optional notes)
    if (styleRefImages.length > 0) {
      const styleRefUrls = styleRefImages.map(ref => ref.url);
      styleReferenceImages = [...styleRefUrls, ...styleReferenceImages];
      
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
      
      console.log('🎨 User style refs added:', styleRefImages.length, 'images');
      console.log('   URLs:', styleRefUrls.map(u => u.slice(0, 50) + '...'));
    }

      console.log('📤 Final style reference images:', styleReferenceImages.length);

      // STEP 2: Generate with Gemini using variations (or single prompt)
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalGenerationPrompt,
          promptVariations: promptVariations, // NEW: 4 different prompts
          negativePrompt: negativePrompt,
          imageUrls: imagesToUse,
          referenceImages: styleReferenceImages, // Style reference images
          imageContextMap: imageContextMap, // NEW: Pass explicit roles
          numImages: numImagesToGenerate, // 1 credit = 1 image
          aspectRatio,
          resolution // 2K by default, 4K for pro users
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Impossible de générer des visuels');
      }

      // Force the USER-SELECTED aspect ratio on all generated images
      // This ensures consistent display - no guessing from API response
      const rawImages = (payload.images || [])
        .map((img: any, index: number) => {
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

      // Upload data URLs to Vercel Blob to avoid localStorage quota issues
      setStatusMessage('📤 Sauvegarde des images...');
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
                // Upload failed - return null to filter out
                console.error('❌ Blob upload failed:', uploadResult.error);
                showToast(locale === 'fr' ? 'Erreur de sauvegarde' : 'Save error', 'error');
                return { ...img, url: img.url, skipSave: true }; // Mark to skip localStorage
              }
            } catch (e) {
              console.error('❌ Blob upload error:', e);
              showToast(locale === 'fr' ? 'Erreur de sauvegarde' : 'Save error', 'error');
              return { ...img, url: img.url, skipSave: true };
            }
          }
          return img;
        })
      );

      const normalized = uploadedImages as (GeneratedImage & { skipSave?: boolean })[];

      // Save to Projects (localStorage) - only save successfully uploaded images
      const generationsToSave = normalized
        .filter(img => !img.skipSave) // Don't save data URLs to localStorage
        .map(img => ({
          url: img.url,
          prompt: finalPrompt,
          templateId: selectedTemplate || undefined,
          brandId: brandData?.id || undefined,
          brandName: brandData?.name,
        }));
      
      if (generationsToSave.length > 0) {
        addGenerations(generationsToSave);
      }
      
      // Trigger update event for ProjectsView
      window.dispatchEvent(new Event('generations-updated'));

      setGeneratedImages((prev) => [...normalized, ...prev].slice(0, 16));
      setStatus('complete');
      setProgress(100);
      showToast(locale === 'fr' ? 'Visuel généré et sauvegardé !' : 'Visual generated and saved!', 'success');
      
      // ====== CREDITS TRACKING (inline upgrade card, no popup) ======
      const creditsRemaining = payload.creditsRemaining;
      const plan = payload.plan;
      
      if (creditsRemaining !== undefined) {
        setLastCreditsRemaining(creditsRemaining);
        
        // Update the credits hook so sidebar shows correct count
        updateCreditsRemaining(creditsRemaining);
        
        if (plan === 'free') {
          // Free tier can be 1 or 2 credits depending on early bird status
          const maxFreeCredits = creditsInfo?.isEarlyBird ? 2 : 1;
          setCreditsUsed(maxFreeCredits - creditsRemaining);
        }
        
        // Show toast for credits feedback (only for free users with low credits)
        if (plan === 'free' && creditsRemaining <= 1) {
          setShowCreditsToast(true);
          setTimeout(() => setShowCreditsToast(false), 4000);
        }
        
        // Note: Popup removed - now using inline upgrade card instead
      }
    } catch (error: any) {
      console.error('Generation error', error);
      setStatus('error');
      showToast(error.message || (locale === 'fr' ? 'Erreur pendant la génération' : 'Error generating'), 'error');
    } finally {
      setTimeout(() => {
        setStatus('idle');
        setProgress(0);
      }, 1200);
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
              {locale === 'fr' ? 'Chargement...' : 'Loading...'}
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
                <img src="/logo-icon.png" alt="Palette" className="w-14 h-14 object-contain" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-light text-gray-900 leading-[1.1] mb-4" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {locale === 'fr' ? "Commençons par" : "Let's start with"}<br />
                <span className="font-semibold">{locale === 'fr' ? 'votre marque.' : 'your brand.'}</span>
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
                    {locale === 'fr' ? 'Site principal *' : 'Main website *'}
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
                    <span className="font-mono text-xs uppercase tracking-wider">{locale === 'fr' ? 'Sources additionnelles' : 'Additional sources'}</span>
                    <span className="text-[10px] text-gray-300">{locale === 'fr' ? '(optionnel)' : '(optional)'}</span>
                  </summary>
                  
                  <div className="mt-6 pt-6 border-t border-gray-100 space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-300 mb-2">
                          {locale === 'fr' ? 'Réseau social 1' : 'Social network 1'}
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
                          {locale === 'fr' ? 'Réseau social 2' : 'Social network 2'}
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
                        {locale === 'fr' ? 'Autres liens (presse, notion, drive...)' : 'Other links (press, notion, drive...)'}
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
                    {locale === 'fr' ? "Vous pourrez enrichir ces sources après l'analyse." : "You can add more sources after analysis."}
                  </p>
                  
                <button
                onClick={handleAnalyzeBrand}
                disabled={!websiteUrl}
                  className="group bg-gray-900 text-white px-8 py-4 font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-blue-600"
                >
                  <span className="flex items-center gap-3">
                    {locale === 'fr' ? 'Scanner la marque' : 'Scan brand'}
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
                {locale === 'fr' ? 'Données sécurisées' : 'Secure data'}
              </span>
              <span className="w-1 h-1 bg-gray-200 rounded-full" />
              <span>~60 {locale === 'fr' ? 'secondes' : 'seconds'}</span>
              <span className="w-1 h-1 bg-gray-200 rounded-full" />
              <button 
                onClick={() => setStep('playground')} 
                className="hover:text-gray-500 transition-colors underline underline-offset-2"
              >
                {locale === 'fr' ? 'Passer cette étape' : 'Skip this step'}
              </button>
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
                Analyse en cours
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
                <span>Progression</span>
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
                  Scraping
                </span>
                <span className={`text-[9px] font-mono uppercase ${loadingStage >= 3 ? 'text-blue-600' : 'text-gray-300'}`}>
                  IA
                </span>
                <span className={`text-[9px] font-mono uppercase ${loadingStage >= 5 ? 'text-blue-600' : 'text-gray-300'}`}>
                  Enrichissement
                </span>
              </div>
            </div>

            {/* Live discovery feed */}
            <div className="w-full max-w-md mb-6">
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-2">
                Découvertes
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
                    <span>En cours...</span>
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

            {/* Time estimate */}
            <p className="mt-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
              ~60-90 secondes
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
                      className={`flex-1 px-5 py-3 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        currentLogo 
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
                          {locale === 'fr' ? 'Chargement...' : 'Loading...'}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {currentLogo 
                            ? (locale === 'fr' ? 'Uploader le vrai logo' : 'Upload correct logo')
                            : (locale === 'fr' ? 'Uploader votre logo' : 'Upload your logo')
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
                            {locale === 'fr' ? 'Chargement...' : 'Loading...'}
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {locale === 'fr' ? "C'est le bon" : "That's it"}
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
                      showToast(locale === 'fr' ? 'Vous pourrez ajouter un logo plus tard' : 'You can add a logo later', 'info');
                    }}
                    className="w-full mt-3 px-4 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {locale === 'fr' ? "Je n'ai pas de logo pour l'instant →" : "I don't have a logo yet →"}
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
      return (
        <BentoGrid
          brandData={brandData || {}}
          backgrounds={backgrounds}
          isGeneratingBackgrounds={isGeneratingBackgrounds}
          onUpdate={setBrandData}
          onValidate={handleValidateBento}
          onAddSource={() => setShowSourceManager(true)}
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
      return <CalendarView brandId={brandData?.id} />;
    }

    if (activeTab === 'projects') {
      return <ProjectsView />;
    }

    if (activeTab === 'settings') {
      return <SettingsView locale={locale} />;
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
              <h1 className="text-lg font-semibold text-gray-900 truncate">{brandData?.name || (locale === 'fr' ? 'Marque' : 'Brand')}</h1>
              <span className="text-xs text-gray-400">{locale === 'fr' ? 'Créez vos visuels' : 'Create your visuals'}</span>
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
                        showToast(locale === 'fr' ? '4K réservé aux abonnés Pro' : '4K is for Pro subscribers', 'info');
                        return;
                      }
                      setResolution(res.value);
                    }}
                    className={`text-xs px-3 py-2 transition-colors relative ${
                      resolution === res.value 
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
            {locale === 'fr' ? 'Identité' : 'Identity'}
          </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════
            ANGLES CAROUSEL - Scrollable horizontal pills, always visible
            ═══════════════════════════════════════════════════════════════════════════ */}
        {brandData && (
          <div className="mb-6">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">{locale === 'fr' ? 'Angles de contenu' : 'Content angles'}</span>
            </div>
            
            {/* AI-Generated Editorial Hooks ONLY - No mechanical templates */}
            <div className="overflow-x-auto pb-2 -mx-2 px-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="flex gap-2 flex-nowrap">
                {/* AI Editorial Hooks - curated and filtered by API */}
                {brandData.industryInsights?.slice(0, 8).map((insight: any, i: number) => {
                  const hookText = insight.painPoint || insight.hook || insight.fact;
                  if (!hookText || hookText.length < 10) return null;
                  
                  // Type-based styling
                  const typeStyles: Record<string, { emoji: string; bg: string; border: string; hover: string }> = {
                    'pain_point': { emoji: '⚡', bg: 'bg-rose-50', border: 'border-rose-200', hover: 'hover:border-rose-400' },
                    'trend': { emoji: '📈', bg: 'bg-blue-50', border: 'border-blue-200', hover: 'hover:border-blue-400' },
                    'provocation': { emoji: '🎯', bg: 'bg-purple-50', border: 'border-purple-200', hover: 'hover:border-purple-400' },
                    'social_proof': { emoji: '💬', bg: 'bg-amber-50', border: 'border-amber-200', hover: 'hover:border-amber-400' },
                    'tip': { emoji: '💡', bg: 'bg-emerald-50', border: 'border-emerald-200', hover: 'hover:border-emerald-400' },
                    'competitive': { emoji: '🏆', bg: 'bg-indigo-50', border: 'border-indigo-200', hover: 'hover:border-indigo-400' },
                  };
                  
                  const style = typeStyles[insight.type] || { emoji: '💡', bg: 'bg-gray-50', border: 'border-gray-200', hover: 'hover:border-gray-400' };
                  
                  return (
                      <button
                        key={`insight-${i}`}
                        onClick={() => {
                        // BUILD A COMPLETE BRIEF with context
                        const formatHint = aspectRatio === '9:16' ? 'Story/Reel vertical' : 
                                          aspectRatio === '16:9' ? 'Bannière horizontale' : 
                                          aspectRatio === '4:5' ? 'Post Instagram' : 'Post carré';
                        
                        const completeBrief = `Créez un visuel ${formatHint} pour ${brandData.name || 'la marque'}.

Message principal : "${hookText}"
${insight.consequence ? `\nSous-titre suggéré : "${insight.consequence}"` : ''}

Style : Professionnel, moderne, avec le logo visible en haut.
Couleurs : Utiliser la palette de la marque.`;
                        
                        setBrief(completeBrief);
                        setSelectedTemplate(insight.type === 'trend' ? 'announcement' : 'stat');
                      }}
                      className={`flex-shrink-0 px-4 py-3 border transition-all text-left max-w-[300px] ${style.bg} ${style.border} ${style.hover}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base flex-shrink-0">{style.emoji}</span>
                        <div className="min-w-0">
                          <span className="text-sm text-gray-800 line-clamp-2 font-medium">{hookText}</span>
                          {insight.consequence && (
                            <span className="text-xs text-gray-500 block mt-1 line-clamp-1">{insight.consequence}</span>
                          )}
                  </div>
                          </div>
                    </button>
                  );
                }).filter(Boolean)}
                
                {/* Fallback if no AI insights: Show a helpful message */}
                {(!brandData.industryInsights || brandData.industryInsights.length === 0) && (
                  <div className="flex-shrink-0 px-4 py-3 bg-gray-50 border border-dashed border-gray-300 text-center">
                    <span className="text-xs text-gray-500">
                      💡 Décrivez votre visuel dans la zone ci-dessous
                    </span>
              </div>
            )}
              </div>
                          </div>

            {/* No data fallback - minimal */}
              {!brandData.contentNuggets?.realStats?.length && 
               !brandData.contentNuggets?.testimonials?.length && 
               !brandData.industryInsights?.length &&
               !brandData.features?.length && (
                <div className="text-center py-4 text-gray-400">
                  <p className="text-sm">Aucune donnée exploitable trouvée</p>
                  <p className="text-xs mt-1">Ajoutez des informations dans l'identité ou écrivez librement !</p>
                </div>
              )}
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
              onChange={(e) => setBrief(e.target.value)}
              placeholder={getSmartPlaceholder(selectedTemplate, brandData)}
              className="w-full min-h-[100px] text-base resize-none outline-none placeholder:text-gray-300 leading-relaxed"
            />
          </div>

          {/* Sources Row - Side by side layout */}
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 1. STYLE REFERENCE ZONE - With drop area */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{locale === 'fr' ? 'Style à imiter' : 'Style inspiration'}</label>
                    <button
                    onClick={() => setShowStyleGallery(true)}
                    className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    ✨ {locale === 'fr' ? 'Galerie' : 'Gallery'}
                    </button>
            </div>

                {/* Selected styles + Drop zone */}
                <div className="space-y-2 mb-2">
                  {/* Selected images with note input */}
                  {styleRefImages.map((ref, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden border-2 border-blue-400">
                        <img src={ref.url} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setStyleRefImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500 text-[9px]"
                        >×</button>
                      </div>
                      <input
                        type="text"
                        placeholder="Ex: J'aime le placement du texte..."
                        value={ref.note || ''}
                        onChange={(e) => {
                          setStyleRefImages(prev => prev.map((r, idx) => 
                            idx === i ? { ...r, note: e.target.value } : r
                          ));
                        }}
                        className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 placeholder:text-gray-300 focus:border-blue-400 focus:outline-none"
                      />
                  </div>
                ))}
                  
                  {/* Drop zone - always visible if less than 3 */}
                  {styleRefImages.length < 3 && (
                    <label className="h-12 w-full border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-[10px] text-gray-400">Ajouter une inspiration</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                          if (e.target.files?.[0]) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (typeof ev.target?.result === 'string') {
                                setStyleRefImages(prev => [...prev, { url: ev.target!.result as string }].slice(0, 3));
                          }
                        };
                            reader.readAsDataURL(e.target.files[0]);
                    }
                  }} 
                />
                    </label>
                  )}
              </div>

                {/* Quick picks from curated gallery */}
                <div className="flex gap-1.5 items-center">
                  {[
                    { url: '/inspirations/ref-7.jpeg', label: 'Playful' },
                    { url: '/inspirations/ref-2.jpeg', label: 'Clean' },
                    { url: '/inspirations/ref-5.jpeg', label: 'Bold' },
                    { url: '/inspirations/ref-8.jpeg', label: 'Dark' },
                  ].filter(s => !styleRefImages.some(sel => sel.url.includes(s.url))).slice(0, 4).map((style, i) => (
                    <div 
                      key={i}
                      onClick={() => {
                        const absoluteUrl = `${window.location.origin}${style.url}`;
                        setStyleRefImages(prev => [...prev, { url: absoluteUrl }].slice(0, 3));
                      }}
                      className="relative h-10 w-10 rounded overflow-hidden cursor-pointer border border-gray-200 hover:border-blue-400 transition-all group flex-shrink-0"
                    >
                      <img src={style.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-[8px] font-medium">+</span>
                      </div>
                    </div>
                  ))}
                  {/* Gallery button */}
                  <button
                    onClick={() => setShowStyleGallery(true)}
                    className="h-10 px-3 rounded bg-gray-900 text-white text-[10px] font-medium hover:bg-gray-800 transition-all flex items-center gap-1.5 flex-shrink-0"
                  >
                    <span>🎨</span>
                    <span>{locale === 'fr' ? 'Galerie' : 'Gallery'}</span>
                  </button>
                </div>
              </div>

              {/* 2. BRAND ASSETS ZONE - Clickable to select/deselect */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Assets à utiliser</label>
                  <span className="text-[10px] text-gray-400">Cliquez pour sélectionner</span>
                </div>
                
                {/* All available brand assets - clickable to toggle */}
                <div className="flex gap-2 flex-wrap">
                  {/* Logo - always selected, can't be deselected */}
                  {brandData?.logo && (
                    <div 
                      className="relative h-14 w-14 rounded border-2 border-blue-500 overflow-hidden flex-shrink-0 cursor-default"
                      style={{
                        backgroundImage: `linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)`,
                        backgroundSize: '6px 6px',
                        backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px'
                      }}
                      title="Logo (toujours inclus)"
                    >
                      <img src={brandData.logo} className="w-full h-full object-contain p-1" alt="Logo" />
                      <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[6px] text-center py-0.5 font-bold">
                        LOGO ✓
                  </div>
                  </div>
                )}

                  {/* Other available assets from labeledImages - click to toggle selection, double-click to toggle mode */}
                  {brandData?.labeledImages?.filter((li: any) => li.url !== brandData?.logo && li.category !== 'icon').slice(0, 8).map((labeledImg: any, i: number) => {
                    const isSelected = uploadedImages.includes(labeledImg.url);
                    const isClientLogo = labeledImg.category === 'client_logo';
                    const mode = assetModes[labeledImg.url] || (labeledImg.category === 'app_ui' ? 'exact' : 'inspire');
                    const isExact = mode === 'exact';
                    
                    return (
                      <div 
                        key={i} 
                        onClick={() => {
                          if (isSelected) {
                            setUploadedImages(prev => prev.filter(img => img !== labeledImg.url));
                          } else {
                            setUploadedImages(prev => [...prev, labeledImg.url]);
                          }
                        }}
                        className={`relative h-14 w-14 rounded overflow-hidden cursor-pointer transition-all group ${
                          isSelected 
                            ? 'border-2 border-blue-500 ring-2 ring-blue-200' 
                            : 'border border-gray-200 opacity-50 hover:opacity-100 hover:border-gray-400'
                        }`}
                        title={isSelected ? (locale === 'fr' ? 'Cliquez pour retirer' : 'Click to remove') : (locale === 'fr' ? 'Cliquez pour ajouter' : 'Click to add')}
                      >
                        <img src={labeledImg.url} className="w-full h-full object-cover" />
                        {isClientLogo && (
                          <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[6px] text-center py-0.5">REF</div>
                        )}
                        {isSelected && (
                          <>
                            <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px]">✓</div>
                            {/* Mode toggle - appears on hover */}
                <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssetModes(prev => ({
                                  ...prev,
                                  [labeledImg.url]: isExact ? 'inspire' : 'exact'
                                }));
                              }}
                              className={`absolute bottom-0 left-0 right-0 text-[6px] text-center py-0.5 font-medium transition-all ${
                                isExact 
                                  ? 'bg-orange-500 text-white' 
                                  : 'bg-purple-500 text-white'
                              }`}
                              title={isExact ? 'Copie exacte - cliquez pour permettre réinterprétation' : 'Réinterprétable - cliquez pour copie exacte'}
                            >
                              {isExact ? '📋 EXACT' : '✨ LIBRE'}
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Upload more button */}
                  <label className="h-14 w-14 rounded border border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                    <span className="text-[8px] text-gray-400 mt-0.5">Upload</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
                
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
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
                onClick={() => handleGenerate()}
                disabled={status !== 'idle' || !brief.trim() || uploadedImages.length === 0}
              className="w-full group bg-gray-900 text-white py-4 font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-black flex items-center justify-center gap-3"
            >
              {status === 'preparing' || status === 'running' ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span>{locale === 'fr' ? 'Génération en cours...' : 'Generating...'}</span>
                </>
              ) : (
                <>
                  <span className="text-blue-400 text-lg">✦</span>
                  <span>{locale === 'fr' ? 'Générer' : 'Generate'}</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
              </button>
            
            {/* Validation hints */}
            {(uploadedImages.length === 0 || !brief.trim()) && (
              <div className="flex justify-center gap-4 mt-3">
                {!brief.trim() && <span className="text-xs text-amber-600">⚠ Message requis</span>}
                {uploadedImages.length === 0 && <span className="text-xs text-amber-600">⚠ Image requise</span>}
              </div>
            )}
            </div>
          </div>

        {/* ═══════════════════════════════════════════════════════════════════════════
            RESULTS SECTION
            ═══════════════════════════════════════════════════════════════════════════ */}
        
        {/* Loading State - Enhanced with brand colors */}
        {(status === 'preparing' || status === 'running') && (
          <div className="mb-8">
            {/* Status header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: brandData?.colors?.[0] || '#3B82F6' }}
                >
                  <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {locale === 'fr' ? 'Création de vos visuels...' : 'Creating your visuals...'}
                </p>
                <p className="text-xs text-gray-500">
                  {statusMessage || (locale === 'fr' ? '~30 secondes' : '~30 seconds')}
                </p>
              </div>
            </div>
            
            {/* Skeleton cards with brand gradient */}
            <div className={`grid gap-4 ${
              aspectRatio === '9:16' ? 'grid-cols-2 sm:grid-cols-3' : 
              aspectRatio === '16:9' || aspectRatio === '21:9' ? 'grid-cols-1' : 
              'grid-cols-1 sm:grid-cols-2'
            }`}>
              {[1, 2].map((i) => {
                const aspectClasses: Record<string, string> = {
                  '1:1': 'aspect-square',
                  '4:5': 'aspect-[4/5]',
                  '9:16': 'aspect-[9/16]',
                  '16:9': 'aspect-[16/9]',
                  '21:9': 'aspect-[21/9]',
                  '3:2': 'aspect-[3/2]',
                };
                const aspectClass = aspectClasses[aspectRatio] || 'aspect-square';
                
                return (
                  <div 
                    key={i} 
                    className={`${aspectClass} rounded-xl relative overflow-hidden border border-gray-200`}
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                      {/* Brand logo preview if available */}
                      {brandData?.logo && (
                        <div className="w-16 h-16 mb-4 opacity-20">
                          <img src={brandData.logo} className="w-full h-full object-contain" alt="" />
                        </div>
                      )}
                      
                      {/* Skeleton lines */}
                      <div className="space-y-2 w-full max-w-[60%]">
                        <div className="h-3 bg-gray-200/50 rounded-full animate-pulse" />
                        <div className="h-3 bg-gray-200/50 rounded-full w-3/4 mx-auto animate-pulse" style={{ animationDelay: '0.2s' }} />
                      </div>
                      
                      {/* Progress indicator */}
                      <div className="mt-6 flex items-center gap-2">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((dot) => (
                            <div 
                              key={dot}
                              className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                              style={{ animationDelay: `${dot * 0.2}s` }}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {locale === 'fr' ? `Visuel ${i}/2` : `Visual ${i}/2`}
                        </span>
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
                  ? 'Chaque génération crée 2 versions : fidèle et créative' 
                  : 'Each generation creates 2 versions: faithful and creative'}
              </p>
            </div>
          </div>
        )}

        {/* Generated Results */}
        {generatedImages.length > 0 && status === 'idle' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{locale === 'fr' ? 'Vos créations' : 'Your creations'}</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium">{generatedImages.length}</span>
              </div>
              <button
                onClick={() => setGeneratedImages([])}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                {locale === 'fr' ? 'Effacer' : 'Clear'}
              </button>
            </div>

            {/* Hint for editing */}
            <p className="text-xs text-gray-400 mb-3">
              💡 Une faute d'orthographe, un logo à corriger ou un détail à changer ? Cliquez sur ✏️ pour modifier n'importe quelle image.
            </p>

            {/* Grid adapts based on aspect ratio - vertical ratios get more width */}
            <div className={`grid gap-4 ${
              aspectRatio === '9:16' ? 'grid-cols-2 sm:grid-cols-3' : 
              aspectRatio === '16:9' || aspectRatio === '21:9' ? 'grid-cols-1' : 
              'grid-cols-1 sm:grid-cols-2'
            }`}>
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
                    title={locale === 'fr' ? 'Voir' : 'View'}
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
                    title={locale === 'fr' ? 'Modifier' : 'Edit'}
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
                    title={locale === 'fr' ? 'Télécharger' : 'Download'}
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
          </div>
        )}

        {/* Upgrade Inline Card - shows when credits are low */}
        {generatedImages.length > 0 && status === 'idle' && lastCreditsRemaining !== null && (
          <div className="mb-8">
            <UpgradeInline 
              creditsRemaining={lastCreditsRemaining} 
              plan={creditsInfo?.plan || 'free'} 
              locale={locale} 
            />
          </div>
        )}

        {/* Empty state hint - subtle, at the bottom */}
        {generatedImages.length === 0 && status === 'idle' && brief.trim() && uploadedImages.length > 0 && (
          <div className="text-center py-8 border-t border-gray-100">
            <p className="text-sm text-gray-400">
              ✨ {locale === 'fr' ? 'Cliquez sur' : 'Click'} <span className="font-medium text-gray-600">{locale === 'fr' ? '"Générer"' : '"Generate"'}</span> {locale === 'fr' ? 'pour créer' : 'to create'}
            </p>
          </div>
        )}

        {/* Recent Visuals - bottom section */}
        <RecentVisuals
          generations={recentGenerations}
          onViewAll={() => setActiveTab('projects')}
          onImageClick={(gen) => {
            // Convert Generation to GeneratedImage format for lightbox
            setLightboxImage({
              id: gen.id,
              url: gen.url,
              aspectRatio: '1:1', // Default, we don't store this in generations
            });
          }}
          locale={locale}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#414141] font-sans selection:bg-black selection:text-white flex">
      <div className="toast-container fixed top-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 border flex items-center gap-3 bg-white animate-slide-in-right ${
              toast.type === 'error' ? 'border-red-200 text-red-600' : toast.type === 'success' ? 'border-blue-200' : 'border-gray-200'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${
              toast.type === 'success' ? 'bg-blue-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-gray-400'
            }`} />
            <span className="text-sm text-gray-900">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Style Gallery Modal */}
      <StyleGallery 
        isOpen={showStyleGallery} 
        onClose={() => setShowStyleGallery(false)}
        onSelect={(url) => {
          // Convert relative URL to absolute URL for Fal API
          const absoluteUrl = url.startsWith('/') 
            ? `${window.location.origin}${url}` 
            : url;
          console.log('🎨 Style ref selected:', absoluteUrl);
          // Add selected inspiration to styleRefImages
          setStyleRefImages(prev => [{ url: absoluteUrl }, ...prev].slice(0, 3));
          showToast('Style ajouté aux références', 'success');
        }}
      />

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
                  className={`py-3 text-sm font-medium transition-colors relative ${
                    sourceTab === tab.id ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
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
                        className={`aspect-square overflow-hidden relative cursor-pointer group border-2 transition-all ${
                          isSelected ? 'border-gray-900' : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img src={img} className="w-full h-full object-cover" />
                        <div
                          className={`absolute inset-0 bg-black/30 transition-opacity flex items-center justify-center ${
                            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
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
                ✏️ Mode édition directe
              </div>
              <h3 className="text-xl font-semibold mb-2">{locale === 'fr' ? 'Modifier cette image' : 'Edit this image'}</h3>
              <p className="text-sm text-gray-500 mb-6">
                Décrivez précisément ce que vous voulez changer. L'IA modifiera l'image en gardant le reste intact.
              </p>

              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                className="w-full h-28 p-4 border border-gray-200 resize-none mb-4 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all text-sm"
                placeholder="Ex: Change le fond en bleu nuit, ajoute un effet de lumière sur le produit, mets le logo en blanc..."
              />

              {/* Quick Logo Fix Button */}
              {brandData?.logo && (
                <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg border border-amber-300 p-1 flex-shrink-0">
                      <img src={brandData.logo} className="w-full h-full object-contain" alt="Logo" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">
                        {locale === 'fr' ? 'Logo mal reproduit ?' : 'Logo badly reproduced?'}
                      </p>
                      <p className="text-xs text-amber-700">
                        {locale === 'fr' ? 'Cliquez ici pour le corriger automatiquement' : 'Click here to fix it automatically'}
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
                      🔧 {locale === 'fr' ? 'Réparer' : 'Fix'}
                    </button>
                  </div>
                </div>
              )}

              {/* Additional Images for Editing */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Images de référence</label>
                  <span className="text-[10px] text-gray-400">{editAdditionalImages.length}/3</span>
                </div>
                <p className="text-[10px] text-gray-400 mb-2">
                  {locale === 'fr' 
                    ? '💡 Ajoutez des images pour guider la modification (ex: nouveau logo, produit, texture...)'
                    : '💡 Add images to guide the edit (e.g., new logo, product, texture...)'}
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
                Appliquer la modification
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
                  {locale === 'fr' ? 'Télécharger' : 'Download'}
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
                  {locale === 'fr' ? 'Modifier' : 'Edit'}
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
                  {locale === 'fr' ? 'Ré-générer' : 'Re-generate'}
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
                      showToast(locale === 'fr' ? 'Marque supprimée' : 'Brand deleted', 'success');
                      refreshBrands();
                      // If we deleted the current brand, reset to URL step
                      if (brandId === selectedBrandId) {
                        setBrandData(null);
                        setSelectedBrandId(null);
                        setStep('url');
                      }
                    } else {
                      showToast(data.error || (locale === 'fr' ? 'Erreur' : 'Error'), 'error');
                    }
                  } catch (err) {
                    showToast(locale === 'fr' ? 'Erreur de suppression' : 'Delete error', 'error');
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
            locale={locale}
          />
        </>
      )}

      <div className={`flex-1 transition-all duration-300 ease-out overflow-x-hidden ${step !== 'loading' && step !== 'url' && step !== 'analyzing' && step !== 'bento' ? (isSidebarCollapsed ? 'md:ml-[80px]' : 'md:ml-[240px]') : 'w-full'}`}>
        <main className={`mx-auto min-h-screen flex flex-col justify-center transition-all duration-500 ${
            step === 'bento' 
                ? 'w-full px-4 md:px-12 py-8 max-w-[1920px]'
                : step !== 'loading' && step !== 'url' && step !== 'analyzing' 
                  ? 'max-w-[900px] p-6 md:p-10 pt-20 pb-24 md:pt-10 md:pb-10' // Mobile: padding for header/nav 
                : 'max-w-[900px] p-6 md:p-10'
        }`}>
          {renderContent()}
        </main>
      </div>
      
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
