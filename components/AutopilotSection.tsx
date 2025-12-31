'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

// Geometric SVG previews for each notification
const GeometricPreview1 = () => (
  <svg viewBox="0 0 40 40" className="w-full h-full">
    <rect x="5" y="5" width="14" height="14" fill="#3B82F6" rx="2" />
    <circle cx="30" cy="12" r="7" fill="#F59E0B" />
    <polygon points="12,35 5,25 19,25" fill="#EF4444" />
    <rect x="22" y="22" width="13" height="13" fill="#8B5CF6" rx="2" />
  </svg>
);

const GeometricPreview2 = () => (
  <svg viewBox="0 0 40 40" className="w-full h-full">
    <circle cx="12" cy="12" r="8" fill="#10B981" />
    <rect x="22" y="5" width="13" height="13" fill="#F59E0B" rx="2" />
    <polygon points="30,35 22,22 38,22" fill="#3B82F6" />
    <circle cx="10" cy="30" r="6" fill="#EC4899" />
  </svg>
);

const GeometricPreview3 = () => (
  <svg viewBox="0 0 40 40" className="w-full h-full">
    <polygon points="20,5 35,18 28,35 12,35 5,18" fill="#6366F1" />
    <circle cx="20" cy="20" r="6" fill="#F59E0B" />
  </svg>
);

const GeometricPreview4 = () => (
  <svg viewBox="0 0 40 40" className="w-full h-full">
    <rect x="3" y="12" width="16" height="16" fill="#EF4444" rx="3" transform="rotate(-10 11 20)" />
    <circle cx="28" cy="14" r="9" fill="#3B82F6" />
    <polygon points="32,35 24,24 38,26" fill="#10B981" />
  </svg>
);

const GeometricPreview5 = () => (
  <svg viewBox="0 0 40 40" className="w-full h-full">
    <rect x="8" y="8" width="24" height="24" fill="#8B5CF6" rx="4" />
    <circle cx="20" cy="16" r="5" fill="#F59E0B" />
    <polygon points="20,35 12,24 28,24" fill="white" />
  </svg>
);

const PREVIEWS = [GeometricPreview1, GeometricPreview2, GeometricPreview3, GeometricPreview4, GeometricPreview5];

export default function AutopilotSection() {
  const { locale } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const notifications = locale === 'fr' ? [
    { time: '07:00', text: 'Votre visuel du jour est prêt ! Trend: productivité sans burnout', tag: 'Lundi' },
    { time: '07:00', text: 'Nouveau contenu généré ! Sujet: astuces remote work', tag: 'Mardi' },
    { time: '07:01', text: 'Visuel prêt à publier ! Thème: leadership moderne', tag: 'Mercredi' },
    { time: '07:00', text: 'Contenu du jour : les erreurs à éviter en startup', tag: 'Jeudi' },
    { time: '07:02', text: 'Votre post est prêt ! Tendance: bien-être au travail', tag: 'Vendredi' },
  ] : [
    { time: '07:00', text: 'Your daily visual is ready! Trend: productivity without burnout', tag: 'Monday' },
    { time: '07:00', text: 'New content generated! Topic: remote work tips', tag: 'Tuesday' },
    { time: '07:01', text: 'Visual ready to publish! Theme: modern leadership', tag: 'Wednesday' },
    { time: '07:00', text: 'Today\'s content: startup mistakes to avoid', tag: 'Thursday' },
    { time: '07:02', text: 'Your post is ready! Trend: workplace wellness', tag: 'Friday' },
  ];

  // Cycle through notifications
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % notifications.length);
        setIsAnimating(false);
      }, 400);
    }, 3500);

    return () => clearInterval(interval);
  }, [notifications.length]);

  const contentIdeas = locale === 'fr' ? [
    { icon: '🔥', text: 'Tendance détectée : "productivité sans hustle culture"', tag: 'Trend' },
    { icon: '💡', text: 'Pain point audience : "trop de réunions inutiles"', tag: 'Insight' },
    { icon: '📊', text: 'Concurrent X a lancé une feature similaire', tag: 'Veille' },
  ] : [
    { icon: '🔥', text: 'Trend detected: "productivity without hustle culture"', tag: 'Trend' },
    { icon: '💡', text: 'Audience pain point: "too many useless meetings"', tag: 'Insight' },
    { icon: '📊', text: 'Competitor X launched a similar feature', tag: 'Intel' },
  ];

  const CurrentPreview = PREVIEWS[currentIndex];

  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-gray-900">
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-amber-900/10" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: Content */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-500">
                {locale === 'fr' ? 'Mode Autopilote' : 'Autopilot Mode'}
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white leading-tight mb-6">
              {locale === 'fr' ? (
                <>Réveillez-vous avec<br /><span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">du contenu frais.</span></>
              ) : (
                <>Wake up to<br /><span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">fresh content.</span></>
              )}
            </h2>

            <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-md">
              {locale === 'fr'
                ? "Chaque matin, Palette analyse les tendances de votre marché, trouve ce qui intéresse vraiment votre audience, et génère un visuel prêt à publier. Vous n'avez plus qu'à valider."
                : "Every morning, Palette analyzes your market trends, finds what your audience actually cares about, and generates a publish-ready visual. All you do is approve."
              }
            </p>

            {/* How it works - 3 micro steps */}
            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-amber-400 text-sm font-semibold">1</div>
                <div>
                  <div className="text-white font-medium">{locale === 'fr' ? 'IA scanne votre marché' : 'AI scans your market'}</div>
                  <div className="text-gray-500 text-sm">{locale === 'fr' ? 'Tendances, pain points, actualités' : 'Trends, pain points, news'}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-blue-400 text-sm font-semibold">2</div>
                <div>
                  <div className="text-white font-medium">{locale === 'fr' ? 'Génère un visuel pertinent' : 'Generates a relevant visual'}</div>
                  <div className="text-gray-500 text-sm">{locale === 'fr' ? '100% votre marque, 0% générique' : '100% your brand, 0% generic'}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-green-400 text-sm font-semibold">3</div>
                <div>
                  <div className="text-white font-medium">{locale === 'fr' ? 'Notification à 7h' : 'Notification at 7am'}</div>
                  <div className="text-gray-500 text-sm">{locale === 'fr' ? 'Approuvez ou modifiez, puis publiez' : 'Approve or edit, then publish'}</div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-4">
              <a
                href="/playground"
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 font-medium text-sm hover:bg-gray-100 transition-all"
              >
                {locale === 'fr' ? 'Activer le mode autopilote' : 'Enable autopilot mode'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <span className="text-xs text-gray-500">
                {locale === 'fr' ? 'Inclus dans Pro & Premium' : 'Included in Pro & Premium'}
              </span>
            </div>
          </div>

          {/* Right: Visual mockup */}
          <div className="relative hidden lg:block">
            {/* Phone mockup */}
            <div className="relative mx-auto w-72">
              {/* Phone frame */}
              <div className="bg-gray-800 rounded-[3rem] p-3 shadow-2xl border border-gray-700">
                {/* Screen */}
                <div className="bg-gray-900 rounded-[2.5rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-8 py-3 text-white text-xs">
                    <span className={`font-medium transition-all duration-300 ${isAnimating ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0'}`}>
                      {notifications[currentIndex].time}
                    </span>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <div className="w-6 h-3 bg-white rounded-sm" />
                    </div>
                  </div>

                  {/* Notification with cycling content */}
                  <div className="px-4 py-2">
                    <div className={`bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10 transition-all duration-500 ${isAnimating ? 'scale-95 opacity-0 translate-y-2' : 'scale-100 opacity-100 translate-y-0'}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 via-blue-500 to-amber-400 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-lg font-bold">P</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-semibold text-sm">Palette</span>
                            <span className="text-amber-400 text-[10px] font-mono">{notifications[currentIndex].tag}</span>
                          </div>
                          <p className="text-gray-300 text-xs mt-1 leading-relaxed">
                            {notifications[currentIndex].text}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview of generated visual with geometric SVG */}
                  <div className="px-4 py-2">
                    <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-3 border border-gray-700 transition-all duration-500 ${isAnimating ? 'opacity-50 scale-98' : 'opacity-100 scale-100'}`}>
                      <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-gray-700/50 to-gray-800/50 flex items-center justify-center relative overflow-hidden">
                        {/* Geometric SVG preview */}
                        <div className="w-24 h-24 transition-all duration-500">
                          <CurrentPreview />
                        </div>
                        {/* Day indicator */}
                        <div className="absolute top-2 left-2 bg-black/30 backdrop-blur-sm rounded px-2 py-0.5">
                          <span className="text-[10px] font-mono text-white/70">{notifications[currentIndex].tag}</span>
                        </div>
                        {/* Checkmark badge */}
                        <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-3">
                        <button className="flex-1 bg-white text-gray-900 py-2 rounded-lg text-xs font-medium">
                          {locale === 'fr' ? 'Publier' : 'Publish'}
                        </button>
                        <button className="flex-1 bg-gray-700 text-white py-2 rounded-lg text-xs font-medium">
                          {locale === 'fr' ? 'Modifier' : 'Edit'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress dots */}
                  <div className="flex justify-center gap-1.5 py-3">
                    {notifications.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-amber-400 w-3' : 'bg-gray-600'}`}
                      />
                    ))}
                  </div>

                  {/* Spacer for phone height */}
                  <div className="h-8" />
                </div>
              </div>

              {/* Floating insight cards */}
              <div className="absolute -left-24 top-20 space-y-3">
                {contentIdeas.map((idea, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 max-w-48 transform transition-all duration-500 hover:bg-white/10"
                    style={{
                      transform: `translateX(${idx * 10}px) rotate(${-2 + idx}deg)`,
                      animationDelay: `${idx * 200}ms`
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{idea.icon}</span>
                      <span className="text-[10px] font-mono text-amber-400 uppercase">{idea.tag}</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{idea.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Bottom stats */}
        <div className="mt-20 pt-10 border-t border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-semibold text-white mb-1">30</div>
              <div className="text-xs font-mono uppercase tracking-wider text-gray-500">
                {locale === 'fr' ? 'Visuels/mois en autopilote' : 'Visuals/month on autopilot'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-semibold text-white mb-1">7h</div>
              <div className="text-xs font-mono uppercase tracking-wider text-gray-500">
                {locale === 'fr' ? 'Livré chaque matin' : 'Delivered every morning'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-semibold text-white mb-1">0</div>
              <div className="text-xs font-mono uppercase tracking-wider text-gray-500">
                {locale === 'fr' ? 'Effort de votre part' : 'Effort on your part'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-semibold text-amber-400 mb-1">∞</div>
              <div className="text-xs font-mono uppercase tracking-wider text-gray-500">
                {locale === 'fr' ? 'Idées de contenu' : 'Content ideas'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
