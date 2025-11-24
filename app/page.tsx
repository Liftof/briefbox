import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-page font-sans text-secondary">
      <Navigation />
      <Hero />

      {/* Problem/Solution */}
      <section className="py-24 bg-white relative z-10 rounded-t-[40px] shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block bg-page border border-stroke px-4 py-1 rounded-full text-sm font-medium text-secondary mb-6">
              La réalité du marché
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-primary tracking-tight">
              Pourquoi payer une agence ?
            </h2>
            <p className="text-xl text-secondary/70 max-w-2xl mx-auto">
              Fini le middle man hors de prix. Tout le monde peut être créatif avec les bons outils.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Agency Side */}
            <div className="p-10 bg-red-50/50 border border-red-100 rounded-epopian hover:border-red-200 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl">❌</div>
                <div className="text-lg font-bold text-red-900">Avec une agence</div>
              </div>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <span className="text-3xl grayscale opacity-70">⏱️</span>
                  <div>
                    <div className="font-bold text-gray-900 mb-1">2-3 semaines de délai</div>
                    <div className="text-sm text-gray-600 leading-relaxed">Brief, devis, allers-retours infinis, validations... un processus lourd et lent.</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-3xl grayscale opacity-70">💸</span>
                  <div>
                    <div className="font-bold text-gray-900 mb-1">2000-5000€ par campagne</div>
                    <div className="text-sm text-gray-600 leading-relaxed">Un budget qui explose avec les "jours/hommes" facturés au prix fort.</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-3xl grayscale opacity-70">😤</span>
                  <div>
                    <div className="font-bold text-gray-900 mb-1">Résultat décevant</div>
                    <div className="text-sm text-gray-600 leading-relaxed">Ils ne connaissent pas votre marque aussi bien que vous.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Solution Side */}
            <div className="p-10 bg-primary text-white rounded-epopian relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gray-800 to-black opacity-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-70 transition-opacity duration-700"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xl border border-white/20">✅</div>
                  <div className="text-lg font-bold">En solo avec QuitteTonAgence</div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">⚡</span>
                    <div>
                      <div className="font-bold text-white mb-1">2 minutes chrono</div>
                      <div className="text-sm text-white/70 leading-relaxed">Vous décrivez, l'IA génère. C'est aussi simple que ça.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">✨</span>
                    <div>
                      <div className="font-bold text-white mb-1">29€/mois illimité</div>
                      <div className="text-sm text-white/70 leading-relaxed">Plus jamais de factures surprises. Créez autant que vous voulez.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">🎨</span>
                    <div>
                      <div className="font-bold text-white mb-1">100% On-Brand</div>
                      <div className="text-sm text-white/70 leading-relaxed">L'IA respecte votre charte graphique à la lettre (Logo, typo, couleurs).</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="fonctionnement" className="py-24 bg-page">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
             <div className="inline-block bg-white border border-stroke px-4 py-1 rounded-full text-sm font-medium text-secondary mb-6 shadow-sm">
              Processus simplifié
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-primary tracking-tight">
              Simple comme 1, 2, 3
            </h2>
            <p className="text-xl text-secondary/70 max-w-2xl mx-auto">
              Une interface pensée pour ceux qui n'ont pas le temps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="card-epopian hover:translate-y-[-5px] group overflow-hidden">
              <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center text-2xl font-black mb-6 shadow-lg shadow-primary/20 relative z-10">
                1
              </div>
              <h3 className="text-xl font-bold mb-3 text-primary relative z-10">Importez votre marque</h3>
              <p className="text-secondary/70 leading-relaxed relative z-10 mb-6">
                Uploadez votre logo, définissez vos couleurs et vos typographies une bonne fois pour toutes.
              </p>
              
              {/* Visual Step 1 */}
              <div className="h-32 bg-gray-50 rounded-xl border border-stroke p-3 relative group-hover:scale-105 transition-transform duration-500">
                <div className="w-full h-full border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2">
                   <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">↑</div>
                   <div className="h-2 w-16 bg-gray-200 rounded-full"></div>
                </div>
                {/* Floating assets */}
                <div className="absolute top-4 left-4 w-8 h-8 bg-[#FF6446] rounded-lg shadow-md transform -rotate-12"></div>
                <div className="absolute bottom-4 right-4 w-10 h-10 bg-white border border-stroke rounded-full flex items-center justify-center shadow-md transform rotate-12">
                  <span className="text-[10px] font-bold">Logo</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="card-epopian hover:translate-y-[-5px] group overflow-hidden">
              <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center text-2xl font-black mb-6 shadow-lg shadow-primary/20 relative z-10">
                2
              </div>
              <h3 className="text-xl font-bold mb-3 text-primary relative z-10">Décrivez votre besoin</h3>
              <p className="text-secondary/70 leading-relaxed relative z-10 mb-6">
                "Je veux une story Instagram pour le Black Friday". Plus besoin de rédiger un brief complexe.
              </p>

               {/* Visual Step 2 */}
              <div className="h-32 bg-gray-50 rounded-xl border border-stroke p-3 relative group-hover:scale-105 transition-transform duration-500 flex flex-col justify-center">
                 <div className="bg-white border border-stroke p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[90%] mb-2">
                    <div className="h-2 w-full bg-gray-200 rounded-full mb-1.5"></div>
                    <div className="h-2 w-2/3 bg-gray-200 rounded-full"></div>
                 </div>
                 <div className="flex justify-end">
                    <div className="bg-primary text-white p-2 rounded-2xl rounded-tr-none shadow-md text-[10px] font-bold px-3">
                       Génère ça ! ⚡
                    </div>
                 </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="card-epopian hover:translate-y-[-5px] group overflow-hidden">
              <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center text-2xl font-black mb-6 shadow-lg shadow-primary/20 relative z-10">
                3
              </div>
              <h3 className="text-xl font-bold mb-3 text-primary relative z-10">L'IA génère tout</h3>
              <p className="text-secondary/70 leading-relaxed relative z-10 mb-6">
                Obtenez instantanément des visuels déclinés dans tous les formats, prêts à être postés.
              </p>

              {/* Visual Step 3 */}
              <div className="h-32 bg-gray-50 rounded-xl border border-stroke p-2 relative group-hover:scale-105 transition-transform duration-500 grid grid-cols-2 gap-2 overflow-hidden">
                 <div className="bg-gray-200 rounded-lg animate-pulse"></div>
                 <div className="bg-gray-800 rounded-lg"></div>
                 <div className="bg-gray-300 rounded-lg"></div>
                 <div className="bg-gray-100 rounded-lg"></div>
                 <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent flex items-end justify-center pb-2">
                    <span className="text-xs font-bold text-primary bg-white px-2 py-1 rounded shadow-sm">✨ Fini !</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="tarifs" className="py-24 bg-white rounded-t-[40px] shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-primary tracking-tight">
              Tarifs transparents
            </h2>
            <p className="text-xl text-secondary/70">
              Commencez gratuit, scalez quand vous voulez
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
            <div className="card-epopian border-stroke bg-page">
              <h3 className="text-2xl font-bold mb-2 text-primary">Free</h3>
              <div className="text-5xl font-black mb-4 text-primary">0€</div>
              <p className="text-secondary/60 mb-8 font-medium">Pour tester l'outil</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span className="text-secondary">10 générations/mois</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span className="text-secondary">Tous les templates</span>
                </li>
                <li className="flex items-center gap-3 opacity-40">
                  <span className="font-bold">✗</span>
                  <span>Charte graphique</span>
                </li>
              </ul>
              <Link href="/playground" className="btn-secondary w-full block text-center">
                Commencer
              </Link>
            </div>

            <div className="card-epopian bg-primary text-white ring-4 ring-offset-4 ring-primary/10 transform lg:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-primary rounded-b-xl text-xs font-black uppercase tracking-widest shadow-sm">
                Recommandé
              </div>
              <h3 className="text-2xl font-bold mb-2 mt-2">Pro</h3>
              <div className="text-5xl font-black mb-1">29€<span className="text-xl font-normal text-white/60">/mois</span></div>
              <p className="text-white/60 mb-8 font-medium">Pour les freelances</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <span className="font-bold text-white">✓</span>
                  <span>Générations illimitées</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="font-bold text-white">✓</span>
                  <span>Tous les templates</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="font-bold text-white">✓</span>
                  <span>Charte graphique illimitée</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="font-bold text-white">✓</span>
                  <span>Exports HD</span>
                </li>
              </ul>
              <button className="w-full py-4 bg-white text-primary rounded-epopian font-bold hover:bg-gray-100 transition-colors shadow-lg">
                Essai gratuit 14j
              </button>
            </div>

            <div className="card-epopian border-stroke bg-page">
              <h3 className="text-2xl font-bold mb-2 text-primary">Agency</h3>
              <div className="text-5xl font-black mb-4 text-primary">99€<span className="text-xl font-normal text-secondary/60">/mois</span></div>
              <p className="text-secondary/60 mb-8 font-medium">Pour les agences</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span className="text-secondary">Tout du plan Pro</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span className="text-secondary">5 sièges inclus</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span className="text-secondary">API access</span>
                </li>
              </ul>
              <button className="btn-secondary w-full block text-center">
                Réserver une démo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-page">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-primary tracking-tight">
              Questions fréquentes
            </h2>
          </div>

          <div className="space-y-4">
            <details className="group card-epopian !p-0 overflow-hidden cursor-pointer">
              <summary className="flex justify-between items-center p-6 font-bold text-lg text-primary select-none">
                Comment ça marche sans agence ?
                <span className="text-2xl text-primary/50 group-open:rotate-45 transition-transform duration-300">+</span>
              </summary>
              <div className="px-6 pb-6 text-secondary/70 leading-relaxed border-t border-stroke pt-4">
                L'IA fait le travail d'un directeur artistique. Vous uploadez votre charte graphique (logo, couleurs, typo) et l'IA génère des visuels pro qui respectent votre identité.
              </div>
            </details>

            <details className="group card-epopian !p-0 overflow-hidden cursor-pointer">
              <summary className="flex justify-between items-center p-6 font-bold text-lg text-primary select-none">
                Quels formats sont supportés ?
                <span className="text-2xl text-primary/50 group-open:rotate-45 transition-transform duration-300">+</span>
              </summary>
              <div className="px-6 pb-6 text-secondary/70 leading-relaxed border-t border-stroke pt-4">
                Instagram (Stories, Posts), LinkedIn, Facebook, Twitter/X, Pinterest. Chaque export est optimisé pour la plateforme choisie.
              </div>
            </details>

            <details className="group card-epopian !p-0 overflow-hidden cursor-pointer">
              <summary className="flex justify-between items-center p-6 font-bold text-lg text-primary select-none">
                Les visuels sont-ils libres de droits ?
                <span className="text-2xl text-primary/50 group-open:rotate-45 transition-transform duration-300">+</span>
              </summary>
              <div className="px-6 pb-6 text-secondary/70 leading-relaxed border-t border-stroke pt-4">
                Oui, absolument. Vous détenez 100% des droits commerciaux sur toutes les images générées.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight">
            Prêt à quitter votre agence&nbsp;?
          </h2>
          <p className="text-xl mb-10 opacity-80 max-w-2xl mx-auto font-light">
            Rejoignez ceux qui créent leurs visuels pro en 2 minutes sans payer une agence.
          </p>
          <Link href="/playground" className="inline-block px-12 py-5 bg-white text-primary text-lg font-bold rounded-full hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl">
            Devenir autonome gratuitement →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-page border-t border-stroke py-20 text-secondary">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                   <span className="text-white text-xs font-bold">Q</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-primary">QuitteTonAgence</span>
              </div>
              <p className="text-secondary/60 text-sm leading-relaxed">
                La première plateforme d'IA générative dédiée aux marques qui veulent reprendre le contrôle de leur image.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-primary">Produit</h4>
              <div className="space-y-3 text-sm text-secondary/60">
                <a href="#fonctionnement" className="block hover:text-primary transition-colors">Comment ça marche</a>
                <a href="#tarifs" className="block hover:text-primary transition-colors">Tarifs</a>
                <a href="/playground" className="block hover:text-primary transition-colors">Playground</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-primary">Ressources</h4>
              <div className="space-y-3 text-sm text-secondary/60">
                <a href="#" className="block hover:text-primary transition-colors">Documentation</a>
                <a href="#faq" className="block hover:text-primary transition-colors">FAQ</a>
                <a href="#" className="block hover:text-primary transition-colors">Blog</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-primary">Légal</h4>
              <div className="space-y-3 text-sm text-secondary/60">
                <a href="#" className="block hover:text-primary transition-colors">CGU</a>
                <a href="#" className="block hover:text-primary transition-colors">Confidentialité</a>
              </div>
            </div>
          </div>
          <div className="border-t border-stroke pt-8 text-center text-sm text-secondary/40 flex flex-col md:flex-row justify-between items-center gap-4">
            <span>© 2025 QuitteTonAgence. Tous droits réservés.</span>
            <div className="flex gap-4">
               {/* Social icons could go here */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

