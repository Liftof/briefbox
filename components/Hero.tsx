'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, SignInButton } from '@clerk/nextjs';

export default function Hero() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  const handleAnalyze = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    // If not signed in, the SignInButton wrapper will handle it
    if (!isSignedIn) return;

    setIsLoading(true);
    // Redirect to playground with URL as query param
    router.push(`/playground?analyzeUrl=${encodeURIComponent(trimmedUrl)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url.trim() && isSignedIn) {
      handleAnalyze();
    }
  };

  return (
    <section className="min-h-screen flex items-center relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
      
      {/* Floating accents */}
      <div className="absolute top-32 right-32 w-96 h-96 bg-gradient-to-br from-amber-200/20 to-orange-300/10 rounded-full blur-3xl" />
      <div className="absolute bottom-32 left-16 w-72 h-72 bg-gradient-to-tr from-emerald-200/15 to-teal-300/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-gray-100/50 to-transparent rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          
          {/* Left: Content */}
          <div className="max-w-xl">
            {/* Logo */}
            <div className="mb-10">
              <img src="/logo.png" alt="Palette" className="h-12 object-contain" />
            </div>

            {/* Headline */}
            <h1 className="mb-8" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              <span className="block text-5xl md:text-6xl font-light text-gray-900 leading-[1.1] mb-2">
                Entrez votre site.
              </span>
              <span className="block text-5xl md:text-6xl font-semibold text-gray-900 leading-[1.1]">
                Voilà. Vos visuels sont créés.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-gray-400 leading-relaxed max-w-md mb-10">
              L'IA analyse votre marque et génère des visuels <span className="text-gray-900 font-medium">beaux</span>, <span className="text-gray-900 font-medium">cohérents</span> et <span className="text-gray-900 font-medium">100% à votre image</span>. Pour vos réseaux, vos pubs — automatiquement.
            </p>

            {/* URL Input */}
            <div className="relative mb-8">
              {/* Decorative corners */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-gray-300" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-gray-300" />
              
              <div className="bg-white border border-gray-200 p-2 flex items-center gap-2">
                <div className="flex-1 flex items-center gap-3 px-4">
                  <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="votresite.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 py-3 text-lg font-light outline-none placeholder:text-gray-300"
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
                        <span>Analyse...</span>
                      </>
                    ) : (
                      <>
                        <span>Analyser</span>
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
                      <span>Analyser</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  </SignInButton>
                )}
              </div>
              
              <p className="mt-3 text-xs text-gray-400 pl-1">
                Gratuit • Aucune CB requise • Résultats en 60 secondes
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-10 pt-8 border-t border-gray-200">
              <div>
                <div className="text-2xl font-semibold text-gray-900 mb-1">∞</div>
                <div className="text-xs font-mono uppercase tracking-wider text-gray-400">visuels</div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <div className="text-2xl font-semibold text-gray-900 mb-1">2K</div>
                <div className="text-xs font-mono uppercase tracking-wider text-gray-400">haute déf</div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <div className="text-2xl font-semibold text-gray-900 mb-1">1 clic</div>
                <div className="text-xs font-mono uppercase tracking-wider text-gray-400">pour modifier</div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <div className="text-2xl font-semibold text-gray-900 mb-1">0€</div>
                <div className="text-xs font-mono uppercase tracking-wider text-gray-400">pour tester</div>
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative hidden lg:block">
            {/* Main card with corner decorations */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-8 h-8 border-l-2 border-t-2 border-gray-300" />
              <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-2 border-b-2 border-gray-300" />
              
              {/* Generated visual mockup */}
              <div className="bg-white border border-gray-200 p-3 shadow-2xl shadow-gray-200/50">
                <div className="aspect-[4/5] bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-sm overflow-hidden relative">
                  {/* Simulated generated content */}
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511556532299-8f662fc26c06?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-60" />
                  
                  {/* Brand overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  
                  {/* Logo */}
                  <div className="absolute top-6 left-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="font-bold text-gray-900">L</span>
                  </div>
                  
                  {/* Content */}
                  <div className="absolute bottom-8 left-6 right-6">
                    <div className="text-3xl font-bold text-white mb-3 leading-tight">
                      Black<br/>Friday
                    </div>
                    <div className="inline-block bg-white text-gray-900 px-4 py-2 text-sm font-semibold">
                      -50% MAINTENANT
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    Généré
                  </div>
                </div>
              </div>
            </div>

            {/* Floating prompt card */}
            <div className="absolute -left-20 top-20 w-72 bg-white border border-gray-200 p-5 shadow-xl transform -rotate-2 hover:rotate-0 transition-transform">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Votre brief</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                "Story Instagram Black Friday avec mon logo en haut et photo lifestyle en fond"
              </p>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <span className="font-mono">ENTER</span>
              </div>
            </div>

            {/* Floating assets card */}
            <div className="absolute -right-8 bottom-20 w-56 bg-white border border-gray-200 p-4 shadow-xl transform rotate-3 hover:rotate-0 transition-transform">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Assets chargés</span>
              </div>
              <div className="flex gap-2">
                <div className="w-10 h-10 bg-gray-900 rounded-lg" />
                <div className="w-10 h-10 bg-orange-500 rounded-lg" />
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
