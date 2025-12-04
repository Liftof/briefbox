import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-gray-900">
      <Navigation />
      <Hero />

      {/* Problem/Solution Section */}
      <section className="py-32 relative">
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          {/* Section header */}
          <div className="max-w-2xl mb-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Le problème</span>
            </div>
            <h2 className="text-4xl font-light text-gray-900 leading-tight mb-4">
              Pourquoi payer<br />
              <span className="font-semibold">une agence ?</span>
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Fini le middle man hors de prix. Tout le monde peut créer des visuels professionnels.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Agency Side */}
            <div className="relative">
              <div className="absolute -top-3 -left-3 w-6 h-6 border-l-2 border-t-2 border-red-200" />
              <div className="bg-white border border-gray-200 p-10">
                <div className="flex items-center gap-3 mb-8">
                  <span className="text-xs font-mono uppercase tracking-widest text-red-400">Avec une agence</span>
                </div>
                
                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-400 text-sm flex-shrink-0">×</div>
                    <div>
                      <div className="font-medium text-gray-900 mb-1">2-3 semaines de délai</div>
                      <div className="text-sm text-gray-400 leading-relaxed">Brief, devis, allers-retours infinis, validations...</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-400 text-sm flex-shrink-0">×</div>
                    <div>
                      <div className="font-medium text-gray-900 mb-1">2000-5000€ par campagne</div>
                      <div className="text-sm text-gray-400 leading-relaxed">Des "jours/hommes" facturés au prix fort.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-400 text-sm flex-shrink-0">×</div>
                    <div>
                      <div className="font-medium text-gray-900 mb-1">Résultat décevant</div>
                      <div className="text-sm text-gray-400 leading-relaxed">Ils ne connaissent pas votre marque aussi bien que vous.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Solution Side */}
            <div className="relative">
              <div className="absolute -bottom-3 -right-3 w-6 h-6 border-r-2 border-b-2 border-emerald-300" />
              <div className="bg-gray-900 text-white p-10 h-full">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Avec Flowww</span>
                </div>
                
                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 text-sm flex-shrink-0">✓</div>
                    <div>
                      <div className="font-medium text-white mb-1">2 minutes chrono</div>
                      <div className="text-sm text-gray-400 leading-relaxed">Vous décrivez, l'IA génère. C'est aussi simple que ça.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 text-sm flex-shrink-0">✓</div>
                    <div>
                      <div className="font-medium text-white mb-1">Dès 19€/mois</div>
                      <div className="text-sm text-gray-400 leading-relaxed">Visuels 2K haute résolution inclus.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 text-sm flex-shrink-0">✓</div>
                    <div>
                      <div className="font-medium text-white mb-1">100% On-Brand</div>
                      <div className="text-sm text-gray-400 leading-relaxed">L'IA respecte votre charte graphique à la lettre.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="fonctionnement" className="py-32 bg-white relative">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section header */}
          <div className="max-w-2xl mb-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-gray-900 rounded-full" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Processus</span>
            </div>
            <h2 className="text-4xl font-light text-gray-900 leading-tight mb-4">
              Simple comme<br />
              <span className="font-semibold">1, 2, 3</span>
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Une interface pensée pour ceux qui n'ont pas le temps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="text-8xl font-light text-gray-100 absolute -top-4 -left-2">1</div>
              <div className="relative z-10 pt-12">
                <h3 className="text-xl font-medium text-gray-900 mb-3">Importez votre marque</h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  Uploadez votre logo, définissez vos couleurs et typographies une bonne fois pour toutes.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="text-8xl font-light text-gray-100 absolute -top-4 -left-2">2</div>
              <div className="relative z-10 pt-12">
                <h3 className="text-xl font-medium text-gray-900 mb-3">Décrivez votre besoin</h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  "Je veux une story Instagram pour le Black Friday". Plus besoin de brief complexe.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="text-8xl font-light text-gray-100 absolute -top-4 -left-2">3</div>
              <div className="relative z-10 pt-12">
                <h3 className="text-xl font-medium text-gray-900 mb-3">L'IA génère tout</h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  Obtenez instantanément des visuels déclinés dans tous les formats, prêts à poster.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="tarifs" className="py-32 relative">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          {/* Section header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-gray-900 rounded-full" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Tarifs</span>
            </div>
            <h2 className="text-4xl font-light text-gray-900 leading-tight mb-4">
              Transparents et<br />
              <span className="font-semibold">sans surprise</span>
            </h2>
          </div>

          {/* Resolution badge */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-gray-500 bg-gray-100 px-4 py-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              Tous les visuels en 2K haute résolution
            </span>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 items-start">
            {/* Starter */}
            <div className="bg-white border border-gray-200 p-8">
              <div className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">Starter</div>
              <div className="text-4xl font-light text-gray-900 mb-2">Gratuit</div>
              <p className="text-sm text-gray-400 mb-8">Pour découvrir l'outil</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-emerald-500">✓</span>
                  3 générations offertes
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-emerald-500">✓</span>
                  Analyse de marque complète
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-emerald-500">✓</span>
                  Export 2K haute résolution
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <span>×</span>
                  Galerie d'inspirations
                </li>
              </ul>
              
              <Link href="/playground" className="block w-full py-3 text-center text-sm font-medium text-gray-900 border border-gray-200 hover:border-gray-900 transition-colors">
                Commencer gratuitement
              </Link>
            </div>

            {/* Pro - Featured */}
            <div className="relative bg-gray-900 text-white p-8 lg:-mt-4 lg:-mb-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white text-[10px] font-mono uppercase tracking-widest px-3 py-1">
                Populaire
              </div>
              
              <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-4">Pro</div>
              <div className="text-4xl font-light text-white mb-2">19€<span className="text-lg text-gray-500">/mois</span></div>
              <p className="text-sm text-gray-400 mb-8">50 crédits • Idéal pour freelances</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="text-emerald-400">✓</span>
                  50 générations/mois
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="text-emerald-400">✓</span>
                  Galerie d'inspirations complète
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="text-emerald-400">✓</span>
                  Tous les ratios et formats
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="text-emerald-400">✓</span>
                  Historique illimité
                </li>
              </ul>
              
              <button className="w-full py-3 text-center text-sm font-medium bg-white text-gray-900 hover:bg-gray-100 transition-colors">
                Essai gratuit 7 jours
              </button>
            </div>

            {/* Business */}
            <div className="bg-white border border-gray-200 p-8">
              <div className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">Business</div>
              <div className="text-4xl font-light text-gray-900 mb-2">49€<span className="text-lg text-gray-400">/mois</span></div>
              <p className="text-sm text-gray-400 mb-8">150 crédits • Pour les équipes</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-emerald-500">✓</span>
                  150 générations/mois
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-emerald-500">✓</span>
                  Tout du plan Pro
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-emerald-500">✓</span>
                  3 membres d'équipe
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-emerald-500">✓</span>
                  Support prioritaire
                </li>
              </ul>
              
              <button className="block w-full py-3 text-center text-sm font-medium text-gray-900 border border-gray-200 hover:border-gray-900 transition-colors">
                Contacter les ventes
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-32 bg-white">
        <div className="max-w-2xl mx-auto px-6">
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-gray-900 rounded-full" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">FAQ</span>
            </div>
            <h2 className="text-4xl font-light text-gray-900 leading-tight">
              Questions<br />
              <span className="font-semibold">fréquentes</span>
            </h2>
          </div>

          <div className="space-y-4">
            <details className="group border border-gray-200 bg-white">
              <summary className="flex justify-between items-center p-6 cursor-pointer select-none">
                <span className="font-medium text-gray-900">Comment ça marche sans agence ?</span>
                <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                L'IA fait le travail d'un directeur artistique. Vous uploadez votre charte graphique et l'IA génère des visuels pro qui respectent votre identité.
              </div>
            </details>

            <details className="group border border-gray-200 bg-white">
              <summary className="flex justify-between items-center p-6 cursor-pointer select-none">
                <span className="font-medium text-gray-900">Quels formats sont supportés ?</span>
                <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                Instagram (Stories, Posts), LinkedIn, Facebook, Twitter/X, Pinterest. Chaque export est optimisé.
              </div>
            </details>

            <details className="group border border-gray-200 bg-white">
              <summary className="flex justify-between items-center p-6 cursor-pointer select-none">
                <span className="font-medium text-gray-900">Les visuels sont-ils libres de droits ?</span>
                <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                Oui, absolument. Vous détenez 100% des droits commerciaux sur toutes les images générées.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-gray-900 text-white relative overflow-hidden">
        {/* Floating accents */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-light mb-6 leading-tight">
            Prêt à quitter<br />
            <span className="font-semibold">votre agence ?</span>
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
            Rejoignez ceux qui créent leurs visuels pro en 2 minutes.
          </p>
          <Link 
            href="/playground" 
            className="inline-flex items-center gap-3 bg-white text-gray-900 px-8 py-4 font-medium text-sm hover:bg-gray-100 transition-colors"
          >
            <span>Devenir autonome gratuitement</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-[#FAFAFA] border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">B</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Flowww</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                La première plateforme d'IA générative dédiée aux marques.
              </p>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-4">Produit</div>
              <div className="space-y-2 text-sm text-gray-500">
                <a href="#fonctionnement" className="block hover:text-gray-900 transition-colors">Comment ça marche</a>
                <a href="#tarifs" className="block hover:text-gray-900 transition-colors">Tarifs</a>
                <a href="/playground" className="block hover:text-gray-900 transition-colors">Playground</a>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-4">Ressources</div>
              <div className="space-y-2 text-sm text-gray-500">
                <a href="#" className="block hover:text-gray-900 transition-colors">Documentation</a>
                <a href="#faq" className="block hover:text-gray-900 transition-colors">FAQ</a>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-4">Légal</div>
              <div className="space-y-2 text-sm text-gray-500">
                <a href="#" className="block hover:text-gray-900 transition-colors">CGU</a>
                <a href="#" className="block hover:text-gray-900 transition-colors">Confidentialité</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-xs text-gray-400">© 2025 Flowww. Tous droits réservés.</span>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Tous les systèmes opérationnels
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
