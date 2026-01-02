'use client';

import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';
import type { ComparisonData } from '@/lib/seo/comparisons';

interface ComparisonPageProps {
  data: ComparisonData;
}

export default function ComparisonPage({ data }: ComparisonPageProps) {
  const { locale } = useTranslation();
  const l = locale === 'en' ? 'en' : 'fr';

  const hero = data.hero[l];
  const painPoints = data.painPoints[l];
  const comparison = data.comparison[l];
  const cta = data.cta[l];
  const faq = data.faq[l];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <div className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <span className="font-semibold text-gray-900">Palette</span>
          </Link>
          <Link
            href="/playground"
            className="bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            {l === 'fr' ? 'Essayer gratuitement' : 'Try for free'}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full mb-8">
            <span className="text-sm text-gray-600">VS</span>
            <span className="font-medium text-gray-900">{data.competitor}</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {hero.headline}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {hero.subheadline}
          </p>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            {painPoints.title}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {painPoints.items.map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            {l === 'fr' ? 'Comparaison détaillée' : 'Detailed comparison'}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-medium text-gray-500">
                    {l === 'fr' ? 'Fonctionnalité' : 'Feature'}
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      </div>
                      <span className="font-semibold text-gray-900">{comparison.paletteTitle}</span>
                    </div>
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-500">
                    {comparison.competitorTitle}
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-700">{row.feature}</td>
                    <td className={`py-4 px-4 text-center font-medium ${row.paletteWins ? 'text-green-600 bg-green-50' : 'text-gray-600'}`}>
                      {row.paletteWins && <span className="mr-1">+</span>}
                      {row.palette}
                    </td>
                    <td className={`py-4 px-4 text-center ${!row.paletteWins ? 'text-green-600 bg-green-50 font-medium' : 'text-gray-500'}`}>
                      {!row.paletteWins && <span className="mr-1">+</span>}
                      {row.competitor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 px-6 bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center">
            {l === 'fr' ? 'Pourquoi choisir Palette ?' : 'Why choose Palette?'}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">60s</span>
              </div>
              <h3 className="font-semibold mb-2">{l === 'fr' ? 'Ultra rapide' : 'Ultra fast'}</h3>
              <p className="text-gray-400 text-sm">
                {l === 'fr'
                  ? 'Décrivez ce que vous voulez, obtenez un visuel en 60 secondes.'
                  : 'Describe what you want, get a visual in 60 seconds.'}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">24/7</span>
              </div>
              <h3 className="font-semibold mb-2">{l === 'fr' ? 'Mode Autopilot' : 'Autopilot mode'}</h3>
              <p className="text-gray-400 text-sm">
                {l === 'fr'
                  ? '50 bots scannent votre marché. Un visuel prêt chaque matin.'
                  : '50 bots scan your market. A visual ready every morning.'}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">100%</span>
              </div>
              <h3 className="font-semibold mb-2">{l === 'fr' ? 'Votre marque' : 'Your brand'}</h3>
              <p className="text-gray-400 text-sm">
                {l === 'fr'
                  ? 'Chaque visuel respecte vos couleurs, typos et ton de marque.'
                  : 'Every visual respects your colors, fonts, and brand tone.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            {l === 'fr' ? 'Questions fréquentes' : 'Frequently asked questions'}
          </h2>
          <div className="space-y-6">
            {faq.map((item, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.question}</h3>
                <p className="text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {cta.headline}
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            {cta.subheadline}
          </p>
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 font-semibold hover:bg-gray-100 transition-colors"
          >
            {cta.button}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <div className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <span className="font-semibold text-gray-900">Palette</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900">
              {l === 'fr' ? 'Accueil' : 'Home'}
            </Link>
            <Link href="/playground" className="hover:text-gray-900">
              {l === 'fr' ? 'Essayer' : 'Try'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
