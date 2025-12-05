'use client';

import { useState, useEffect, useRef, Suspense, ChangeEvent, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from './components/Sidebar';
import BentoGrid from './components/BentoGrid';
import StyleGallery from './components/StyleGallery'; // NEW
import CalendarView from './components/CalendarView';
import ProjectsView, { addGenerations, loadFeedbackPatterns } from './components/ProjectsView';
import StrategyView from './components/StrategyView';
import { TemplateId } from '@/lib/templates';

type Step = 'url' | 'analyzing' | 'logo-confirm' | 'bento' | 'playground';

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
  const searchParams = useSearchParams();
  const brandId = searchParams.get('brandId');
  const analyzeUrl = searchParams.get('analyzeUrl'); // From Hero input

  const [showStyleGallery, setShowStyleGallery] = useState(false); // NEW
  const [step, setStep] = useState<Step>(analyzeUrl ? 'analyzing' : 'url');
  const [activeTab, setActiveTab] = useState('create');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState('Nous analysons votre identité...');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'preparing' | 'running' | 'complete' | 'error'>('idle');
  const [loadingStage, setLoadingStage] = useState(0);
  
  // Fun loading messages that cycle through
  const LOADING_STAGES = [
    { emoji: '🔍', message: 'Exploration du site...', sub: 'On scrape les pages clés' },
    { emoji: '🎨', message: 'Extraction des couleurs...', sub: 'Palette & identité visuelle' },
    { emoji: '📸', message: 'Analyse des images...', sub: 'Logo, produits, visuels' },
    { emoji: '🧠', message: 'L\'IA réfléchit...', sub: 'Analyse intelligente en cours' },
    { emoji: '🔥', message: 'Enrichissement...', sub: 'Recherche de tendances' },
    { emoji: '📊', message: 'Compilation des insights...', sub: 'Pain points & concurrents' },
    { emoji: '✨', message: 'Finalisation...', sub: 'On prépare votre brief' },
  ];
  
  // Simulated discoveries that appear during loading
  const DISCOVERY_ITEMS = [
    { threshold: 10, emoji: '🌐', text: 'Site web détecté' },
    { threshold: 20, emoji: '🖼️', text: 'Logo trouvé' },
    { threshold: 30, emoji: '🎨', text: 'Palette de couleurs extraite' },
    { threshold: 40, emoji: '📝', text: 'Tagline identifiée' },
    { threshold: 50, emoji: '🎯', text: 'Audience cible analysée' },
    { threshold: 60, emoji: '💡', text: 'Features clés repérées' },
    { threshold: 70, emoji: '📊', text: 'Données marché récupérées' },
    { threshold: 80, emoji: '🔥', text: 'Pain points détectés' },
    { threshold: 90, emoji: '✅', text: 'Brief prêt !' },
  ];
  
  // Rotating fun facts
  const FUN_FACTS = [
    "💡 On analyse jusqu'à 10 pages de votre site pour extraire le maximum d'insights.",
    "🎨 Les couleurs sont extraites directement de votre logo pour une cohérence parfaite.",
    "🔥 On recherche les tendances de votre industrie en temps réel.",
    "🧠 Notre IA analyse même les captures d'écran de votre site.",
    "📊 On identifie vos concurrents pour mieux vous positionner.",
    "✨ Chaque génération crée 2 versions : fidèle et créative.",
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
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Collapsed by default

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
  const logoUploadRef = useRef<HTMLInputElement>(null);

  const [editingImage, setEditingImage] = useState<string | null>(null);
  // Style references with optional descriptions
  const [styleRefImages, setStyleRefImages] = useState<{url: string; note?: string}[]>([]);
  const [editPrompt, setEditPrompt] = useState('');
  const [editAdditionalImages, setEditAdditionalImages] = useState<string[]>([]); // NEW: Additional images for editing
  const [visualIdeas, setVisualIdeas] = useState<string[]>([]);
  const [brief, setBrief] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [contentLanguage, setContentLanguage] = useState<'fr' | 'en' | 'es' | 'de'>('fr');
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

    const labeled = Array.isArray(brand.labeledImages) ? brand.labeledImages : [];
    const prioritized = labeled
      .filter((img: any) => ['main_logo', 'product'].includes(img.category))
      .map((img: any) => img.url);
    const fallback = Array.isArray(brand.images) ? brand.images : [];
    const selection = Array.from(new Set([...prioritized, ...fallback].filter(Boolean)));
    setUploadedImages(selection.slice(0, 6));

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

  useEffect(() => {
    if (!brandId) return;

    let cancelled = false;
    const fetchBrand = async () => {
      setStep('analyzing');
      setStatusMessage('Chargement de la marque...');
      
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
        
        // Small delay to show 100% before switching
        setTimeout(() => {
            setStep('bento');
            setActiveTab('create');
        }, 500);
        
      } catch (error: any) {
        if (!cancelled) {
          clearInterval(timer);
          console.error('Brand load error', error);
          showToast(error.message || 'Erreur pendant le chargement', 'error');
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

    try {
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
          showToast('Logo détecté !', 'success');
      }, 500);

    } catch (error: any) {
      clearInterval(timer);
      console.error('Analyze error', error);
      setStatus('error');
      setStep('url');
      showToast(error.message || 'Impossible d\'analyser ce site', 'error');
    }
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

    try {
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
          // New brands go to logo confirmation step first
          setStep('logo-confirm');
          showToast('Logo détecté !', 'success');
      }, 500);

    } catch (error: any) {
      clearInterval(timer);
      console.error('Analyze error', error);
      setStatus('error');
      setStep('url');
      showToast(error.message || 'Impossible d\'analyser ce site', 'error');
    }
  };

  // Check if user is new (no previous generations)
  const isNewUser = useCallback(() => {
    if (typeof window === 'undefined') return false;
    try {
      const data = localStorage.getItem('briefbox_generations');
      const generations = data ? JSON.parse(data) : [];
      return !Array.isArray(generations) || generations.length === 0;
    } catch {
      return true;
    }
  }, []);

  // Build a smart prompt from the best available brand data
  const buildSmartWelcomePrompt = useCallback((brand: any): { brief: string; templateId: TemplateId } | null => {
    // Priority 1: Industry insights with real data
    const insights = Array.isArray(brand.industryInsights) ? brand.industryInsights : [];
    const insightWithFact = insights.find((i: any) => i.fact && i.fact.length > 20);
    if (insightWithFact) {
      return {
        brief: `Le saviez-vous ? ${insightWithFact.fact}`,
        templateId: 'stat'
      };
    }

    // Priority 2: Real testimonial or quote
    const posts = Array.isArray(brand.suggestedPosts) ? brand.suggestedPosts : [];
    const quotePost = posts.find((p: any) => p.templateId === 'quote' && p.source === 'real_data');
    if (quotePost?.headline) {
      return {
        brief: quotePost.headline,
        templateId: 'quote'
      };
    }

    // Priority 3: Real stat from the website
    const statPost = posts.find((p: any) => p.templateId === 'stat' && (p.source === 'real_data' || p.source === 'industry_insight'));
    if (statPost) {
      const metricText = statPost.metric && statPost.metricLabel 
        ? `${statPost.metric} ${statPost.metricLabel}` 
        : statPost.headline;
      if (metricText && metricText.length > 5) {
        return {
          brief: metricText,
          templateId: 'stat'
        };
      }
    }

    // Priority 4: Any post with real data source
    const realDataPost = posts.find((p: any) => p.source === 'real_data' && p.headline);
    if (realDataPost) {
      return {
        brief: realDataPost.headline,
        templateId: realDataPost.templateId as TemplateId || 'announcement'
      };
    }

    // Priority 5: Product announcement if we have product images
    const labeledImages = Array.isArray(brand.labeledImages) ? brand.labeledImages : [];
    const hasProduct = labeledImages.some((img: any) => img.category === 'product');
    if (hasProduct && brand.name) {
      return {
        brief: `Découvrez ${brand.name} : ${brand.tagline || brand.description?.substring(0, 60) || 'une nouvelle façon de travailler'}`,
        templateId: 'product'
      };
    }

    // Priority 6: Brand announcement with tagline
    if (brand.tagline && brand.tagline.length > 10) {
      return {
        brief: brand.tagline,
        templateId: 'announcement'
      };
    }

    // Priority 7: Use brand description if meaningful
    if (brand.description && brand.description.length > 30) {
      const shortDesc = brand.description.length > 80 
        ? brand.description.substring(0, 77) + '...' 
        : brand.description;
      return {
        brief: shortDesc,
        templateId: 'announcement'
      };
    }

    // No good data found - return null to skip auto-generation
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
    
    // For new users: auto-generate 4 visuals if we have smart content
    const userIsNew = isNewUser();
    if (userIsNew && allImages.length > 0) {
      const smartPrompt = buildSmartWelcomePrompt(brandData);
      
      if (smartPrompt) {
        // We have good data - auto-generate!
        setBrief(smartPrompt.brief);
        setSelectedTemplate(smartPrompt.templateId);
        showToast('Bienvenue ! Génération de vos premiers visuels...', 'success');
        
        // Small delay to let UI update
      setTimeout(() => {
          handleGenerate(smartPrompt.brief, false, brandData, allImages.slice(0, 6));
        }, 600);
      } else {
        // No good data - redirect to strategy for manual selection
        setActiveTab('strategy');
        showToast('Découvrez vos opportunités de contenu', 'info');
      }
    } else {
      // Existing user - redirect to strategy
      setActiveTab('strategy');
      showToast('Découvrez vos opportunités de contenu', 'info');
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
      showToast('Marque sauvegardée', 'success');
    } catch (error: any) {
      console.error('Save brand error', error);
      showToast(error.message || 'Erreur pendant la sauvegarde', 'error');
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
      showToast('Erreur lors du chargement du logo', 'error');
      setIsUploadingLogo(false);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  // Confirm logo and proceed to bento
  const handleConfirmLogo = async () => {
    if (!brandData) return;
    
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
        showToast('Marque sauvegardée !', 'success');
      }
    } catch (error) {
      console.error('Error saving brand:', error);
      // Continue anyway - we'll try to save later
    }
    
    // Proceed to bento grid
    setStep('bento');
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
      showToast(error.message || 'Erreur pendant l\'ajout de la source', 'error');
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
          numImages: 2,
          aspectRatio,
          resolution
        })
      });

      const payload = await response.json();
      
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Échec de la modification');
      }

      setProgress(80);

      const normalized: GeneratedImage[] = (payload.images || [])
        .map((img: any, index: number) => {
          const url = typeof img === 'string' ? img : img?.url || img?.image;
          if (!url) return null;
          return {
            id: `edit-${createId()}-${index}`,
            url,
            aspectRatio: img?.aspect_ratio || aspectRatio
          };
        })
        .filter(Boolean) as GeneratedImage[];

      if (!normalized.length) {
        throw new Error('Aucune image modifiée retournée');
      }

      // Save to local generations
      const generationsToSave = normalized.map(img => ({
        url: img.url,
        prompt: `[EDIT] ${editInstruction}`,
        brandName: brandData?.name,
      }));
      addGenerations(generationsToSave);
      window.dispatchEvent(new Event('generations-updated'));

      setGeneratedImages((prev) => [...normalized, ...prev].slice(0, 16));
      setStatus('complete');
      setProgress(100);
      showToast('Variante générée !', 'success');
      
    } catch (error: any) {
      console.error('Edit error:', error);
      setStatus('error');
      showToast(error.message || 'Erreur pendant la modification', 'error');
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
    templateOverride?: TemplateId
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
      if (targetBrand?.logo) {
        imagesToUse.push(targetBrand.logo);
        imageContextMap[targetBrand.logo] = "BRAND_LOGO (CRITICAL): This is the official brand logo. Display it clearly and prominently. DO NOT distort, warp, or modify it in any way. It must remain perfectly legible.";
        console.log('🏷️ Logo added first:', targetBrand.logo.slice(0, 50));
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
          numImages: 2, // Reduced to 2 for cost optimization
          aspectRatio,
          resolution // 2K by default, 4K for pro users
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Impossible de générer des visuels');
      }

      const normalized: GeneratedImage[] = (payload.images || [])
        .map((img: any, index: number) => {
          const url = typeof img === 'string' ? img : img?.url || img?.image;
          if (!url) return null;
          return {
            id: `${createId()}-${index}`,
            url,
            aspectRatio: img?.aspect_ratio || img?.metadata?.aspect_ratio || aspectRatio
          };
        })
        .filter(Boolean) as GeneratedImage[];

      if (!normalized.length) {
        throw new Error('Aucune image retournée par le générateur');
      }

      // Save to Projects (localStorage)
      const generationsToSave = normalized.map(img => ({
        url: img.url,
        prompt: finalPrompt,
        templateId: selectedTemplate || undefined,
        brandName: targetBrand?.name,
      }));
      addGenerations(generationsToSave);
      
      // Trigger update event for ProjectsView
      window.dispatchEvent(new Event('generations-updated'));

      setGeneratedImages((prev) => [...normalized, ...prev].slice(0, 16));
      setStatus('complete');
      setProgress(100);
      showToast('Visuels générés et sauvegardés', 'success');
    } catch (error: any) {
      console.error('Generation error', error);
      setStatus('error');
      showToast(error.message || 'Erreur pendant la génération', 'error');
    } finally {
      setTimeout(() => {
        setStatus('idle');
        setProgress(0);
      }, 1200);
    }
  };

  const renderContent = () => {
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
          <div className="absolute bottom-32 left-16 w-48 h-48 bg-gradient-to-tr from-emerald-200/15 to-teal-300/10 rounded-full blur-3xl" />

          <div className="relative z-10 w-full max-w-2xl mx-auto px-6">
            {/* Header */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Brand Scanner</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-light text-gray-900 leading-[1.1] mb-4" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Commençons par<br />
                <span className="font-semibold">votre identité.</span>
              </h1>
              
              <p className="text-gray-400 text-lg max-w-md leading-relaxed">
                Notre IA analyse votre site en quelques secondes — logo, couleurs, ton, positionnement.
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
                    Site principal *
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
                    <span className="font-mono text-xs uppercase tracking-wider">Sources additionnelles</span>
                    <span className="text-[10px] text-gray-300">(optionnel)</span>
                  </summary>
                  
                  <div className="mt-6 pt-6 border-t border-gray-100 space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-300 mb-2">
                          Réseau social 1
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
                          Réseau social 2
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
                        Autres liens (presse, notion, drive...)
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
                    Vous pourrez enrichir ces sources après l'analyse.
                  </p>
                  
                <button
                onClick={handleAnalyzeBrand}
                disabled={!websiteUrl}
                  className="group bg-gray-900 text-white px-8 py-4 font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-emerald-600"
                >
                  <span className="flex items-center gap-3">
                    Scanner la marque
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
                Données sécurisées
              </span>
              <span className="w-1 h-1 bg-gray-200 rounded-full" />
              <span>~60 secondes</span>
              <span className="w-1 h-1 bg-gray-200 rounded-full" />
              <button 
                onClick={() => setStep('playground')} 
                className="hover:text-gray-500 transition-colors underline underline-offset-2"
              >
                Passer cette étape
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
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-emerald-200/20 to-emerald-100/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-gradient-to-tr from-amber-100/15 to-transparent rounded-full blur-3xl" />

          {/* Corner frames */}
          <div className="absolute top-8 left-8 w-16 h-16 border-l border-t border-gray-200" />
          <div className="absolute bottom-8 right-8 w-16 h-16 border-r border-b border-gray-200" />

          <div className="relative z-10 flex flex-col items-center max-w-lg w-full px-6">
            {/* Status label */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
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
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 ease-out rounded-full"
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
                <span className={`text-[9px] font-mono uppercase ${loadingStage >= 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                  Scraping
                </span>
                <span className={`text-[9px] font-mono uppercase ${loadingStage >= 3 ? 'text-emerald-600' : 'text-gray-300'}`}>
                  IA
                </span>
                <span className={`text-[9px] font-mono uppercase ${loadingStage >= 5 ? 'text-emerald-600' : 'text-gray-300'}`}>
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
                    <span className="text-emerald-500 text-[10px]">✓</span>
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
          <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-emerald-200/20 to-teal-300/10 rounded-full blur-3xl" />
          <div className="absolute bottom-32 left-16 w-48 h-48 bg-gradient-to-tr from-amber-200/15 to-orange-300/10 rounded-full blur-3xl" />

          <div className="relative z-10 w-full max-w-xl mx-auto px-6">
            {/* Header - matching URL step style */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
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
                
                {/* Warning if logo looks suspicious */}
                {currentLogo && !currentLogo.includes(brandData?.name?.toLowerCase().replace(/\s+/g, '')) && (
                  <div className="px-6 py-3 bg-amber-50 border-t border-amber-100 flex items-center gap-2 text-amber-700 text-sm">
                    <span>⚠️</span>
                    <span>Ce logo ne semble pas correspondre à <strong>{brandData?.name}</strong>. Vérifiez ou uploadez le bon.</span>
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
                          Chargement...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {currentLogo ? 'Uploader le vrai logo' : 'Uploader votre logo'}
                        </span>
                      )}
                    </button>
                    
                    {currentLogo && (
                      <button
                        onClick={handleConfirmLogo}
                        disabled={isUploadingLogo}
                        className="flex-1 px-5 py-3 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          C'est le bon
                        </span>
                      </button>
                    )}
              </div>
                  
                  {/* No logo option */}
                  <button
                    onClick={() => {
                      // Clear logo and continue
                      setBrandData((prev: any) => ({ ...prev, logo: null }));
                      setStep('bento');
                      showToast('Vous pourrez ajouter un logo plus tard', 'info');
                    }}
                    className="w-full mt-3 px-4 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Je n'ai pas de logo pour l'instant →
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
            // Go back to URL input to restart analysis or change URL
            setStep('url');
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

    // Strategy view merged into Create - angles carousel at top of the page

    return (
      <div className="animate-fade-in max-w-5xl mx-auto px-4">
        {/* ═══════════════════════════════════════════════════════════════════════════
            VERTICAL STACKED CREATIVE SPACE
            Clean top-to-bottom flow: Header → Ideas → Form → Results
            ═══════════════════════════════════════════════════════════════════════════ */}
        
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 flex items-center justify-center">
              <span className="text-white text-lg">✦</span>
          </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{brandData?.name || 'Marque'}</h1>
              <span className="text-xs text-gray-400">Créez vos visuels</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
              {RESOLUTIONS.map(res => (
                <button
                  key={res.value}
                  onClick={() => setResolution(res.value)}
                  className={`text-xs px-3 py-2 transition-colors relative ${
                    resolution === res.value 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-white text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {res.label}
                  {res.badge && resolution !== res.value && (
                    <span className="absolute -top-1 -right-1 text-[8px] bg-emerald-500 text-white px-1 rounded">
                      {res.badge}
                    </span>
                  )}
                </button>
              ))}
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
            onClick={() => setStep('bento')}
              className="px-3 py-2 border border-gray-200 text-xs text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors flex items-center gap-2"
          >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Identité
          </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════
            ANGLES CAROUSEL - Scrollable horizontal pills, always visible
            ═══════════════════════════════════════════════════════════════════════════ */}
        {brandData && (
          <div className="mb-6">
            {/* Section header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Angles de contenu</span>
                </div>
              <button 
                onClick={() => setShowStyleGallery(true)}
                className="text-[10px] font-medium text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-1"
              >
                <span>🎨</span>
                <span>Style ref</span>
              </button>
            </div>
            
            {/* Scrollable pills - More engaging hooks */}
            <div className="space-y-2 overflow-x-auto pb-2 -mx-2 px-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {/* Row 1: Pain Points (new format) + Stats + Testimonials */}
              <div className="flex gap-2 flex-nowrap">
                {/* NEW: Pain Points - priority display */}
                {brandData.industryInsights?.slice(0, 3).map((insight: any, i: number) => {
                  const text = insight.painPoint || insight.fact || insight.didYouKnow;
                  const typeEmoji = insight.type === 'pain_point' ? '⚡' : insight.type === 'trend' ? '📈' : insight.type === 'cost_of_inaction' ? '⚠️' : '💡';
                  return (
                    <button
                      key={`pain-${i}`}
                      onClick={() => {
                        setSelectedTemplate('stat');
                        setBrief(text);
                      }}
                      className={`flex-shrink-0 px-3 py-2 border transition-all text-left max-w-[280px] ${
                        brief === text 
                          ? 'bg-rose-50 border-rose-400' 
                          : 'bg-white border-gray-200 hover:border-rose-400 hover:bg-rose-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-sm flex-shrink-0">{typeEmoji}</span>
                        <span className="text-xs text-gray-700 line-clamp-2">{text?.slice(0, 60)}{text?.length > 60 ? '...' : ''}</span>
                  </div>
                    </button>
                  );
                })}
                
                {/* Real Stats with better copy */}
                {brandData.contentNuggets?.realStats?.slice(0, 2).map((stat: string, i: number) => (
              <button
                        key={`stat-${i}`}
              onClick={() => {
                          setSelectedTemplate('stat');
                      setBrief(`${stat} — voici comment`);
                        }}
                    className={`flex-shrink-0 px-3 py-2 border transition-all text-left max-w-[220px] ${
                      brief.includes(stat) ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/50'
                    }`}
                      >
                        <div className="flex items-center gap-2">
                      <span className="text-sm">📊</span>
                      <span className="text-xs text-gray-700 truncate">{stat.slice(0, 35)}</span>
                        </div>
              </button>
            ))}
                
                    {/* Testimonials */}
                    {brandData.contentNuggets?.testimonials?.slice(0, 2).map((t: any, i: number) => (
                      <button
                        key={`quote-${i}`}
                        onClick={() => {
                          setSelectedTemplate('quote');
                      setBrief(`"${t.quote}" — ${t.author}${t.company ? `, ${t.company}` : ''}`);
                        }}
                    className="flex-shrink-0 px-3 py-2 bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left max-w-[200px]"
                      >
                        <div className="flex items-center gap-2">
                      <span className="text-sm">💬</span>
                      <span className="text-xs text-gray-700 truncate italic">"{t.quote?.slice(0, 25)}..."</span>
        </div>
                      </button>
                    ))}
                  </div>
              
              {/* Row 2: Features as hooks, not descriptions */}
              <div className="flex gap-2 flex-nowrap">
                {/* Features as hooks */}
                {brandData.features?.slice(0, 4).map((f: string, i: number) => {
                  const hooks = [
                    `Comment ${f.toLowerCase()} change tout`,
                    `${f} : le secret des pros`,
                    `Pourquoi ${f.toLowerCase()} fait la différence`,
                    `${f} en 30 secondes`
                  ];
                  return (
                      <button
                        key={`feat-${i}`}
                        onClick={() => {
                          setSelectedTemplate('product');
                        setBrief(hooks[i % hooks.length]);
                        }}
                      className="flex-shrink-0 px-3 py-1.5 bg-purple-50/50 border border-purple-200 hover:border-purple-400 transition-all text-xs text-purple-700 hover:text-purple-900"
                      >
                      ✨ {f.slice(0, 22)}{f.length > 22 ? '...' : ''}
                      </button>
                  );
                })}
                
                {/* Key Points as "Why" questions */}
                {brandData.keyPoints?.slice(0, 2).map((kp: string, i: number) => (
                      <button
                    key={`kp-${i}`}
                        onClick={() => {
                          setSelectedTemplate('expert');
                      setBrief(`Pourquoi ${kp.toLowerCase()} ?`);
                        }}
                    className="flex-shrink-0 px-3 py-1.5 bg-amber-50/50 border border-amber-200 hover:border-amber-400 transition-all text-xs text-amber-700 hover:text-amber-900"
                      >
                    🎯 {kp.slice(0, 20)}{kp.length > 20 ? '...' : ''}
                      </button>
                    ))}
                
                {/* Quick suggestion - "problem agitation" style */}
                {brandData.targetAudience && (
                        <button
                          onClick={() => {
                      setSelectedTemplate('stat');
                      setBrief(`${brandData.targetAudience}, vous en avez marre de... ?`);
                          }}
                    className="flex-shrink-0 px-3 py-1.5 bg-rose-50/50 border border-rose-200 hover:border-rose-400 transition-all text-xs text-rose-700 hover:text-rose-900"
                        >
                    🎤 Interpeller votre cible
                        </button>
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
                  className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-30 flex items-center gap-1"
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
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Style à imiter</label>
                  <button 
                    onClick={() => setShowStyleGallery(true)}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    ✨ Galerie
                  </button>
                    </div>
                
                {/* Selected styles + Drop zone */}
                <div className="space-y-2 mb-2">
                  {/* Selected images with note input */}
                  {styleRefImages.map((ref, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden border-2 border-emerald-400">
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
                        className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 placeholder:text-gray-300 focus:border-emerald-400 focus:outline-none"
                      />
                  </div>
                ))}
                  
                  {/* Drop zone - always visible if less than 3 */}
                  {styleRefImages.length < 3 && (
                    <label className="h-12 w-full border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all">
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
                      className="relative h-10 w-10 rounded overflow-hidden cursor-pointer border border-gray-200 hover:border-emerald-400 transition-all group flex-shrink-0"
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
                    <span>Galerie</span>
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
                      className="relative h-14 w-14 rounded border-2 border-emerald-500 overflow-hidden flex-shrink-0 cursor-default"
                      style={{
                        backgroundImage: `linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)`,
                        backgroundSize: '6px 6px',
                        backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px'
                      }}
                      title="Logo (toujours inclus)"
                    >
                      <img src={brandData.logo} className="w-full h-full object-contain p-1" alt="Logo" />
                      <div className="absolute bottom-0 left-0 right-0 bg-emerald-600 text-white text-[6px] text-center py-0.5 font-bold">
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
                            ? 'border-2 border-emerald-500 ring-2 ring-emerald-200' 
                            : 'border border-gray-200 opacity-50 hover:opacity-100 hover:border-gray-400'
                        }`}
                        title={isSelected ? 'Cliquez pour retirer' : 'Cliquez pour ajouter'}
                      >
                        <img src={labeledImg.url} className="w-full h-full object-cover" />
                        {isClientLogo && (
                          <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[6px] text-center py-0.5">REF</div>
                        )}
                        {isSelected && (
                          <>
                            <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px]">✓</div>
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
                  <label className="h-14 w-14 rounded border border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all flex-shrink-0">
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
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
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
                  <span>Génération en cours...</span>
                </>
              ) : (
                <>
                  <span className="text-emerald-400 text-lg">✦</span>
                  <span>Générer 2 visuels</span>
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
        
        {/* Loading State */}
        {(status === 'preparing' || status === 'running') && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-500">Création en cours...</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="aspect-square bg-gray-100 border border-gray-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent" style={{ animation: 'shimmer 2s infinite' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-gray-400">~30 secondes</span>
        </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generated Results */}
        {generatedImages.length > 0 && status === 'idle' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Vos créations</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium">{generatedImages.length}</span>
              </div>
              <button
                onClick={() => setGeneratedImages([])}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Effacer
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {generatedImages.map((img) => (
              <div
                key={img.id}
                  className={`bg-gray-100 overflow-hidden relative group cursor-pointer border border-gray-200 hover:border-gray-400 transition-all hover:shadow-xl ${
                  img.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'
                }`}
              >
                <img src={img.url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => setLightboxImage(img.url)}
                      className="w-11 h-11 bg-white text-gray-900 flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
                    title="Voir"
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
                    title="Modifier"
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
                          link.download = `briefbox-${Date.now()}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      } catch (err) {
                        window.open(img.url, '_blank');
                      }
                    }}
                      className="w-11 h-11 bg-white text-gray-900 flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
                    title="Télécharger"
                  >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                  </button>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}

        {/* Empty state hint - subtle, at the bottom */}
        {generatedImages.length === 0 && status === 'idle' && brief.trim() && uploadedImages.length > 0 && (
          <div className="text-center py-8 border-t border-gray-100">
            <p className="text-sm text-gray-400">
              ✨ Cliquez sur <span className="font-medium text-gray-600">"Générer 2 visuels"</span> pour créer
            </p>
          </div>
        )}
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
              toast.type === 'error' ? 'border-red-200 text-red-600' : toast.type === 'success' ? 'border-emerald-200' : 'border-gray-200'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${
              toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-gray-400'
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
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 mb-2">
                ✏️ Mode édition directe
              </div>
              <h3 className="text-xl font-semibold mb-2">Modifier cette image</h3>
              <p className="text-sm text-gray-500 mb-6">
                Décrivez précisément ce que vous voulez changer. L'IA modifiera l'image en gardant le reste intact.
              </p>

              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                className="w-full h-28 p-4 border border-gray-200 resize-none mb-4 bg-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none transition-all text-sm"
                placeholder="Ex: Change le fond en bleu nuit, ajoute un effet de lumière sur le produit, mets le logo en blanc..."
              />

              {/* Additional Images for Editing */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Images de référence (optionnel)</label>
                  <span className="text-[10px] text-gray-400">{editAdditionalImages.length}/3</span>
                </div>
                <p className="text-[10px] text-gray-400 mb-2">
                  💡 Pour remplacer le logo : uploadez votre logo ici et écrivez "remplace le logo"
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
                <span className="text-emerald-400">✏️</span>
                Appliquer la modification
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <img src={lightboxImage} alt="Full view" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
          <button
            className="absolute top-6 right-6 w-10 h-10 border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 transition"
            onClick={() => setLightboxImage(null)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {step !== 'url' && step !== 'analyzing' && step !== 'bento' && (
        <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            brandData={brandData} 
            onEditBrand={() => setStep('bento')} 
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      )}

      <div className={`flex-1 transition-all duration-300 ease-out overflow-x-hidden ${step !== 'url' && step !== 'analyzing' && step !== 'bento' ? (isSidebarCollapsed ? 'ml-[88px]' : 'ml-[276px]') : 'w-full'}`}>
        <main className={`mx-auto min-h-screen flex flex-col justify-center transition-all duration-500 ${
            step === 'bento' 
                ? 'w-full px-4 md:px-12 py-8 max-w-[1920px]' 
                : 'max-w-[900px] p-6 md:p-10'
        }`}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default function Playground() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <PlaygroundContent />
    </Suspense>
  );
}
