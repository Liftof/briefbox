'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, SignInButton } from '@clerk/nextjs';

export default function CtaSection() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  const handleGenerate = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    if (!isSignedIn) return;

    setIsLoading(true);
    router.push(`/playground?analyzeUrl=${encodeURIComponent(trimmedUrl)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url.trim() && isSignedIn) {
      handleGenerate();
    }
  };

  return (
    <section className="py-24 md:py-32 bg-gray-900 text-white relative overflow-hidden">
      {/* Floating accents - Palette logo colors */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
      <div className="absolute top-40 left-40 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      
      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light mb-6 leading-tight">
          Prêt à créer<br />
          <span className="font-semibold">en 60 secondes ?</span>
        </h2>
        <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
          Votre premier visuel est gratuit. Sans carte bancaire.
        </p>
        
        {/* URL Input */}
        <div className="max-w-lg mx-auto">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 flex items-center gap-3 px-4">
              <svg className="w-5 h-5 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <input
                type="text"
                placeholder="votresite.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 py-3 text-base bg-transparent text-white outline-none placeholder:text-white/40"
              />
            </div>
            
            {isLoaded && isSignedIn ? (
              <button
                onClick={handleGenerate}
                disabled={!url.trim() || isLoading}
                className="bg-white text-gray-900 px-6 py-3 font-medium text-sm hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Chargement...</span>
                  </>
                ) : (
                  <>
                    <span>Générer mon premier visuel</span>
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
                  className="bg-white text-gray-900 px-6 py-3 font-medium text-sm hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>Générer mon premier visuel</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </SignInButton>
            )}
          </div>
          
          <p className="mt-4 text-sm text-white/40">
            Gratuit • Aucune CB requise
          </p>
        </div>
      </div>
    </section>
  );
}

