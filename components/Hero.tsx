'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { useTranslation } from '@/lib/i18n';

export default function Hero() {
  const { t, locale } = useTranslation();
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  const [socialProofCount, setSocialProofCount] = useState(0);
  const [promptText, setPromptText] = useState('');
  const [displayedPrompt, setDisplayedPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const carouselData: { image: string; prompt: { fr: string; en: string }; colors: string[]; position?: string }[] = [
    {
      image: '/hero-illustration.jpg',
      prompt: {
        fr: 'Post réseaux sociaux pour @Finary, plateforme de gestion de patrimoine',
        en: 'Social media post for @Finary, a centralized wealth management platform'
      },
      colors: ['bg-gray-900', 'bg-[#D4AF37]', 'bg-gray-200']
    },
    {
      image: '/hero-traderepublic.jpg',
      prompt: {
        fr: 'Une pub pour @TradeRepublic avec un modèle et des KPIs',
        en: 'An ad for @TradeRepublic featuring a model and KPIs'
      },
      colors: ['bg-black', 'bg-zinc-400', 'bg-white']
    },
    {
      image: '/hero-datafast.png',
      prompt: {
        fr: 'Une pub percutante pour @Datafast, plateforme de dataviz pour SaaS',
        en: 'A bold ad for @Datafast, the real-time dataviz platform for SaaS'
      },
      colors: ['bg-[#1a1a2e]', 'bg-[#6366f1]', 'bg-[#22d3ee]']
    }
  ];

  // Carousel timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselData.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Locale-aware default prompts
  const defaultPrompts = {
    fr: "Story Instagram Black Friday avec mon logo en haut et photo lifestyle en fond",
    en: "Instagram Story Black Friday with my logo on top and lifestyle photo in background"
  };
  const defaultPrompt = defaultPrompts[locale] || defaultPrompts.fr;

  // Typewriter effect - only run on large screens where it's visible
  useEffect(() => {
    if (!isTyping) return;

    // Skip animation on mobile (matches Tailwind's lg breakpoint)
    const isLargeScreen = window.matchMedia('(min-width: 1024px)').matches;
    if (!isLargeScreen) {
      setIsTyping(false);
      setPromptText(defaultPrompt);
      return;
    }

    let index = 0;
    const timer = setInterval(() => {
      if (index <= defaultPrompt.length) {
        setDisplayedPrompt(defaultPrompt.slice(0, index));
        index++;
      } else {
        setIsTyping(false);
        setPromptText(defaultPrompt);
        clearInterval(timer);
      }
    }, 40);

    return () => clearInterval(timer);
  }, [defaultPrompt]);

  const handlePromptSubmit = () => {
    const text = promptText.trim() || defaultPrompt;
    if (isSignedIn) {
      router.push(`/playground?brief=${encodeURIComponent(text)}`);
    }
  };

  const handlePromptKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePromptSubmit();
    }
  };

  useEffect(() => {
    const calculateDailyCount = () => {
      const parisTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' });
      const parisDate = new Date(parisTime);

      const hour = parisDate.getHours();
      const minute = parisDate.getMinutes();
      const second = parisDate.getSeconds();
      const day = parisDate.getDate();
      const month = parisDate.getMonth();

      const daySeed = (day * 31 + month * 12) % 100;
      const dayProgress = (hour * 3600 + minute * 60 + second) / (24 * 3600);

      let growthMultiplier = 1;
      if (hour >= 9 && hour < 12) growthMultiplier = 1.3;
      if (hour >= 12 && hour < 14) growthMultiplier = 0.9;
      if (hour >= 14 && hour < 18) growthMultiplier = 1.4;
      if (hour >= 18 && hour < 21) growthMultiplier = 1.1;
      if (hour >= 21 || hour < 6) growthMultiplier = 0.5;

      const baseCount = 89 + Math.floor(dayProgress * 2758 * growthMultiplier);
      const dailyVariation = Math.floor((daySeed / 100) * 200) - 100;
      const minuteBump = Math.floor((minute % 7) * 3 + (second % 13));

      return Math.max(89, Math.min(2999, baseCount + dailyVariation + minuteBump));
    };

    setSocialProofCount(calculateDailyCount());
    const interval = setInterval(() => {
      setSocialProofCount(calculateDailyCount());
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    if (!isSignedIn) return;

    setIsLoading(true);
    router.push(`/playground?analyzeUrl=${encodeURIComponent(trimmedUrl)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url.trim() && isSignedIn) {
      handleAnalyze();
    }
  };

  return (
    <section className="min-h-screen flex items-center relative overflow-hidden pt-24 md:pt-32">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      {/* Floating accents - Palette logo colors */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-red-200/20 to-red-300/10 rounded-full blur-3xl" />
      <div className="absolute top-40 right-60 w-64 h-64 bg-gradient-to-br from-amber-200/25 to-yellow-300/15 rounded-full blur-3xl" />
      <div className="absolute bottom-32 left-16 w-72 h-72 bg-gradient-to-tr from-blue-200/20 to-blue-300/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-gray-100/50 to-transparent rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* Left: Content */}
          <div className="max-w-xl">
            {/* Social Proof Badge */}
            {socialProofCount > 0 && (
              <div className="inline-flex items-center gap-3 bg-white border border-gray-200 px-4 py-2 shadow-sm mb-8">
                <div className="flex -space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="w-2 h-2 bg-amber-400 rounded-full" />
                </div>
                <span className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {socialProofCount.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                  </span> {t('landing.hero.badge')}
                </span>
              </div>
            )}

            {/* Headline */}
            <h1 className="mb-6 md:mb-8" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1] mb-2">
                {t('landing.hero.headline1')}
              </span>
              <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-gray-900 leading-[1.1]">
                {t('landing.hero.headline2')}
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-gray-400 leading-relaxed max-w-md mb-10">
              {locale === 'fr' ? (
                <>Importez votre charte, décrivez ce que vous voulez, publiez. Des visuels <span className="text-gray-900 font-medium">pros</span>, <span className="text-gray-900 font-medium">cohérents</span>, <span className="text-gray-900 font-medium">100% à votre image</span> — sans graphiste, sans agence, sans attendre.</>
              ) : (
                <>Import your brand, describe what you want, publish. <span className="text-gray-900 font-medium">Professional</span>, <span className="text-gray-900 font-medium">consistent</span>, <span className="text-gray-900 font-medium">100% on-brand</span> visuals — no designer, no agency, no waiting.</>
              )}
            </p>

            {/* URL Input */}
            <div className="relative mb-8">
              {/* Decorative corners */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-gray-300" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-gray-300" />

              <div className="bg-white border border-gray-200 p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 flex items-center gap-3 px-3 sm:px-4">
                  <svg className="w-5 h-5 text-gray-300 flex-shrink-0 hidden sm:block" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <input
                    type="text"
                    placeholder={t('landing.hero.placeholder')}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 py-3 text-base sm:text-lg font-light outline-none placeholder:text-gray-300"
                  />
                </div>

                {isLoaded && isSignedIn ? (
                  <button
                    onClick={handleAnalyze}
                    disabled={!url.trim() || isLoading}
                    className="bg-gray-900 text-white px-6 py-3 font-medium text-sm hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>{t('landing.hero.ctaLoading')}</span>
                      </>
                    ) : (
                      <>
                        <span>{t('landing.hero.cta')}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>
                ) : (
                  <SignInButton mode="modal" forceRedirectUrl={url.trim() ? `/playground?analyzeUrl=${encodeURIComponent(url.trim())}` : '/playground'}>
                    <button
                      disabled={!url.trim()}
                      className="bg-gray-900 text-white px-6 py-3 font-medium text-sm hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <span>{t('landing.hero.cta')}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  </SignInButton>
                )}
              </div>

              <p className="mt-3 text-xs text-gray-400 pl-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  {locale === 'fr' ? '1 visuel offert' : '1 free visual'}
                </span>
                {t('landing.hero.subtitle')}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-gray-200">
              <div>
                <div className="text-2xl font-semibold text-gray-900 mb-1">60s</div>
                <div className="text-xs font-mono uppercase tracking-wider text-gray-400">{locale === 'fr' ? 'par visuel' : 'per visual'}</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900 mb-1">4K</div>
                <div className="text-xs font-mono uppercase tracking-wider text-gray-400">{t('landing.hero.stats.highDef')}</div>
              </div>
              <div className="relative group">
                <div className="text-2xl font-semibold text-gray-900 mb-1 flex items-center gap-1">
                  <span className="text-amber-500">24/7</span>
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-gray-400">{locale === 'fr' ? 'Autopilote' : 'Autopilot'}</div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-gray-900 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {locale === 'fr' ? 'Palette travaille pour vous, même quand vous dormez' : 'Palette works for you, even while you sleep'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900 mb-1">{locale === 'fr' ? '0€' : '$0'}</div>
                <div className="text-xs font-mono uppercase tracking-wider text-gray-400">{t('landing.hero.stats.free')}</div>
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative hidden lg:block">
            {/* Carousel Container */}
            <div className="relative group">
              <div className="absolute -top-4 -left-4 w-8 h-8 border-l-2 border-t-2 border-gray-300" />
              <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-2 border-b-2 border-gray-300" />

              {/* Image Container with smooth transition */}
              <div className="relative bg-white border border-gray-200 p-3 shadow-2xl shadow-gray-200/50 overflow-hidden">
                <div className="aspect-[4/5] relative overflow-hidden rounded-sm">
                  {carouselData.map((item, idx) => (
                    <img
                      key={idx}
                      src={item.image}
                      alt={`Hero carousel - ${idx}`}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${idx === carouselIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
                        } ${item.position || 'object-center'}`}
                    />
                  ))}

                  {/* Status badge */}
                  <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 flex items-center gap-2 z-20">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    {locale === 'fr' ? 'Généré' : 'Generated'}
                  </div>
                </div>
              </div>

              {/* Floating prompt card - RESTORED & DYNAMIC */}
              <div
                className={`absolute -left-20 top-20 w-80 bg-white border-2 p-5 shadow-xl transition-all duration-500 cursor-text z-30 ${isFocused
                  ? 'border-blue-500 rotate-0 scale-105 shadow-2xl shadow-blue-500/20'
                  : 'border-gray-200 -rotate-2 hover:rotate-0 hover:border-gray-300'
                  }`}
                onClick={() => {
                  setIsFocused(true);
                  setIsTyping(false);
                  setPromptText(promptText || defaultPrompt);
                  setTimeout(() => promptInputRef.current?.focus(), 100);
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full transition-colors ${isFocused ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                      {locale === 'fr' ? 'Le brief' : 'The brief'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {carouselData.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1 h-1 rounded-full transition-all duration-300 ${idx === carouselIndex ? 'w-3 bg-gray-900' : 'bg-gray-300'
                          }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="min-h-[60px] flex items-center overflow-hidden">
                  <div
                    className="w-full transition-all duration-500 transform"
                  >
                    {isFocused ? (
                      <textarea
                        ref={promptInputRef}
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        onKeyDown={handlePromptKeyDown}
                        onBlur={() => !promptText && setIsFocused(false)}
                        placeholder={locale === 'fr' ? 'Décrivez votre visuel...' : 'Describe your visual...'}
                        className="w-full text-sm text-gray-700 leading-relaxed resize-none outline-none bg-transparent"
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-gray-600 leading-relaxed italic">
                        "{carouselData[carouselIndex].prompt[locale] || carouselData[carouselIndex].prompt.en}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    <span className="font-mono">
                      TRY
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isFocused ? (
                      <SignInButton mode="modal" forceRedirectUrl="/playground">
                        <button className="bg-gray-900 text-white text-[10px] font-semibold px-3 py-1.5 hover:bg-black transition-all">
                          {locale === 'fr' ? 'GÉNÉRER' : 'GENERATE'}
                        </button>
                      </SignInButton>
                    ) : (
                      <div className="text-[9px] font-mono text-gray-400 uppercase tracking-tighter">
                        Made in 40sec
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Floating assets card - RESTORED */}
              <div className="absolute -right-8 bottom-20 w-56 bg-white border border-gray-200 p-4 shadow-xl transform rotate-3 hover:rotate-0 transition-all duration-500 z-10 group-hover:rotate-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                    {locale === 'fr' ? 'Assets chargés' : 'Assets loaded'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {carouselData[carouselIndex].colors.map((color, colorIdx) => (
                    <div
                      key={colorIdx}
                      className={`w-10 h-10 rounded-lg transition-all duration-700 ${color}`}
                      style={{ transitionDelay: `${colorIdx * 100}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
