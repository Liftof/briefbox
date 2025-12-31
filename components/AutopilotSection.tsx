'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function AutopilotSection() {
  const { locale } = useTranslation();
  const [currentTime, setCurrentTime] = useState('07:00');
  const [isAnimating, setIsAnimating] = useState(false);

  // Simulate the "morning notification" effect
  useEffect(() => {
    const times = ['07:00', '07:01', '07:02'];
    let index = 0;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        index = (index + 1) % times.length;
        setCurrentTime(times[index]);
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const contentIdeas = locale === 'fr' ? [
    { icon: '🔥', text: 'Tendance détectée : "productivité sans hustle culture"', tag: 'Trend' },
    { icon: '💡', text: 'Pain point audience : "trop de réunions inutiles"', tag: 'Insight' },
    { icon: '📊', text: 'Concurrent X a lancé une feature similaire', tag: 'Veille' },
  ] : [
    { icon: '🔥', text: 'Trend detected: "productivity without hustle culture"', tag: 'Trend' },
    { icon: '💡', text: 'Audience pain point: "too many useless meetings"', tag: 'Insight' },
    { icon: '📊', text: 'Competitor X launched a similar feature', tag: 'Intel' },
  ];

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
                    <span className={`font-medium transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                      {currentTime}
                    </span>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <div className="w-6 h-3 bg-white rounded-sm" />
                    </div>
                  </div>

                  {/* Notification */}
                  <div className="px-4 py-2">
                    <div className={`bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10 transition-all duration-500 ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 via-blue-500 to-amber-400 flex items-center justify-center">
                          <span className="text-white text-lg font-bold">P</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-semibold text-sm">Palette</span>
                            <span className="text-gray-400 text-xs">{locale === 'fr' ? 'maintenant' : 'now'}</span>
                          </div>
                          <p className="text-gray-300 text-sm mt-1">
                            {locale === 'fr'
                              ? "Votre visuel du jour est prêt ! Trend: productivité sans burnout"
                              : "Your daily visual is ready! Trend: productivity without burnout"
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview of generated visual */}
                  <div className="px-4 py-2">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-3 border border-gray-700">
                      <div className="aspect-square rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/hero-illustration.jpg')] bg-cover bg-center opacity-40" />
                        <div className="relative z-10 text-center p-4">
                          <div className="text-white/80 text-xs font-mono uppercase tracking-wider mb-2">
                            {locale === 'fr' ? 'Généré pour vous' : 'Generated for you'}
                          </div>
                          <div className="text-white font-semibold">
                            {locale === 'fr' ? 'Post LinkedIn' : 'LinkedIn Post'}
                          </div>
                        </div>
                        {/* Checkmark badge */}
                        <div className="absolute top-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-3">
                        <button className="flex-1 bg-white text-gray-900 py-2 rounded-lg text-sm font-medium">
                          {locale === 'fr' ? 'Publier' : 'Publish'}
                        </button>
                        <button className="flex-1 bg-gray-700 text-white py-2 rounded-lg text-sm font-medium">
                          {locale === 'fr' ? 'Modifier' : 'Edit'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Spacer for phone height */}
                  <div className="h-32" />
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
