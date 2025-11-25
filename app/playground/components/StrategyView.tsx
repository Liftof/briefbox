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
  const getTemplateName = (id: string) => TEMPLATES.find(t => t.id === id)?.name || 'Post';

  // Count available ideas
  const statsCount = brandData?.contentNuggets?.realStats?.length || 0;
  const testimonialsCount = brandData?.contentNuggets?.testimonials?.length || 0;
  const insightsCount = brandData?.industryInsights?.length || 0;
  const featuresCount = (brandData?.features?.length || 0) + (brandData?.values?.length || 0);
  const totalIdeas = statsCount + testimonialsCount + insightsCount + featuresCount;

  if (!brandData || totalIdeas === 0) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-6">
        <div className="text-center py-20 bg-white border border-gray-200 border-dashed">
          <div className="w-16 h-16 bg-gray-50 mx-auto mb-4 flex items-center justify-center text-3xl">
            💡
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune idée détectée pour le moment</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Nous n'avons pas encore trouvé de données exploitables sur votre marque. 
            Essayez de compléter votre identité ou de relancer l'analyse.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Stratégie de Contenu</h1>
          <p className="text-sm text-gray-500">
            {totalIdeas} opportunités de communication détectées pour {brandData.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
            {statsCount + testimonialsCount} Données réelles
          </span>
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            {insightsCount} Insights marché
          </span>
        </div>
      </div>

      {/* Masonry-like Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* COL 1: PROOF & TRUST (Stats, Testimonials) */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Preuve & Confiance</h3>
          </div>

          {brandData.contentNuggets?.realStats?.map((stat: string, i: number) => (
            <div key={`stat-${i}`} className="group relative bg-white p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer"
              onClick={() => onUseIdea('stat', stat)}>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-gray-900 text-white text-[10px] px-2 py-1 font-medium">Créer</span>
              </div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-4">
                📊
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2 line-clamp-3">
                {stat}
              </h4>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Format suggéré</span>
                <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  {getTemplateIcon('stat')} Chiffre clé
                </span>
              </div>
            </div>
          ))}

          {brandData.contentNuggets?.testimonials?.map((t: any, i: number) => (
            <div key={`testi-${i}`} className="group relative bg-white p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer"
              onClick={() => onUseIdea('quote', `"${t.quote}" — ${t.author}`)}>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-gray-900 text-white text-[10px] px-2 py-1 font-medium">Créer</span>
              </div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-4">
                💬
              </div>
              <blockquote className="text-base italic text-gray-600 mb-4 relative">
                "{t.quote}"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                  {t.author?.[0] || '?'}
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-gray-900">{t.author || 'Client'}</div>
                  <div className="text-gray-400">{t.role || 'Témoignage vérifié'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* COL 2: EXPERTISE & INDUSTRY (Insights) */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-amber-500 rounded-full" />
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Expertise & Marché</h3>
          </div>

          {brandData.industryInsights?.map((insight: any, i: number) => (
            <div key={`insight-${i}`} className="group relative bg-white p-6 border border-amber-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer"
              onClick={() => onUseIdea('expert', insight.didYouKnow || insight.fact)}>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-gray-900 text-white text-[10px] px-2 py-1 font-medium">Créer</span>
              </div>
              <div className="w-10 h-10 bg-amber-50 text-amber-600 flex items-center justify-center text-xl mb-4">
                💡
              </div>
              <div className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider mb-2">Le saviez-vous ?</div>
              <h4 className="text-base font-medium text-gray-900 mb-3">
                {insight.didYouKnow || insight.fact}
              </h4>
              {insight.source && (
                <p className="text-[10px] text-gray-400 italic">Source: {insight.source}</p>
              )}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Angle</span>
                <span className="text-xs font-medium text-gray-600">Positionnement expert</span>
              </div>
            </div>
          ))}

          {/* Generic Topic Suggestions */}
          {brandData.contentNuggets?.blogTopics?.slice(0, 3).map((topic: string, i: number) => (
            <div key={`topic-${i}`} className="group relative bg-white p-5 border border-gray-200 border-dashed hover:border-solid hover:border-gray-300 transition-all cursor-pointer"
              onClick={() => onUseIdea('expert', topic)}>
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-1">📰</span>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">{topic}</h4>
                  <p className="text-xs text-gray-500">Sujet d'article détecté sur votre blog</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* COL 3: BRAND & PRODUCT (Features, Values) */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-purple-500 rounded-full" />
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Marque & Produit</h3>
          </div>

          {brandData.features?.map((f: string, i: number) => (
            <div key={`feat-${i}`} className="group relative bg-white p-6 border border-purple-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer"
              onClick={() => onUseIdea('product', `Découvrez ${f}`)}>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-gray-900 text-white text-[10px] px-2 py-1 font-medium">Créer</span>
              </div>
              <div className="w-10 h-10 bg-purple-50 text-purple-600 flex items-center justify-center text-xl mb-4">
                ✨
              </div>
              <h4 className="text-base font-medium text-gray-900 mb-2">
                {f}
              </h4>
              <p className="text-xs text-gray-500">
                Mettez en avant cette fonctionnalité clé de votre offre.
              </p>
            </div>
          ))}

          {brandData.values?.map((v: string, i: number) => (
            <div key={`val-${i}`} className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border border-blue-100 hover:border-blue-200 transition-all cursor-pointer"
              onClick={() => onUseIdea('announcement', `Nos valeurs : ${v}`)}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Valeur</span>
                <span className="text-xl">💎</span>
              </div>
              <h4 className="text-lg font-bold text-blue-900">
                {v}
              </h4>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
