import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import CtaSection from '@/components/CtaSection';
import Link from 'next/link';
import { headers } from 'next/headers';
import { getServerLocale } from '@/lib/i18n';

export default async function Home() {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || 'fr';
  const locale = getServerLocale(acceptLanguage);
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
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">{locale === 'fr' ? 'Le problème' : 'The problem'}</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 leading-tight mb-6">
              {locale === 'fr' ? (
                <>Lundi 9h. Votre boss veut<br /><span className="font-semibold">une campagne pour vendredi.</span></>
              ) : (
                <>Monday 9am. Your boss wants<br /><span className="font-semibold">a campaign by Friday.</span></>
              )}
            </h2>
            <p className="text-gray-500 leading-relaxed text-lg">
              {locale === 'fr' 
                ? "Vous connaissez la suite : brief à l'agence, devis dans 48h, premiers retours dans 2 semaines, résultat qui ressemble à tout sauf à votre marque. Ou alors Canva, et ce rendu \"template gratuit\" que tout le monde reconnaît."
                : "You know how it goes: brief the agency, quote in 48h, first feedback in 2 weeks, result that looks nothing like your brand. Or Canva, and that \"free template\" look everyone recognizes."
              }
            </p>
          </div>

          {/* Comparison Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* What you do today */}
            <div className="relative">
              <div className="absolute -top-3 -left-3 w-6 h-6 border-l-2 border-t-2 border-red-200" />
              <div className="bg-white border border-gray-200 p-8 md:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <span className="text-xs font-mono uppercase tracking-widest text-red-400">{locale === 'fr' ? "Ce que vous faites aujourd'hui" : "What you do today"}</span>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-400 text-sm flex-shrink-0">✗</div>
                    <div>
                      <div className="font-medium text-gray-900 mb-1">{locale === 'fr' ? '2-3 semaines pour un visuel' : '2-3 weeks for one visual'}</div>
                      <div className="text-sm text-gray-400 leading-relaxed">{locale === 'fr' ? 'Brief, devis, allers-retours, validations... Votre Black Friday est passé.' : 'Brief, quote, back and forth, validations... Your Black Friday is over.'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-400 text-sm flex-shrink-0">✗</div>
                    <div>
                      <div className="font-medium text-gray-900 mb-1">{locale === 'fr' ? '2000-5000€ par campagne' : '$2000-5000 per campaign'}</div>
                      <div className="text-sm text-gray-400 leading-relaxed">{locale === 'fr' ? 'Pour des "jours/homme" et des réunions de cadrage.' : 'For "man-days" and kickoff meetings.'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-400 text-sm flex-shrink-0">✗</div>
                    <div>
                      <div className="font-medium text-gray-900 mb-1">{locale === 'fr' ? 'Un résultat générique' : 'Generic results'}</div>
                      <div className="text-sm text-gray-400 leading-relaxed">{locale === 'fr' ? 'Ils ont 15 clients. Vous êtes le n°12 sur leur liste.' : 'They have 15 clients. You\'re #12 on their list.'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What you could do - Light gradient with Palette colors */}
            <div className="relative">
              <div className="absolute -bottom-3 -right-3 w-6 h-6 border-r-2 border-b-2 border-blue-400" />
              <div className="bg-gradient-to-br from-blue-50 via-white to-amber-50 border border-blue-100 p-8 md:p-10 h-full relative overflow-hidden">
                {/* Subtle color blobs */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-200/20 rounded-full blur-2xl" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="flex -space-x-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <div className="w-2 h-2 bg-amber-400 rounded-full" />
                    </div>
                    <span className="text-xs font-mono uppercase tracking-widest text-blue-600">{locale === 'fr' ? "Ce que vous pourriez faire" : "What you could do"}</span>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 shadow-lg shadow-blue-500/30">✓</div>
                      <div>
                        <div className="font-medium text-gray-900 mb-1">{locale === 'fr' ? '2 minutes. Vraiment.' : '2 minutes. Really.'}</div>
                        <div className="text-sm text-gray-500 leading-relaxed">{locale === 'fr' ? "Décrivez ce que vous voulez. Publiez. C'est tout." : "Describe what you want. Publish. That's it."}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 shadow-lg shadow-amber-400/30">✓</div>
                      <div>
                        <div className="font-medium text-gray-900 mb-1">{locale === 'fr' ? '19€/mois. Tout compris.' : '$19/mo. All included.'}</div>
                        <div className="text-sm text-gray-500 leading-relaxed">{locale === 'fr' ? 'Pas de surprise. Pas de devis. Pas de "ça dépend".' : 'No surprises. No quotes. No "it depends".'}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 shadow-lg shadow-red-500/30">✓</div>
                      <div>
                        <div className="font-medium text-gray-900 mb-1">{locale === 'fr' ? '100% votre marque' : '100% your brand'}</div>
                        <div className="text-sm text-gray-500 leading-relaxed">{locale === 'fr' ? 'Vos couleurs, votre logo, votre ton. Palette apprend, vous validez.' : 'Your colors, your logo, your tone. Palette learns, you approve.'}</div>
                      </div>
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
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">{locale === 'fr' ? 'Comment ça marche' : 'How it works'}</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 leading-tight mb-6">
              {locale === 'fr' ? (
                <>Plus simple que d'expliquer<br /><span className="font-semibold">à votre stagiaire</span></>
              ) : (
                <>Simpler than explaining<br /><span className="font-semibold">to your intern</span></>
              )}
            </h2>
            <p className="text-gray-500 leading-relaxed text-lg">
              {locale === 'fr' 
                ? 'Pas de formation. Pas de tutoriel de 45 minutes. Si vous savez écrire un SMS, vous savez utiliser Palette.'
                : 'No training. No 45-minute tutorial. If you can write a text, you can use Palette.'
              }
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 md:gap-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="text-8xl font-light text-red-100 absolute -top-4 -left-2">1</div>
              <div className="relative z-10 pt-12">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">{locale === 'fr' ? 'Collez votre site web' : 'Paste your website'}</h3>
                <p className="text-gray-500 leading-relaxed">
                  {locale === 'fr' 
                    ? 'Palette scanne votre marque : logo, couleurs, typos, ton. Une seule fois, pour toujours.'
                    : 'Palette scans your brand: logo, colors, fonts, tone. Once, forever.'
                  }
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="text-8xl font-light text-blue-100 absolute -top-4 -left-2">2</div>
              <div className="relative z-10 pt-12">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">{locale === 'fr' ? 'Dites ce que vous voulez' : 'Say what you want'}</h3>
                <p className="text-gray-500 leading-relaxed">
                  {locale === 'fr' 
                    ? '"Une story pour le Black Friday". "Un carousel LinkedIn sur notre levée de fonds". En français, comme vous parleriez à un humain.'
                    : '"A Black Friday story". "A LinkedIn carousel about our fundraise". In plain English, like you\'d talk to a human.'
                  }
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="text-8xl font-light text-amber-100 absolute -top-4 -left-2">3</div>
              <div className="relative z-10 pt-12">
                <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">{locale === 'fr' ? 'Publiez ou ajustez' : 'Publish or adjust'}</h3>
                <p className="text-gray-500 leading-relaxed">
                  {locale === 'fr' 
                    ? 'Visuels générés en 60 secondes. Un détail à changer ? Un clic. Pas satisfait ? Régénérez. Gratuit.'
                    : 'Visuals generated in 60 seconds. Need a change? One click. Not happy? Regenerate. Free.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proof Section - Gallery */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />
        {/* Palette color accents */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-red-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-200/15 rounded-full blur-3xl" />
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 leading-tight mb-4">
              {locale === 'fr' ? (
                <>Ce que nos utilisateurs<br /><span className="font-semibold">créent avec Palette</span></>
              ) : (
                <>What our users<br /><span className="font-semibold">create with Palette</span></>
              )}
            </h2>
            <p className="text-gray-500">{locale === 'fr' ? 'De vrais visuels, générés en quelques clics.' : 'Real visuals, generated in a few clicks.'}</p>
          </div>
          
          {/* Infinite scrolling gallery */}
          <div className="relative overflow-hidden">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />
            
            {/* Scrolling container */}
            <div className="flex gap-4 animate-marquee hover:[animation-play-state:paused]">
              {/* First set */}
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={`a-${i}`} className="w-48 md:w-64 flex-shrink-0">
                  <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <img 
                      src={`/gallery/gal-${i}.png`} 
                      alt={`Visuel créé avec Palette ${i}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
              {/* Duplicate for seamless loop */}
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={`b-${i}`} className="w-48 md:w-64 flex-shrink-0">
                  <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <img 
                      src={`/gallery/gal-${i}.png`} 
                      alt={`Visuel créé avec Palette ${i}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
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
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">{locale === 'fr' ? 'Tarifs' : 'Pricing'}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 leading-tight mb-4">
              {locale === 'fr' ? (
                <>Moins cher qu'un café par jour.<br /><span className="font-semibold">Pour tous vos visuels.</span></>
              ) : (
                <>Cheaper than a coffee a day.<br /><span className="font-semibold">For all your visuals.</span></>
              )}
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              {locale === 'fr' 
                ? 'Pas de devis. Pas de "ça dépend du scope". Tous les visuels en 2K haute résolution.'
                : 'No quotes. No "it depends on scope". All visuals in 2K high resolution.'
              }
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 items-start mt-12">
            {/* Starter */}
            <div className="bg-white border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-mono uppercase tracking-widest text-gray-400">{locale === 'fr' ? 'Starter' : 'Starter'}</div>
              </div>
              <div className="text-4xl font-light text-gray-900 mb-2">{locale === 'fr' ? 'Gratuit' : 'Free'}</div>
              <p className="text-sm text-gray-500 mb-8">{locale === 'fr' ? 'Pour voir si ça marche vraiment' : 'To see if it really works'}</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-blue-500">✓</span>
                  {locale === 'fr' ? '3 générations offertes' : '3 free generations'}
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-blue-500">✓</span>
                  {locale === 'fr' ? 'Analyse de marque complète' : 'Full brand analysis'}
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-blue-500">✓</span>
                  {locale === 'fr' ? 'Export 2K haute résolution' : '2K high resolution export'}
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <span>✗</span>
                  {locale === 'fr' ? "Galerie d'inspirations" : "Inspiration gallery"}
                </li>
              </ul>
              
              <Link href="/playground" className="block w-full py-3 text-center text-sm font-medium text-gray-900 border border-gray-200 hover:border-gray-900 transition-colors">
                {locale === 'fr' ? 'Tester gratuitement' : 'Try for free'}
              </Link>
            </div>

            {/* Pro - Featured */}
            <div className="relative bg-gray-900 text-white p-8 lg:-mt-4 lg:-mb-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-[10px] font-mono uppercase tracking-widest px-3 py-1">
                {locale === 'fr' ? 'Populaire' : 'Popular'}
              </div>
              
              <div className="text-xs font-mono uppercase tracking-widest text-blue-400 mb-4">Pro</div>
              <div className="text-4xl font-light text-white mb-2">{locale === 'fr' ? '19€' : '$19'}<span className="text-lg text-gray-500">/{locale === 'fr' ? 'mois' : 'mo'}</span></div>
              <p className="text-sm text-gray-400 mb-8">{locale === 'fr' ? 'Pour ceux qui publient chaque semaine' : 'For those who publish weekly'}</p>
              
              <div className="text-xs font-mono text-gray-500 mb-6">{locale === 'fr' ? '50 crédits/mois' : '50 credits/mo'}</div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="text-blue-400">✓</span>
                  {locale === 'fr' ? '50 générations/mois' : '50 generations/mo'}
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="text-blue-400">✓</span>
                  {locale === 'fr' ? "Galerie d'inspirations complète" : 'Full inspiration gallery'}
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="text-blue-400">✓</span>
                  {locale === 'fr' ? 'Tous les ratios et formats' : 'All ratios and formats'}
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="text-blue-400">✓</span>
                  {locale === 'fr' ? 'Historique illimité' : 'Unlimited history'}
                </li>
              </ul>
              
              <button className="w-full py-3 text-center text-sm font-medium bg-white text-gray-900 hover:bg-gray-100 transition-colors">
                {locale === 'fr' ? 'Essai gratuit 7 jours' : '7-day free trial'}
              </button>
            </div>

            {/* Business */}
            <div className="bg-white border border-gray-200 p-8">
              <div className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">Business</div>
              <div className="text-4xl font-light text-gray-900 mb-2">{locale === 'fr' ? '49€' : '$49'}<span className="text-lg text-gray-400">/{locale === 'fr' ? 'mois' : 'mo'}</span></div>
              <p className="text-sm text-gray-500 mb-8">{locale === 'fr' ? 'Pour les équipes qui produisent' : 'For teams that produce'}</p>
              
              <div className="text-xs font-mono text-gray-400 mb-6">{locale === 'fr' ? '150 crédits/mois' : '150 credits/mo'}</div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-blue-500">✓</span>
                  {locale === 'fr' ? '150 générations/mois' : '150 generations/mo'}
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-blue-500">✓</span>
                  {locale === 'fr' ? 'Tout du plan Pro' : 'Everything in Pro'}
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-blue-500">✓</span>
                  {locale === 'fr' ? "3 membres d'équipe" : '3 team members'}
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-blue-500">✓</span>
                  {locale === 'fr' ? 'Support prioritaire' : 'Priority support'}
                </li>
              </ul>
              
              <button className="block w-full py-3 text-center text-sm font-medium text-gray-900 border border-gray-200 hover:border-gray-900 transition-colors">
                {locale === 'fr' ? 'Contacter les ventes' : 'Contact sales'}
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
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">{locale === 'fr' ? 'FAQ' : 'FAQ'}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 leading-tight">
              {locale === 'fr' ? (
                <>Questions<br /><span className="font-semibold">fréquentes</span></>
              ) : (
                <>Frequently<br /><span className="font-semibold">asked questions</span></>
              )}
            </h2>
          </div>

          <div className="space-y-4">
            <details className="group border border-gray-200 bg-white">
              <summary className="flex justify-between items-center p-6 cursor-pointer select-none">
                <span className="font-medium text-gray-900">{locale === 'fr' ? 'Comment ça marche sans agence ?' : 'How does it work without an agency?'}</span>
                <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                {locale === 'fr' 
                  ? "Palette fait le travail d'un directeur artistique. Entrez votre site, on récupère votre charte, et vous générez des visuels pro qui respectent votre identité."
                  : "Palette does the work of an art director. Enter your site, we extract your brand guidelines, and you generate pro visuals that respect your identity."
                }
              </div>
            </details>

            <details className="group border border-gray-200 bg-white">
              <summary className="flex justify-between items-center p-6 cursor-pointer select-none">
                <span className="font-medium text-gray-900">{locale === 'fr' ? 'Quels formats sont supportés ?' : 'Which formats are supported?'}</span>
                <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                {locale === 'fr' 
                  ? "Instagram (Stories, Posts), LinkedIn, Facebook, Twitter/X, Pinterest. Chaque export est optimisé pour la plateforme."
                  : "Instagram (Stories, Posts), LinkedIn, Facebook, Twitter/X, Pinterest. Each export is optimized for the platform."
                }
              </div>
            </details>

            <details className="group border border-gray-200 bg-white">
              <summary className="flex justify-between items-center p-6 cursor-pointer select-none">
                <span className="font-medium text-gray-900">{locale === 'fr' ? 'Les visuels sont-ils libres de droits ?' : 'Are the visuals royalty-free?'}</span>
                <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                {locale === 'fr' 
                  ? "Oui, absolument. Vous détenez 100% des droits commerciaux sur toutes les images générées."
                  : "Yes, absolutely. You own 100% commercial rights to all generated images."
                }
              </div>
            </details>

            <details className="group border border-gray-200 bg-white">
              <summary className="flex justify-between items-center p-6 cursor-pointer select-none">
                <span className="font-medium text-gray-900">{locale === 'fr' ? 'Et si je ne suis pas satisfait ?' : "What if I'm not satisfied?"}</span>
                <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                {locale === 'fr' 
                  ? "Régénérez autant de fois que vous voulez. Modifiez un détail en un clic. Et si vraiment ça ne va pas, on rembourse sans poser de questions."
                  : "Regenerate as many times as you want. Modify a detail in one click. And if it really doesn't work, we refund no questions asked."
                }
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
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-4">{locale === 'fr' ? 'Produit' : 'Product'}</div>
              <div className="space-y-2 text-sm text-gray-500">
                <a href="#fonctionnement" className="block hover:text-gray-900 transition-colors">Comment ça marche</a>
                <a href="#tarifs" className="block hover:text-gray-900 transition-colors">Tarifs</a>
                <a href="/playground" className="block hover:text-gray-900 transition-colors">Playground</a>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-4">{locale === 'fr' ? 'Ressources' : 'Resources'}</div>
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
