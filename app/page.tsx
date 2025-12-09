import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import CtaSection from '@/components/CtaSection';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-gray-900">
      <Navigation />
      <Hero />

      {/* Problem Section */}
      <section className="py-24 md:py-32 relative">
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          {/* Section header */}
          <div className="max-w-3xl mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Le problème</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 leading-tight mb-6">
              Lundi 9h. Votre boss veut<br />
              <span className="font-semibold">une campagne pour vendredi.</span>
            </h2>
            <p className="text-gray-500 leading-relaxed text-lg">
              Vous connaissez la suite : brief à l'agence, devis dans 48h, premiers retours dans 2 semaines, résultat qui ressemble à tout sauf à votre marque. Ou alors Canva, et ce rendu "template gratuit" que tout le monde reconnaît.
            </p>
          </div>

          {/* Comparison Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* What you do today */}
            <div className="relative">
              <div className="absolute -top-3 -left-3 w-6 h-6 border-l-2 border-t-2 border-red-200" />
              <div className="bg-white border border-gray-200 p-8 md:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <span className="text-xs font-mono uppercase tracking-widest text-red-400">Ce que vous faites aujourd'hui</span>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-400 text-sm flex-shrink-0">✗</div>
                    <div>
                      <div className="font-medium text-gray-900 mb-1">2-3 semaines pour un visuel</div>
                      <div className="text-sm text-gray-400 leading-relaxed">Brief, devis, allers-retours, validations... Votre Black Friday est passé.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-400 text-sm flex-shrink-0">✗</div>
                    <div>
                      <div className="font-medium text-gray-900 mb-1">2000-5000€ par campagne</div>
                      <div className="text-sm text-gray-400 leading-relaxed">Pour des "jours/homme" et des réunions de cadrage.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-400 text-sm flex-shrink-0">✗</div>
                    <div>
                      <div className="font-medium text-gray-900 mb-1">Un résultat générique</div>
                      <div className="text-sm text-gray-400 leading-relaxed">Ils ont 15 clients. Vous êtes le n°12 sur leur liste.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What you could do */}
            <div className="relative">
              <div className="absolute -bottom-3 -right-3 w-6 h-6 border-r-2 border-b-2 border-blue-300" />
              <div className="bg-gray-900 text-white p-8 md:p-10 h-full">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  <span className="text-xs font-mono uppercase tracking-widest text-blue-400">Ce que vous pourriez faire</span>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-sm flex-shrink-0">✓</div>
                    <div>
                      <div className="font-medium text-white mb-1">2 minutes. Vraiment.</div>
                      <div className="text-sm text-gray-400 leading-relaxed">Décrivez ce que vous voulez. Publiez. C'est tout.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-sm flex-shrink-0">✓</div>
                    <div>
                      <div className="font-medium text-white mb-1">19€/mois. Tout compris.</div>
                      <div className="text-sm text-gray-400 leading-relaxed">Pas de surprise. Pas de devis. Pas de "ça dépend".</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-sm flex-shrink-0">✓</div>
                    <div>
                      <div className="font-medium text-white mb-1">100% votre marque</div>
                      <div className="text-sm text-gray-400 leading-relaxed">Vos couleurs, votre logo, votre ton. Palette apprend, vous validez.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="fonctionnement" className="py-24 md:py-32 bg-white relative">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section header */}
          <div className="max-w-3xl mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-gray-900 rounded-full" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Comment ça marche</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 leading-tight mb-6">
              Plus simple que d'expliquer<br />
              <span className="font-semibold">à votre stagiaire</span>
            </h2>
            <p className="text-gray-500 leading-relaxed text-lg">
              Pas de formation. Pas de tutoriel de 45 minutes. Si vous savez écrire un SMS, vous savez utiliser Palette.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 md:gap-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="text-8xl font-light text-gray-100 absolute -top-4 -left-2">1</div>
              <div className="relative z-10 pt-12">
                <h3 className="text-xl font-medium text-gray-900 mb-3">Collez votre site web</h3>
                <p className="text-gray-500 leading-relaxed">
                  Palette scanne votre marque : logo, couleurs, typos, ton. Une seule fois, pour toujours.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="text-8xl font-light text-gray-100 absolute -top-4 -left-2">2</div>
              <div className="relative z-10 pt-12">
                <h3 className="text-xl font-medium text-gray-900 mb-3">Dites ce que vous voulez</h3>
                <p className="text-gray-500 leading-relaxed">
                  "Une story pour le Black Friday". "Un carousel LinkedIn sur notre levée de fonds". En français, comme vous parleriez à un humain.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="text-8xl font-light text-gray-100 absolute -top-4 -left-2">3</div>
              <div className="relative z-10 pt-12">
                <h3 className="text-xl font-medium text-gray-900 mb-3">Publiez ou ajustez</h3>
                <p className="text-gray-500 leading-relaxed">
                  Visuels générés en 60 secondes. Un détail à changer ? Un clic. Pas satisfait ? Régénérez. Gratuit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proof Section - Gallery */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 leading-tight mb-4">
              Ce que nos utilisateurs<br />
              <span className="font-semibold">créent avec Palette</span>
            </h2>
            <p className="text-gray-500">De vrais visuels, générés en quelques clics.</p>
          </div>
          
          {/* Gallery Grid - Placeholder for real examples */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/5] bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-xs font-mono uppercase tracking-wider">Exemple {i}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link href="/playground" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Créer votre premier visuel →
            </Link>
          </div>
        </div>
      </section>

      {/* Objection Handling */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 leading-tight">
              <span className="font-semibold">"Oui mais..."</span>
            </h2>
          </div>
          
          <div className="space-y-8">
            {/* Objection 1 */}
            <div className="border border-gray-200 p-6 md:p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-3">"Ça fait des trucs moches, non ?"</h3>
              <p className="text-gray-500 leading-relaxed">
                Palette ne génère pas d'images génériques. Elle apprend <span className="text-gray-900 font-medium">votre marque</span>. Vos couleurs. Votre style. C'est pour ça que le résultat ressemble à vous, pas à une banque d'images.
              </p>
            </div>
            
            {/* Objection 2 */}
            <div className="border border-gray-200 p-6 md:p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-3">"J'ai déjà Canva"</h3>
              <p className="text-gray-500 leading-relaxed">
                Canva vous donne des templates. Palette vous donne <span className="text-gray-900 font-medium">vos visuels</span>. La différence ? Personne ne reconnaît que c'est généré.
              </p>
            </div>
            
            {/* Objection 3 */}
            <div className="border border-gray-200 p-6 md:p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-3">"Mon agence connaît ma marque"</h3>
              <p className="text-gray-500 leading-relaxed">
                Après 6 mois et 15 000€ de factures, peut-être. Palette comprend votre marque <span className="text-gray-900 font-medium">en 60 secondes</span>. Et elle n'oublie jamais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="tarifs" className="py-24 md:py-32 relative">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          {/* Section header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-gray-900 rounded-full" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Tarifs</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 leading-tight mb-4">
              Moins cher qu'un café par jour.<br />
              <span className="font-semibold">Pour tous vos visuels.</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Pas de devis. Pas de "ça dépend du scope". Tous les visuels en 2K haute résolution.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 items-start mt-12">
            {/* Starter */}
            <div className="bg-white border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-mono uppercase tracking-widest text-gray-400">Starter</div>
              </div>
              <div className="text-4xl font-light text-gray-900 mb-2">Gratuit</div>
              <p className="text-sm text-gray-500 mb-8">Pour voir si ça marche vraiment</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-blue-500">✓</span>
                  3 générations offertes
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-blue-500">✓</span>
                  Analyse de marque complète
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-blue-500">✓</span>
                  Export 2K haute résolution
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <span>✗</span>
                  Galerie d'inspirations
                </li>
              </ul>
              
              <Link href="/playground" className="block w-full py-3 text-center text-sm font-medium text-gray-900 border border-gray-200 hover:border-gray-900 transition-colors">
                Tester gratuitement
              </Link>
            </div>

            {/* Pro - Featured */}
            <div className="relative bg-gray-900 text-white p-8 lg:-mt-4 lg:-mb-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-[10px] font-mono uppercase tracking-widest px-3 py-1">
                Populaire
              </div>
              
              <div className="text-xs font-mono uppercase tracking-widest text-blue-400 mb-4">Pro</div>
              <div className="text-4xl font-light text-white mb-2">19€<span className="text-lg text-gray-500">/mois</span></div>
              <p className="text-sm text-gray-400 mb-8">Pour ceux qui publient chaque semaine</p>
              
              <div className="text-xs font-mono text-gray-500 mb-6">50 crédits/mois</div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="text-blue-400">✓</span>
                  50 générations/mois
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="text-blue-400">✓</span>
                  Galerie d'inspirations complète
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="text-blue-400">✓</span>
                  Tous les ratios et formats
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="text-blue-400">✓</span>
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
              <p className="text-sm text-gray-500 mb-8">Pour les équipes qui produisent</p>
              
              <div className="text-xs font-mono text-gray-400 mb-6">150 crédits/mois</div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-blue-500">✓</span>
                  150 générations/mois
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-blue-500">✓</span>
                  Tout du plan Pro
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-blue-500">✓</span>
                  3 membres d'équipe
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-blue-500">✓</span>
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
      <section id="faq" className="py-24 md:py-32 bg-white">
        <div className="max-w-2xl mx-auto px-6">
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-gray-900 rounded-full" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">FAQ</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 leading-tight">
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
                Palette fait le travail d'un directeur artistique. Entrez votre site, on récupère votre charte, et vous générez des visuels pro qui respectent votre identité.
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
                Instagram (Stories, Posts), LinkedIn, Facebook, Twitter/X, Pinterest. Chaque export est optimisé pour la plateforme.
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

            <details className="group border border-gray-200 bg-white">
              <summary className="flex justify-between items-center p-6 cursor-pointer select-none">
                <span className="font-medium text-gray-900">Et si je ne suis pas satisfait ?</span>
                <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                Régénérez autant de fois que vous voulez. Modifiez un détail en un clic. Et si vraiment ça ne va pas, on rembourse sans poser de questions.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <CtaSection />

      {/* Footer */}
      <footer className="py-16 bg-[#FAFAFA] border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12 mb-12">
            <div>
              <div className="mb-4">
                <img src="/logo.png" alt="Palette" className="h-8 object-contain" />
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Des visuels pros, cohérents, générés automatiquement.
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
            <span className="text-xs text-gray-400">© 2025 Palette. Tous droits réservés.</span>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Tous les systèmes opérationnels
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
