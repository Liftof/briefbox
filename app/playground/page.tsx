'use client';

import { useState, useEffect, useRef, Suspense, ChangeEvent, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from './components/Sidebar';
import BentoGrid from './components/BentoGrid';
import CalendarView from './components/CalendarView';
import ProjectsView, { addGenerations, loadFeedbackPatterns } from './components/ProjectsView';
import { TemplateId } from '@/lib/templates';

type Step = 'url' | 'analyzing' | 'bento' | 'playground';

// Template definitions for the UI
const TEMPLATES = [
  { id: 'stat' as TemplateId, icon: '📊', name: 'Stat', desc: 'Chiffre clé impactant', placeholder: '+47% de croissance en 2024' },
  { id: 'announcement' as TemplateId, icon: '📢', name: 'Annonce', desc: 'Lancement, news', placeholder: 'Nouveau: notre Dashboard V2 est disponible' },
  { id: 'quote' as TemplateId, icon: '💬', name: 'Citation', desc: 'Témoignage client', placeholder: 'Grâce à [Brand], on a doublé notre ROI' },
  { id: 'event' as TemplateId, icon: '🎤', name: 'Event', desc: 'Webinar, conférence', placeholder: 'Webinar: Les tendances 2025' },
  { id: 'expert' as TemplateId, icon: '👤', name: 'Expert', desc: 'Thought leadership', placeholder: 'Interview de notre CEO sur l\'innovation' },
  { id: 'product' as TemplateId, icon: '✨', name: 'Produit', desc: 'Feature, showcase', placeholder: 'Découvrez notre nouvelle fonctionnalité' },
];
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

  const [step, setStep] = useState<Step>('url');
  const [activeTab, setActiveTab] = useState('create');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState('Nous analysons votre identité...');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'preparing' | 'running' | 'complete' | 'error'>('idle');
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [brandData, setBrandData] = useState<any | null>(null);
  const [backgrounds, setBackgrounds] = useState<string[]>([]);
  const [isGeneratingBackgrounds, setIsGeneratingBackgrounds] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const [showSourceManager, setShowSourceManager] = useState(false);
  const [sourceTab, setSourceTab] = useState<'library' | 'upload' | 'url'>('library');
  const sourceManagerInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newUploadLabel, setNewUploadLabel] = useState('product');

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [sourceUrl, setSourceUrl] = useState('');
  const [socialLinks, setSocialLinks] = useState<string[]>(['', '']);
  const [otherLinks, setOtherLinks] = useState<string>('');
  const [isAddingSource, setIsAddingSource] = useState(false);

  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [visualIdeas, setVisualIdeas] = useState<string[]>([]);
  const [brief, setBrief] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [contentLanguage, setContentLanguage] = useState<'fr' | 'en' | 'es' | 'de'>('fr');
  
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
  }, [showToast]);

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
  }, [showToast]);

  const generateBackgroundsForBrand = useCallback(
    async (brand: any) => {
      if (!brand) return;
      if (isGeneratingBackgrounds) return;
      const alreadyHasBackgrounds = Array.isArray(brand.backgrounds) && brand.backgrounds.length > 0;
      const availablePrompts = Array.isArray(brand.backgroundPrompts) ? brand.backgroundPrompts.filter(Boolean) : [];
      if (alreadyHasBackgrounds || availablePrompts.length === 0) return;

      try {
        setIsGeneratingBackgrounds(true);
        const response = await fetch('/api/backgrounds/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand: {
              name: brand.name,
              colors: brand.colors,
              aesthetic: brand.aesthetic,
              toneVoice: brand.toneVoice,
              visualMotifs: brand.visualMotifs,
              backgroundPrompts: availablePrompts.slice(0, 3)
            }
          })
        });

        const data = await response.json();
        if (response.ok && data.success && Array.isArray(data.backgrounds) && data.backgrounds.length > 0) {
          setBackgrounds(data.backgrounds);
          setBrandData((prev: any) => (prev ? { ...prev, backgrounds: data.backgrounds } : prev));
        }
      } catch (error) {
        console.error('Background generation error', error);
      } finally {
        setIsGeneratingBackgrounds(false);
      }
    },
    [isGeneratingBackgrounds]
  );

  const hydrateBrand = (brand: any) => {
    if (!brand) return;
    setBrandData(brand);
    setBackgrounds(Array.isArray(brand.backgrounds) ? brand.backgrounds : []);
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

    if ((!brand.backgrounds || brand.backgrounds.length === 0) && brand.backgroundPrompts?.length) {
      generateBackgroundsForBrand(brand);
    }
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
          setStep('bento');
          setActiveTab('create');
          showToast('Marque analysée', 'success');
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

  const handleValidateBento = () => {
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
        // No good data - let user choose
        showToast('Choisissez un angle créatif pour commencer', 'info');
      }
    } else {
      // Existing user - let them choose
      showToast('Choisissez un angle créatif pour commencer', 'info');
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

  const handleGenerate = async (
    customPrompt?: string,
    useCurrentBrief = true,
    brandOverride?: any,
    referenceOverride?: string[]
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
      
      try {
        // Load feedback patterns to personalize generation
        const feedbackPatterns = loadFeedbackPatterns();
        
        const cdResponse = await fetch('/api/creative-director', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brief: finalPrompt,
            brand: targetBrand,
            templateId: selectedTemplate || undefined,
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
          setStatusMessage('✨ 4 variations créatives préparées...');
        } else {
          console.warn('Creative Director fallback:', cdData.error);
          finalGenerationPrompt = buildFallbackPrompt(finalPrompt, targetBrand);
        }
      } catch (cdError) {
        console.warn('Creative Director error, using fallback:', cdError);
        finalGenerationPrompt = buildFallbackPrompt(finalPrompt, targetBrand);
      }

      setProgress(40);

      // Use smart image selection or fall back to user selection
      const imagesToUse = smartImageSelection && smartImageSelection.length > 0 
        ? smartImageSelection 
        : references;

      // STEP 2: Generate with Fal using variations (or single prompt)
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalGenerationPrompt,
          promptVariations: promptVariations, // NEW: 4 different prompts
          negativePrompt: negativePrompt,
          imageUrls: imagesToUse,
          referenceImages: styleReferenceImages, // Style reference images
          numImages: 4,
          aspectRatio: '1:1'
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
            aspectRatio: img?.aspect_ratio || img?.metadata?.aspect_ratio || '1:1'
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
            <div className="flex items-center gap-2 mb-8">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                Analyse en cours
              </span>
            </div>

            {/* Main heading */}
            <h2 className="text-3xl md:text-4xl text-center mb-4">
              <span className="font-light text-gray-400">{statusMessage.split(' ')[0]}</span>
              <br />
              <span className="font-semibold text-gray-900">{statusMessage.split(' ').slice(1).join(' ')}</span>
            </h2>

            {/* Progress section */}
            <div className="w-full max-w-sm mt-8 mb-6">
              <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-3">
                <span>Progression</span>
                <span>{Math.round(progress)}%</span>
              </div>
              
              {/* Progress bar - editorial style */}
              <div className="relative h-px bg-gray-200 w-full">
                <div 
                  className="absolute left-0 top-0 h-px bg-gray-900 transition-all duration-1000 ease-out" 
                  style={{ width: `${progress}%` }}
                />
                {/* Progress indicator dot */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-900 rounded-full transition-all duration-1000 ease-out shadow-sm"
                  style={{ left: `calc(${progress}% - 6px)` }}
                />
              </div>

              {/* Progress stages */}
              <div className="flex justify-between mt-4">
                {['Scraping', 'Analyse', 'Synthèse'].map((stage, i) => (
                  <div 
                    key={stage}
                    className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${
                      progress >= (i + 1) * 33 ? 'text-gray-900' : 'text-gray-300'
                    }`}
                  >
                    {stage}
              </div>
                ))}
            </div>
            </div>

            {/* Time estimate */}
            <div className="mt-8 border border-gray-200 px-6 py-4 bg-white/50">
              <p className="text-sm text-gray-500 text-center">
                Estimation : <span className="font-semibold text-gray-900">60–90 secondes</span>
              </p>
            </div>
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
            setStep('playground');
            setActiveTab('create');
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

    return (
      <div className="animate-fade-in relative">
        {/* Subtle grid background */}
        <div 
          className="fixed inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #000 1px, transparent 1px),
              linear-gradient(to bottom, #000 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Header - Compact */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-sm font-medium text-gray-900">{brandData?.name || 'Marque'}</span>
            <span className="text-xs text-gray-400">· Espace créatif</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Language selector */}
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded">
              <span className="text-[10px] font-mono uppercase text-gray-400">Langue:</span>
              <select
                value={contentLanguage}
                onChange={(e) => setContentLanguage(e.target.value as 'fr' | 'en' | 'es' | 'de')}
                className="text-xs bg-transparent border-none outline-none cursor-pointer text-gray-600"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => setStep('bento')}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Identité
            </button>
          </div>
        </div>

        {/* Template Pills - Compact selector */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 flex-shrink-0 mr-2">Format:</span>
          {TEMPLATES.map((template) => (
              <button
              key={template.id}
              onClick={() => {
                setSelectedTemplate(template.id);
                if (!brief) setBrief(template.placeholder);
              }}
              className={`flex-shrink-0 px-4 py-2 text-sm font-medium transition-all border flex items-center gap-2 ${
                selectedTemplate === template.id
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
              title={template.desc}
            >
              <span>{template.icon}</span>
              <span>{template.name}</span>
              </button>
            ))}
        </div>

        {/* Main Input Card */}
        <div className="bg-white border border-gray-200 mb-8 relative">
          {/* Progress indicator */}
          {status !== 'idle' && status !== 'complete' && status !== 'error' && (
            <div className="absolute top-0 left-0 right-0 h-px bg-gray-100">
              <div
                className="h-full bg-gray-900 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
          </div>
        )}

          <div className="p-6">
            {/* Creative angle cards - show prominently when no brief */}
            {brandData?.suggestedPosts?.length > 0 && !brief && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">✨</span>
                  <span className="text-sm font-medium text-gray-700">Choisissez un angle créatif</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {brandData.suggestedPosts.slice(0, 6).map((post: any, i: number) => {
                    const template = TEMPLATES.find(t => t.id === post.templateId);
                    const headline = post.headline || `${post.metric || ''} ${post.metricLabel || ''}`.trim();
                    const sourceColors: Record<string, string> = {
                      real_data: 'border-emerald-200 bg-emerald-50/50',
                      industry_insight: 'border-amber-200 bg-amber-50/50',
                      generated: 'border-gray-200 bg-gray-50/50'
                    };
                    const borderClass = sourceColors[post.source] || 'border-gray-200 bg-gray-50/50';
                    
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedTemplate(post.templateId as TemplateId);
                          setBrief(headline);
                        }}
                        className={`p-4 text-left border-2 transition-all hover:border-gray-400 hover:shadow-sm group ${borderClass}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{template?.icon}</span>
                          <span className="text-[9px] font-mono uppercase text-gray-400">{post.templateId}</span>
                          {post.source === 'real_data' && (
                            <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500" title="Données réelles" />
                          )}
                        </div>
                        <div className="text-sm text-gray-700 font-medium line-clamp-2 group-hover:text-gray-900">
                          {headline}
                        </div>
                        {post.intent && (
                          <div className="text-[10px] text-gray-400 mt-2 line-clamp-1 italic">
                            {post.intent}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Quick suggestions - compact version when brief exists */}
            {brandData?.suggestedPosts?.length > 0 && brief && (
              <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar -mx-1 px-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-300 flex-shrink-0">Idées:</span>
                {brandData.suggestedPosts.slice(0, 3).map((post: any, i: number) => {
                  const template = TEMPLATES.find(t => t.id === post.templateId);
                  const label = post.headline?.slice(0, 25) || `${post.metric || ''} ${post.metricLabel || ''}`.slice(0, 25);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedTemplate(post.templateId as TemplateId);
                        setBrief(post.headline || `${post.metric || ''} ${post.metricLabel || ''}`);
                      }}
                      className="flex-shrink-0 px-3 py-1.5 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-700 transition-colors flex items-center gap-1.5"
                    >
                      <span>{template?.icon}</span>
                      {label}...
                    </button>
                  );
                })}
              </div>
            )}

            {/* Brief textarea */}
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder={selectedTemplate ? TEMPLATES.find(t => t.id === selectedTemplate)?.placeholder : "Décrivez le visuel que vous voulez créer..."}
              className="w-full min-h-[80px] text-base resize-none outline-none placeholder:text-gray-300 bg-transparent"
            />

            {/* Sources - Compact inline */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 flex-shrink-0">Sources:</span>
              
              <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
                {uploadedImages.slice(0, 5).map((img, i) => (
                  <div key={i} className="relative w-10 h-10 flex-shrink-0 group">
                    <img src={img} className="w-full h-full object-cover border border-gray-200" />
                    <button
                      onClick={() => handleRemoveImage(i)}
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gray-900 text-white flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {uploadedImages.length > 5 && (
                  <div className="w-10 h-10 flex-shrink-0 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                    +{uploadedImages.length - 5}
                  </div>
                )}
              </div>

                <button
                  onClick={() => setShowSourceManager(true)}
                className="flex-shrink-0 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1.5"
                >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                {uploadedImages.length === 0 ? 'Ajouter' : 'Gérer'}
                </button>
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
            </div>

          {/* Actions footer - Compact */}
          <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={handleMagicEnhance}
                  disabled={!brief.trim() || isThinking}
              className="px-3 py-2 text-xs text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-30 flex items-center gap-1.5"
                  title="Améliorer avec l'IA"
                >
              <span className="text-emerald-500">✦</span> Enrichir
                </button>
            
              <button
                onClick={() => handleGenerate()}
                disabled={status !== 'idle' || !brief.trim() || uploadedImages.length === 0}
              className="group bg-gray-900 text-white px-5 py-2 font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-black flex items-center gap-2"
            >
              {status === 'preparing' || status === 'running' ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span>Génération...</span>
                </>
              ) : (
                <>
                  Générer 4 visuels
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
              </button>
            </div>
          </div>

        {/* Generation Loading State */}
        {(status === 'preparing' || status === 'running') && (
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                Génération en cours...
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-gray-100 border border-gray-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" 
                       style={{ animation: 'shimmer 2s infinite' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-6 h-6 text-gray-300 mx-auto mb-2 animate-pulse" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-gray-300">~30s</span>
        </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generated Images */}
        {generatedImages.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                Résultats ({generatedImages.length})
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
            {generatedImages.map((img, i) => (
              <div
                key={img.id}
                  className={`bg-gray-100 overflow-hidden relative group cursor-pointer border border-gray-200 hover:border-gray-400 transition-colors ${
                  img.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'
                }`}
              >
                <img src={img.url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => setLightboxImage(img.url)}
                      className="w-9 h-9 bg-white text-gray-900 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    title="Voir"
                  >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingImage(img.url);
                      setEditPrompt('');
                    }}
                      className="w-9 h-9 bg-white text-gray-900 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    title="Modifier"
                  >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
                        link.download = `flowww-${Date.now()}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      } catch (err) {
                        window.open(img.url, '_blank');
                      }
                    }}
                      className="w-9 h-9 bg-white text-gray-900 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    title="Télécharger"
                  >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                  </button>
                </div>
              </div>
            ))}
            </div>
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
              onClick={() => setEditingImage(null)}
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
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-2">
                Modification
              </div>
              <h3 className="text-xl font-semibold mb-2">Créer une variante</h3>
              <p className="text-sm text-gray-500 mb-6">
                Décrivez les changements. L'IA va régénérer une version modifiée.
              </p>

              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                className="w-full h-32 p-4 border border-gray-200 resize-none mb-4 bg-white focus:border-gray-400 outline-none transition-colors text-sm"
                placeholder="Ex: Change la couleur du fond en bleu nuit..."
              />

              <button
                onClick={() => {
                  if (!editPrompt.trim() || !editingImage) return;
                  handleGenerate(editPrompt, false, brandData, [editingImage]);
                  setEditingImage(null);
                }}
                className="group bg-gray-900 text-white py-4 font-medium text-sm hover:bg-black transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                disabled={!editPrompt.trim()}
              >
                <span className="text-emerald-400">✦</span>
                Générer la variante
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
