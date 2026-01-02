import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import CtaSection from '@/components/CtaSection';
import Link from 'next/link';
import { headers } from 'next/headers';
import { getServerLocale } from '@/lib/i18n-server';
import { translations } from '@/lib/i18n/translations';
import Gallery from '@/components/Gallery';
import I18nComparison from '@/components/I18nComparison';
import AutopilotSection from '@/components/AutopilotSection';
import RotatingHeadline from '@/components/RotatingHeadline';

// JSON-LD Structured Data for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://thepalette.app/#organization',
      name: 'Palette',
      url: 'https://thepalette.app',
      logo: {
        '@type': 'ImageObject',
        url: 'https://thepalette.app/logo.webp',
      },
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://thepalette.app/#website',
      url: 'https://thepalette.app',
      name: 'Palette',
      publisher: {
        '@id': 'https://thepalette.app/#organization',
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Palette',
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Web',
      description: 'AI-powered brand visual generator. Create professional, on-brand visuals in 60 seconds.',
      offers: {
        '@type': 'Offer',
        price: '19',
        priceCurrency: 'EUR',
        priceValidUntil: '2025-12-31',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '50',
      },
    },
  ],
};

export default async function Home() {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || 'fr';
  const locale = getServerLocale(acceptLanguage);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-gray-900">
      <Navigation />
      <Hero />

      {/* How it Works - First section: accessible & simple */}
      <section id="fonctionnement" className="py-24 md:py-32 bg-white relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-gray-900 rounded-full" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">{locale === 'fr' ? 'Comment ça marche' : 'How it works'}</span>
            </div>
            <RotatingHeadline />
            <p className="text-gray-500 leading-relaxed text-lg">
              {locale === 'fr'
                ? 'Pas de formation. Pas de tutoriel de 45 minutes.'
                : 'No training. No 45-minute tutorial.'
              }
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 md:gap-12">
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

            <div className="relative">
              <div className="text-8xl font-light text-blue-100 absolute -top-4 -left-2">2</div>
              <div className="relative z-10 pt-12">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">{locale === 'fr' ? 'Choisissez une idée' : 'Pick an idea'}</h3>
                <p className="text-gray-500 leading-relaxed">
                  {locale === 'fr'
                    ? "Palette vous propose des idées de contenu basées sur les tendances de votre marché. Choisissez-en une ou décrivez la vôtre, et c'est parti."
                    : 'Palette suggests content ideas based on your market trends. Pick one or describe your own, and off you go.'
                  }
                </p>
              </div>
            </div>

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
                    ? 'Visuels générés en 60 secondes. Un detail à changer ? Un clic. Pas satisfait ? Régénérez. Gratuit.'
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
        <div className="absolute top-20 right-20 w-64 h-64 bg-red-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-200/15 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-amber-400 rounded-full" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">{locale === 'fr' ? 'Exemples' : 'Examples'}</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 leading-tight mb-6">
              {locale === 'fr' ? (
                <>Ce que nos utilisateurs<br /><span className="font-semibold">créent avec Palette</span></>
              ) : (
                <>What our users<br /><span className="font-semibold">create with Palette</span></>
              )}
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              {locale === 'fr' ? 'De vrais visuels, générés en quelques clics.' : 'Real visuals, generated in a few clicks.'}
            </p>
          </div>

          <Gallery />

          <div className="text-center mt-12">
            <Link href="/playground" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group">
              {locale === 'fr' ? 'Créer votre premier visuel' : 'Create your first visual'}
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Autopilot Section */}
      <AutopilotSection />

      {/* International Section */}
      <section className="py-24 md:py-32 bg-white relative overflow-hidden border-t border-gray-50">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">
                  {locale === 'fr' ? 'International' : 'International'}
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 leading-tight mb-6">
                {locale === 'fr' ? (
                  <>Une marque,<br /><span className="font-semibold text-gray-900">toutes les langues.</span></>
                ) : (
                  <>One brand,<br /><span className="font-semibold text-gray-900">all languages.</span></>
                )}
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                {locale === 'fr'
                  ? "Traduction parfaite de vos contenus en 20 secondes. Palette adapte vos visuels pour tous vos marchés internationaux en gardant une cohérence absolue."
                  : "Perfect content translation in 20 seconds. Palette adapts your visuals for all international markets while maintaining absolute brand consistency."
                }
              </p>
            </div>

            <I18nComparison locale={locale} />
          </div>
        </div>
      </section>

      {/* Problem Section - For users who've tried agencies */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">{locale === 'fr' ? 'Vous avez déjà essayé' : 'You\'ve tried before'}</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 leading-tight mb-6">
              {locale === 'fr' ? (
                <>Les agences, Canva...<br /><span className="font-semibold">On connaît la suite.</span></>
              ) : (
                <>Agencies, Canva...<br /><span className="font-semibold">We know how it goes.</span></>
              )}
            </h2>
            <p className="text-gray-500 leading-relaxed text-lg">
              {locale === 'fr'
                ? <>Briefs interminables, devis à rallonge, ou templates que tout le monde reconnaît. Palette change la donne.</>
                : <>Endless briefs, overpriced quotes, or templates everyone recognizes. Palette changes the game.</>
              }
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
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

            <div className="relative">
              <div className="absolute -bottom-3 -right-3 w-6 h-6 border-r-2 border-b-2 border-blue-400" />
              <div className="bg-gradient-to-br from-blue-50 via-white to-amber-50 border border-blue-100 p-8 md:p-10 h-full relative overflow-hidden">
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

      {/* Objection Handling */}
      <section className="py-24 md:py-32 bg-white border-t border-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 leading-tight">
              <span className="font-semibold">{locale === 'fr' ? '"Oui mais..."' : '"But wait..."'}</span>
            </h2>
          </div>

          <div className="space-y-8">
            <div className="border border-gray-200 p-6 md:p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                {locale === 'fr' ? '"Ça fait des trucs moches, non ?"' : '"Does it make ugly stuff?"'}
              </h3>
              <p className="text-gray-500 leading-relaxed">
                {locale === 'fr'
                  ? <>Palette ne génère pas d'images génériques. Elle apprend <span className="text-gray-900 font-medium">votre marque</span>. Vos couleurs. Votre style. C'est pour ça que le résultat ressemble à vous, pas à une banque d'images.</>
                  : <>Palette doesn't generate generic images. It learns <span className="text-gray-900 font-medium">your brand</span>. Your colors. Your style. That's why the result looks like you, not a stock photo.</>
                }
              </p>
            </div>

            <div className="border border-gray-200 p-6 md:p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                {locale === 'fr' ? '"J\'ai déjà Canva"' : '"I already have Canva"'}
              </h3>
              <p className="text-gray-500 leading-relaxed">
                {locale === 'fr'
                  ? <>Canva vous donne des templates. Palette vous donne <span className="text-gray-900 font-medium">vos visuels</span>. La différence ? Personne ne reconnaît que c'est généré.</>
                  : <>Canva gives you templates. Palette gives you <span className="text-gray-900 font-medium">your visuals</span>. The difference? No one can tell it's generated.</>
                }
              </p>
            </div>

            <div className="border border-gray-200 p-6 md:p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                {locale === 'fr' ? '"Mon agence connaît ma marque"' : '"My agency knows my brand"'}
              </h3>
              <p className="text-gray-500 leading-relaxed">
                {locale === 'fr'
                  ? <>Après 6 mois et 15 000€ de factures, peut-être. Palette comprend votre marque <span className="text-gray-900 font-medium">en 60 secondes</span>. Et elle n'oublie jamais.</>
                  : <>After 6 months and $15,000 in invoices, maybe. Palette understands your brand <span className="text-gray-900 font-medium">in 60 seconds</span>. And it never forgets.</>
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="tarifs" className="py-24 md:py-32 relative border-t border-gray-50">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <div className="max-w-5xl mx-auto px-6 relative z-10">
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
                ? 'Pas de devis. Pas de "ça dépend du scope". Tous les visuels en haute résolution.'
                : 'No quotes. No "it depends on scope". All visuals in high resolution.'
              }
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 items-start mt-12">
            <div className="bg-white border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-mono uppercase tracking-widest text-gray-400">{locale === 'fr' ? 'Starter' : 'Starter'}</div>
              </div>
              <div className="text-4xl font-light text-gray-900 mb-2">{locale === 'fr' ? 'Gratuit' : 'Free'}</div>
              <p className="text-sm text-gray-500 mb-8">{locale === 'fr' ? 'Pour voir si ça marche vraiment' : 'To see if it really works'}</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-blue-500">✓</span>
                  {locale === 'fr' ? '1 visuel offert à l\'inscription' : '1 free visual on signup'}
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
                  {locale === 'fr' ? "Visuel quotidien automatique" : "Daily automatic visual"}
                </li>
              </ul>
              <Link href="/playground" className="block w-full py-3 text-center text-sm font-medium text-gray-900 border border-gray-200 hover:border-gray-900 transition-colors">
                {locale === 'fr' ? 'Créer mon premier visuel' : 'Create my first visual'}
              </Link>
            </div>

            <div className="relative bg-gray-900 text-white p-8 lg:-mt-4 lg:-mb-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-[10px] font-mono uppercase tracking-widest px-3 py-1">
                {locale === 'fr' ? 'Populaire' : 'Popular'}
              </div>
              <div className="text-xs font-mono uppercase tracking-widest text-blue-400 mb-4">Pro</div>
              <div className="text-4xl font-light text-white mb-2">{locale === 'fr' ? '19€' : '$19'}<span className="text-lg text-gray-500">/{locale === 'fr' ? 'mois' : 'mo'}</span></div>
              <p className="text-sm text-gray-400 mb-8">{locale === 'fr' ? 'Pour ceux qui publient chaque semaine' : 'For those who publish weekly'}</p>
              <div className="text-xs font-mono text-gray-500 mb-6">{locale === 'fr' ? '50 crédits/mois' : '50 credits/mo'}</div>
              {/* Autopilot highlight */}
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-lg p-3 mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-amber-400">★</span>
                  <span className="text-white font-semibold text-sm">{locale === 'fr' ? 'Mode Autopilote inclus' : 'Autopilot Mode included'}</span>
                </div>
                <p className="text-xs text-gray-400 pl-5">
                  {locale === 'fr' ? '1 visuel frais chaque matin, basé sur les tendances de votre marché' : '1 fresh visual every morning, based on your market trends'}
                </p>
              </div>
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
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="text-blue-400">✓</span>
                  {locale === 'fr' ? 'Génération 4K' : '4K Generation'}
                </li>
              </ul>
              <button className="w-full py-3 text-center text-sm font-medium bg-white text-gray-900 hover:bg-gray-100 transition-colors">
                {locale === 'fr' ? 'Essai gratuit 7 jours' : '7-day free trial'}
              </button>
            </div>

            <div className="relative bg-white border border-gray-200 p-8">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-mono uppercase tracking-widest px-3 py-1">
                {translations.landing.pricing.plans.business.badge[locale]}
              </div>
              <div className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">Premium</div>
              <div className="text-4xl font-light text-gray-900 mb-2">{locale === 'fr' ? '49€' : '$49'}<span className="text-lg text-gray-400">/{locale === 'fr' ? 'mois' : 'mo'}</span></div>
              <p className="text-sm text-gray-500 mb-8">{locale === 'fr' ? 'Pour les équipes qui produisent' : 'For teams that produce'}</p>
              <div className="text-xs font-mono text-gray-400 mb-6">{locale === 'fr' ? '150 crédits/mois' : '150 credits/mo'}</div>
              {/* Autopilot highlight */}
              <div className="bg-gradient-to-r from-amber-100 to-orange-50 border border-amber-200 rounded-lg p-3 mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-amber-500">★</span>
                  <span className="text-gray-900 font-semibold text-sm">{locale === 'fr' ? 'Mode Autopilote inclus' : 'Autopilot Mode included'}</span>
                </div>
                <p className="text-xs text-gray-500 pl-5">
                  {locale === 'fr' ? '1 visuel frais chaque matin, basé sur les tendances de votre marché' : '1 fresh visual every morning, based on your market trends'}
                </p>
              </div>
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
                  {locale === 'fr' ? 'Support prioritaire' : 'Priority support'}
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-blue-500">✓</span>
                  {locale === 'fr' ? 'Génération 4K' : '4K Generation'}
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
      <section id="faq" className="py-24 md:py-32 bg-white border-t border-gray-50">
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
          <div className="grid grid-cols-2 gap-8 md:grid-cols-6 md:gap-8 mb-12">
            <div className="col-span-2 md:col-span-2">
              <div className="mb-4">
                <img src="/logo.webp" alt="Palette" className="h-8 object-contain" width="66" height="32" />
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                {translations.landing.footer.tagline[locale]}
              </p>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-4">{translations.landing.footer.product[locale]}</div>
              <div className="space-y-2 text-sm text-gray-500">
                <a href="#fonctionnement" className="block hover:text-gray-900 transition-colors">{translations.landing.footer.links.howItWorks[locale]}</a>
                <a href="#tarifs" className="block hover:text-gray-900 transition-colors">{translations.landing.footer.links.pricing[locale]}</a>
                <a href="/playground" className="block hover:text-gray-900 transition-colors">{translations.landing.footer.links.playground[locale]}</a>
                <a href="#faq" className="block hover:text-gray-900 transition-colors">{translations.landing.footer.links.faq[locale]}</a>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-4">{translations.landing.footer.alternatives[locale]}</div>
              <div className="space-y-2 text-sm text-gray-500">
                <Link href="/vs/canva" className="block hover:text-gray-900 transition-colors">{translations.landing.footer.links.vsCanva[locale]}</Link>
                <Link href="/vs/agence" className="block hover:text-gray-900 transition-colors">{translations.landing.footer.links.vsAgency[locale]}</Link>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-4">{translations.landing.footer.forYou[locale]}</div>
              <div className="space-y-2 text-sm text-gray-500">
                <Link href="/pour/solopreneurs" className="block hover:text-gray-900 transition-colors">{translations.landing.footer.links.forSolopreneurs[locale]}</Link>
                <Link href="/pour/marketers" className="block hover:text-gray-900 transition-colors">{translations.landing.footer.links.forMarketers[locale]}</Link>
                <Link href="/pour/founders" className="block hover:text-gray-900 transition-colors">{translations.landing.footer.links.forFounders[locale]}</Link>
                <Link href="/pour/equipes-produit" className="block hover:text-gray-900 transition-colors">{translations.landing.footer.links.forProductTeams[locale]}</Link>
                <Link href="/pour/community-managers" className="block hover:text-gray-900 transition-colors">{translations.landing.footer.links.forCMs[locale]}</Link>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-4">{translations.landing.footer.legal[locale]}</div>
              <div className="space-y-2 text-sm text-gray-500">
                <a href="#" className="block hover:text-gray-900 transition-colors">{translations.landing.footer.links.terms[locale]}</a>
                <a href="#" className="block hover:text-gray-900 transition-colors">{translations.landing.footer.links.privacy[locale]}</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-xs text-gray-400">© 2025 Palette. {translations.landing.footer.copyright[locale]}</span>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                {translations.landing.footer.systemsOperational[locale]}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
