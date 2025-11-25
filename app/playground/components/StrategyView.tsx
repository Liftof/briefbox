import React from 'react';
import { TemplateId } from '@/lib/templates';

// Template definitions for UI display
const TEMPLATES = [
  { id: 'stat' as TemplateId, icon: '📊', name: 'Stat' },
  { id: 'announcement' as TemplateId, icon: '📢', name: 'Annonce' },
  { id: 'quote' as TemplateId, icon: '💬', name: 'Citation' },
  { id: 'event' as TemplateId, icon: '🎤', name: 'Event' },
  { id: 'expert' as TemplateId, icon: '👤', name: 'Expert' },
  { id: 'product' as TemplateId, icon: '✨', name: 'Produit' },
];

interface StrategyViewProps {
  brandData: any;
  onUseIdea: (templateId: TemplateId, brief: string) => void;
}

export default function StrategyView({ brandData, onUseIdea }: StrategyViewProps) {
  // Helper to get template icon
  const getTemplateIcon = (id: string) => TEMPLATES.find(t => t.id === id)?.icon || '📄';

  // Count available ideas
  const statsCount = brandData?.contentNuggets?.realStats?.length || 0;
  const testimonialsCount = brandData?.contentNuggets?.testimonials?.length || 0;
  const insightsCount = brandData?.industryInsights?.length || 0;
  const featuresCount = (brandData?.features?.length || 0) + (brandData?.values?.length || 0);
  const totalIdeas = statsCount + testimonialsCount + insightsCount + featuresCount;
  // Even if no real data, show generic ideas so the view is never empty
  const showGenerics = totalIdeas === 0;

  if (!brandData) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-6">
        <div className="text-center py-20 bg-white border border-gray-200 border-dashed">
          <div className="w-16 h-16 bg-gray-50 mx-auto mb-4 flex items-center justify-center text-3xl">
            💡
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune donnée de marque</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Veuillez d'abord analyser une marque pour voir les idées.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stratégie de Contenu</h1>
          <p className="text-gray-500">
            {totalIdeas > 0 
              ? `${totalIdeas} angles d'attaque détectés pour ${brandData.name}`
              : `Pistes de contenu suggérées pour ${brandData.name}`}
          </p>
        </div>
        {totalIdeas > 0 && (
          <div className="flex flex-wrap gap-2">
            <div className="px-4 py-2 bg-white border border-emerald-100 text-emerald-700 text-sm font-medium rounded-lg shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"/>
              {statsCount + testimonialsCount} Preuves
            </div>
            <div className="px-4 py-2 bg-white border border-amber-100 text-amber-700 text-sm font-medium rounded-lg shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full"/>
              {insightsCount} Insights
            </div>
            <div className="px-4 py-2 bg-white border border-purple-100 text-purple-700 text-sm font-medium rounded-lg shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"/>
              {featuresCount} Atouts
            </div>
          </div>
        )}
      </div>

      {/* Masonry-like Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* COL 1: PROOF & TRUST (Stats, Testimonials) */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-100">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-lg">📊</div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Preuve & Confiance</h3>
          </div>

          {showGenerics && (
            <div className="group relative bg-white p-6 rounded-xl border border-gray-200 border-dashed hover:border-solid hover:border-emerald-400 transition-all cursor-pointer hover:shadow-md"
              onClick={() => onUseIdea('quote', `"Le service de ${brandData.name} est exceptionnel..."`)}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-3xl">💬</span>
                <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-medium">Générique</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Idée : Témoignage client</h4>
              <p className="text-sm text-gray-500 leading-relaxed">Partagez un retour d'expérience positif pour rassurer vos prospects et créer de la confiance.</p>
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                <span className="text-xs font-medium text-emerald-600 group-hover:underline">Créer ce post →</span>
              </div>
            </div>
          )}

          {brandData.contentNuggets?.realStats?.map((stat: string, i: number) => (
            <div key={`stat-${i}`} className="group relative bg-white p-7 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all hover:-translate-y-1 cursor-pointer"
              onClick={() => onUseIdea('stat', stat)}>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-full font-medium">
                Utiliser
              </div>
              <div className="text-emerald-600 font-bold text-xs uppercase tracking-widest mb-3">Chiffre Clé</div>
              <h4 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                {stat}
              </h4>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">
                  {getTemplateIcon('stat')} Statistique
                </span>
                <span className="text-[10px] text-gray-400">Source: Site Web</span>
              </div>
            </div>
          ))}

          {brandData.contentNuggets?.testimonials?.map((t: any, i: number) => (
            <div key={`testi-${i}`} className="group relative bg-gradient-to-br from-white to-emerald-50/30 p-7 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all hover:-translate-y-1 cursor-pointer"
              onClick={() => onUseIdea('quote', `"${t.quote}" — ${t.author}`)}>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-full font-medium">
                Utiliser
              </div>
              <div className="text-emerald-600 text-4xl font-serif leading-none mb-2 opacity-30">"</div>
              <blockquote className="text-lg text-gray-800 font-medium mb-6 leading-relaxed relative z-10">
                {t.quote}
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white border border-emerald-100 rounded-full flex items-center justify-center text-sm font-bold text-emerald-700 shadow-sm">
                  {t.author?.[0] || '?'}
                </div>
                <div>
                  <div className="font-bold text-sm text-gray-900">{t.author || 'Client'}</div>
                  <div className="text-xs text-gray-500">{t.role || 'Témoignage vérifié'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* COL 2: EXPERTISE & INDUSTRY (Insights) */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-100">
            <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-lg">💡</div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Expertise & Marché</h3>
          </div>

          {showGenerics && (
            <div className="group relative bg-white p-6 rounded-xl border border-gray-200 border-dashed hover:border-solid hover:border-amber-400 transition-all cursor-pointer hover:shadow-md"
              onClick={() => onUseIdea('expert', `3 conseils pour mieux gérer votre...`)}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-3xl">🎓</span>
                <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-medium">Générique</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Idée : Conseil d'expert</h4>
              <p className="text-sm text-gray-500 leading-relaxed">Partagez votre expertise pour éduquer votre audience et vous positionner en leader.</p>
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                <span className="text-xs font-medium text-amber-600 group-hover:underline">Créer ce post →</span>
              </div>
            </div>
          )}

          {brandData.industryInsights?.map((insight: any, i: number) => (
            <div key={`insight-${i}`} className="group relative bg-white p-7 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-amber-200 transition-all hover:-translate-y-1 cursor-pointer"
              onClick={() => onUseIdea('expert', insight.didYouKnow || insight.fact)}>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-full font-medium">
                Utiliser
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">Le saviez-vous ?</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3 leading-snug">
                {insight.didYouKnow || insight.fact}
              </h4>
              {insight.source && (
                <div className="flex items-center gap-1 text-[10px] text-gray-400 italic mt-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  Source: {insight.source}
                </div>
              )}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">
                  {getTemplateIcon('expert')} Expertise
                </span>
              </div>
            </div>
          ))}

          {brandData.contentNuggets?.blogTopics?.slice(0, 3).map((topic: string, i: number) => (
            <div key={`topic-${i}`} className="group relative bg-gray-50 p-5 rounded-xl border border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => onUseIdea('expert', topic)}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white rounded border border-gray-200 flex items-center justify-center text-lg shadow-sm flex-shrink-0">📰</div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1 leading-snug">{topic}</h4>
                  <p className="text-xs text-gray-500">Sujet issu de votre blog</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* COL 3: BRAND & PRODUCT (Features, Values) */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-100">
            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-lg">✨</div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Marque & Produit</h3>
          </div>

          {showGenerics && (
            <div className="group relative bg-white p-6 rounded-xl border border-gray-200 border-dashed hover:border-solid hover:border-purple-400 transition-all cursor-pointer hover:shadow-md"
              onClick={() => onUseIdea('product', `Découvrez notre solution pour...`)}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-3xl">📦</span>
                <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-medium">Générique</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Idée : Présentation produit</h4>
              <p className="text-sm text-gray-500 leading-relaxed">Mettez en avant votre produit phare ou une fonctionnalité clé.</p>
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                <span className="text-xs font-medium text-purple-600 group-hover:underline">Créer ce post →</span>
              </div>
            </div>
          )}

          {brandData.features?.map((f: string, i: number) => (
            <div key={`feat-${i}`} className="group relative bg-white p-7 rounded-xl border border-purple-100 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all hover:-translate-y-1 cursor-pointer"
              onClick={() => onUseIdea('product', `Découvrez ${f}`)}>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-full font-medium">
                Utiliser
              </div>
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                ✨
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                {f}
              </h4>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                Mettez en avant cet atout compétitif clé.
              </p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">
                  {getTemplateIcon('product')} Produit
                </span>
              </div>
            </div>
          ))}

          {brandData.values?.map((v: string, i: number) => (
            <div key={`val-${i}`} className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => onUseIdea('announcement', `Nos valeurs : ${v}`)}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-white/50 px-2 py-1 rounded">Valeur</span>
                <span className="text-xl group-hover:rotate-12 transition-transform duration-300">💎</span>
              </div>
              <h4 className="text-xl font-bold text-blue-900 leading-tight">
                {v}
              </h4>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}