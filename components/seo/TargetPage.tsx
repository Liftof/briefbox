'use client';

import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';
import type { TargetData } from '@/lib/seo/targets';

interface TargetPageProps {
  data: TargetData;
}

export default function TargetPage({ data }: TargetPageProps) {
  const { locale } = useTranslation();
  const l = locale === 'en' ? 'en' : 'fr';

  const hero = data.hero[l];
  const problems = data.problems[l];
  const solution = data.solution[l];
  const testimonial = data.testimonial[l];
  const cta = data.cta[l];
  const faq = data.faq[l];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Palette" className="h-8 object-contain" />
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
          <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-8">
            <span className="text-sm font-medium text-blue-600">
              {l === 'fr' ? 'Pour' : 'For'} {data.persona}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {hero.headline}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            {hero.subheadline}
          </p>
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 font-semibold hover:bg-gray-800 transition-colors"
          >
            {cta.button}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            {problems.title}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {problems.items.map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            {solution.title}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {solution.items.map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16 px-6 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <svg className="w-12 h-12 text-gray-700 mx-auto mb-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <blockquote className="text-2xl md:text-3xl font-medium text-white mb-8 leading-relaxed">
            &ldquo;{testimonial.quote}&rdquo;
          </blockquote>
          <div className="text-gray-400">
            <p className="font-semibold text-white">{testimonial.author}</p>
            <p className="text-sm">{testimonial.role}</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            {l === 'fr' ? 'Ce qui rend Palette unique' : 'What makes Palette unique'}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">60s</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {l === 'fr' ? 'Ultra rapide' : 'Ultra fast'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {l === 'fr'
                    ? 'Décrivez ce que vous voulez, obtenez un visuel en 60 secondes.'
                    : 'Describe what you want, get a visual in 60 seconds.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">24/7</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {l === 'fr' ? 'Mode Autopilote' : 'Autopilot mode'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {l === 'fr'
                    ? '50 bots scannent votre marché. Un visuel prêt chaque matin.'
                    : '50 bots scan your market. A visual ready every morning.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">100%</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {l === 'fr' ? 'Votre marque' : 'Your brand'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {l === 'fr'
                    ? 'Chaque visuel respecte vos couleurs, typos et ton de marque.'
                    : 'Every visual respects your colors, fonts, and brand tone.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">4K</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {l === 'fr' ? 'Haute résolution' : 'High resolution'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {l === 'fr'
                    ? 'Export 4K pour tous vos supports. Print, digital, social media.'
                    : 'Export 4K for all your needs. Print, digital, social media.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            {l === 'fr' ? 'Questions fréquentes' : 'Frequently asked questions'}
          </h2>
          <div className="space-y-6">
            {faq.map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.question}</h3>
                <p className="text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Examples Gallery */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
            {l === 'fr' ? 'Créés avec Palette' : 'Created with Palette'}
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            {l === 'fr'
              ? 'Des visuels uniques, générés en 60 secondes, 100% fidèles à chaque marque.'
              : 'Unique visuals, generated in 60 seconds, 100% true to each brand.'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[10, 2, 15, 3, 11, 4, 12, 16].map((id) => (
              <div key={id} className="aspect-[4/5] rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <img
                  src={`/gallery/gal-${id}.png`}
                  alt={`Visual ${id}`}
                  className="w-full h-full object-cover"
                />
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
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Palette" className="h-6 object-contain" />
          </Link>
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
