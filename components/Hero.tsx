import Link from 'next/link';

export default function Hero() {
  return (
    <section className="min-h-[90vh] flex items-center bg-page relative overflow-hidden pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="max-w-2xl relative z-10">
            {/* Badge minimaliste */}
            <div className="inline-flex items-center gap-2 mb-8 animate-fade-in bg-white border border-stroke px-4 py-2 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-secondary tracking-wide">Décrivez ce que vous souhaitez. Et voilà.</span>
            </div>

            {/* Headline */}
            <h1 className="mb-8 animate-slide-up text-primary">
              <span className="block text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold leading-[1.1] tracking-tight mb-2">
                Décrivez. Importez.
              </span>
              <span className="block text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold leading-[1.1] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-gray-500">
                L'IA génère.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-secondary/80 leading-relaxed max-w-lg mb-10 animate-slide-up font-light" style={{ animationDelay: '0.1s' }}>
              Fini les templates génériques. <strong className="font-bold text-primary">Vous décrivez le visuel</strong> que vous voulez, l'IA utilise <strong className="font-bold text-primary">vos assets et votre charte</strong> pour créer un résultat unique et professionnel.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link
                href="/playground"
                className="btn-primary group inline-flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1 transform transition-all"
              >
                <span className="font-medium">Lancer un essai</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>

              <Link
                href="#fonctionnement"
                className="btn-secondary inline-flex items-center justify-center gap-3 hover:bg-white hover:shadow-lg hover:-translate-y-0.5 transform transition-all"
              >
                <span className="font-medium">Comment ça marche</span>
              </Link>
            </div>

            {/* Stats minimalistes */}
            <div className="flex flex-wrap items-center gap-8 md:gap-12 pt-8 border-t border-stroke animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">2 min</div>
                <div className="text-sm text-secondary/60">Pour générer</div>
              </div>
              <div className="w-px h-10 bg-stroke hidden sm:block"></div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">100%</div>
                <div className="text-sm text-secondary/60">Respect de la charte</div>
              </div>
              <div className="w-px h-10 bg-stroke hidden sm:block"></div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">0€</div>
                <div className="text-sm text-secondary/60">Pour démarrer</div>
              </div>
            </div>
          </div>

          {/* Visual Right Side - Composition "Input -> Output" */}
          <div className="relative hidden lg:block h-[700px] animate-fade-in z-0 perspective-1000" style={{ animationDelay: '0.4s' }}>
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-purple-100/40 to-blue-100/40 rounded-full blur-3xl animate-pulse-slow"></div>

            <div className="absolute inset-0 flex items-center justify-center">
              {/* Card 1: Brand Assets (Left Bottom) - Floating Animation */}
              <div className="absolute bottom-24 left-10 w-64 bg-white/80 backdrop-blur-md rounded-epopian shadow-xl border border-white/50 p-6 transform -rotate-6 hover:rotate-0 transition-all duration-500 z-10 animate-float-slow ring-1 ring-black/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold text-secondary/60 uppercase tracking-wider">Vos Assets</div>
                  <div className="text-xs text-green-500 font-bold bg-green-50 px-2 py-1 rounded-full">Uploadé</div>
                </div>
                <div className="flex items-center gap-3 mb-4 p-2 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold text-xs shadow-md">L</div>
                  <div>
                    <div className="text-xs font-bold text-primary">logo_white.svg</div>
                    <div className="text-[10px] text-secondary/50">12kb</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-10 rounded-lg bg-black shadow-sm transform hover:scale-105 transition-transform"></div>
                  <div className="h-10 rounded-lg bg-[#FF6446] shadow-sm transform hover:scale-105 transition-transform"></div>
                  <div className="h-10 rounded-lg bg-[#ECECEC] shadow-sm transform hover:scale-105 transition-transform"></div>
                </div>
              </div>

              {/* Card 2: Prompt (Left Top) - Floating Animation */}
              <div className="absolute top-24 left-4 w-72 bg-white/95 backdrop-blur-xl rounded-epopian shadow-xl border border-white/60 p-6 transform rotate-3 hover:rotate-0 transition-all duration-500 z-20 animate-float-medium ring-1 ring-black/5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg">👤</div>
                  <div className="text-xs font-bold text-primary">Votre demande</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-stroke relative">
                  <p className="text-sm text-secondary font-medium leading-relaxed">
                    "Je veux une story Instagram pour le Black Friday. Utilise mon logo en haut et une photo lifestyle en fond."
                  </p>
                  {/* Typing cursor */}
                  <span className="inline-block w-1.5 h-4 bg-primary ml-1 animate-pulse align-middle"></span>
                </div>
              </div>

              {/* Card 3: Result (Right Center - Large) */}
              <div className="absolute top-1/2 right-0 -translate-y-1/2 w-80 h-[480px] bg-white rounded-[32px] shadow-2xl border-[6px] border-white p-2 transform rotate-0 hover:scale-[1.02] transition-transform duration-700 z-30 animate-slide-in-right shadow-primary/10">
                 <div className="w-full h-full rounded-[24px] bg-gray-900 overflow-hidden relative group">
                    {/* Generated Image Mockup */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511556532299-8f662fc26c06?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-90 hover:opacity-100 transition-opacity duration-700"></div>
                    
                    {/* Brand Overlay (Logo) */}
                    <div className="absolute top-6 left-6">
                      <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold text-lg shadow-lg">L</div>
                    </div>

                    {/* Text Overlay */}
                    <div className="absolute bottom-8 left-6 right-6">
                      <h3 className="text-3xl font-black text-white mb-2 leading-none uppercase italic">Black<br/>Friday</h3>
                      <div className="inline-block px-4 py-2 bg-white text-black font-bold rounded-full text-sm transform -rotate-2">
                        -50% MAINTENANT
                      </div>
                    </div>

                    {/* Floating UI Elements */}
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Généré !
                    </div>
                 </div>
                 
                 {/* Decorative elements around result */}
                 <div className="absolute -right-12 top-20 bg-white p-3 rounded-xl shadow-lg animate-bounce-slow z-40">
                    <span className="text-2xl">👍</span>
                 </div>
                 <div className="absolute -left-6 bottom-20 bg-white p-3 rounded-xl shadow-lg animate-bounce-slow delay-700 z-40">
                    <span className="text-2xl">🔥</span>
                 </div>
              </div>
              
              {/* Connector lines (visual decoration) - Animated SVG */}
              <svg className="absolute inset-0 pointer-events-none z-0 opacity-30" width="100%" height="100%">
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor: '#ECECEC', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#000000', stopOpacity: 1}} />
                  </linearGradient>
                </defs>
                <path d="M300 220 C 350 220, 450 300, 500 350" stroke="url(#grad1)" strokeWidth="2" fill="none" strokeDasharray="5,5" className="animate-dash" />
                <path d="M300 550 C 350 550, 450 450, 500 400" stroke="url(#grad1)" strokeWidth="2" fill="none" strokeDasharray="5,5" className="animate-dash" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
