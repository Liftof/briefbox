import Link from 'next/link';

export default function Hero() {
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
            {/* Status indicator */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Visual AI Platform</span>
            </div>

            {/* Headline */}
            <h1 className="mb-8" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              <span className="block text-5xl md:text-6xl font-light text-gray-900 leading-[1.1] mb-2">
                Décrivez.
              </span>
              <span className="block text-5xl md:text-6xl font-light text-gray-900 leading-[1.1] mb-2">
                Importez.
              </span>
              <span className="block text-5xl md:text-6xl font-semibold text-gray-900 leading-[1.1]">
                L'IA génère.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-gray-400 leading-relaxed max-w-md mb-12">
              Vous décrivez le visuel que vous voulez. L'IA utilise <span className="text-gray-900 font-medium">vos assets</span> et <span className="text-gray-900 font-medium">votre charte</span> pour créer un résultat unique.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link
                href="/playground"
                className="group relative bg-gray-900 text-white px-8 py-4 font-medium text-sm transition-all hover:bg-black inline-flex items-center justify-center gap-3"
              >
                <span>Commencer gratuitement</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                {/* Hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
              </Link>

              <Link
                href="#fonctionnement"
                className="px-8 py-4 font-medium text-sm text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center justify-center gap-2"
              >
                <span>Comment ça marche</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-12 pt-8 border-t border-gray-200">
              <div>
                <div className="text-2xl font-semibold text-gray-900 mb-1">2 min</div>
                <div className="text-xs font-mono uppercase tracking-wider text-gray-400">pour générer</div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <div className="text-2xl font-semibold text-gray-900 mb-1">100%</div>
                <div className="text-xs font-mono uppercase tracking-wider text-gray-400">on-brand</div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <div className="text-2xl font-semibold text-gray-900 mb-1">0€</div>
                <div className="text-xs font-mono uppercase tracking-wider text-gray-400">pour démarrer</div>
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
