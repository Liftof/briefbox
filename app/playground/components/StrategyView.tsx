import React, { useEffect, useState } from 'react';
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
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Helper to get template icon
  const getTemplateIcon = (id: string) => TEMPLATES.find(t => t.id === id)?.icon || '📄';

  // Count available ideas
  const statsCount = brandData?.contentNuggets?.realStats?.length || 0;
  const testimonialsCount = brandData?.contentNuggets?.testimonials?.length || 0;
  const insightsCount = brandData?.industryInsights?.length || 0;
  const featuresCount = (brandData?.features?.length || 0) + (brandData?.values?.length || 0);
  const painPointsCount = brandData?.painPoints?.length || 0;
  const vocabCount = brandData?.vocabulary?.length || 0;
  
  const totalIdeas = statsCount + testimonialsCount + insightsCount + featuresCount + painPointsCount + vocabCount;
  
  // Even if no real data, show generic ideas so the view is never empty
  const showGenerics = totalIdeas === 0;

  if (!brandData) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-6">
        <div className="text-center py-20 bg-white border border-gray-200 border-dashed rounded-lg">
          <div className="w-16 h-16 bg-gray-50 mx-auto mb-4 flex items-center justify-center text-3xl rounded-full">
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
      {/* Header Section */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Stratégie & Idées</h1>
            <p className="text-gray-500 text-sm max-w-xl">
              Explorez les angles de communication détectés pour <span className="font-medium text-gray-900">{brandData.name}</span>. 
              Cliquez sur une carte pour générer un visuel instantanément.
            </p>
          </div>
          
          {totalIdeas > 0 && (
            <div className="flex gap-3">
              <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm flex items-center gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"/>
                {statsCount + testimonialsCount} Preuves
              </div>
              <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm flex items-center gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"/>
                {insightsCount} Insights
              </div>
              <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm flex items-center gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"/>
                {featuresCount + painPointsCount + vocabCount} Identité
              </div>
            </div>
          )}
        </div>

        {/* STYLE MATCH ZONE */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl p-6 shadow-lg mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/20 text-white text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded">Nouveau</span>
              <h3 className="text-lg font-semibold">Reproduire un style</h3>
            </div>
            <p className="text-gray-300 text-sm max-w-md">
              Vous avez vu un visuel incroyable sur Instagram ou Pinterest ? 
              Importez-le ici et nous recréerons ce style exact pour votre marque.
            </p>
          </div>
          <button 
            onClick={() => document.getElementById('style-upload')?.click()}
            className="whitespace-nowrap px-5 py-3 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Importer une référence
          </button>
          <input 
            id="style-upload" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => {
              if (e.target.files?.[0]) {
                // For now just log, the real implementation would pass this to parent
                console.log("Style reference uploaded:", e.target.files[0]);
              }
            }}
          />
        </div>
      </div>

      {/* Masonry-like Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* COL 1: PROOF & TRUST (Stats, Testimonials) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Preuve & Confiance</h3>
            <span className="text-xs text-gray-300">{statsCount + testimonialsCount}</span>
          </div>

          {showGenerics && (
            <div className="group relative bg-white p-6 rounded-xl border border-gray-200 border-dashed hover:border-solid hover:border-emerald-400 transition-all cursor-pointer hover:shadow-md"
              onClick={() => onUseIdea('quote', `"Le service de ${brandData.name} est exceptionnel..."`)}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-3xl">💬</span>
                <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-medium">Générique</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Idée : Témoignage client</h4>
              <p className="text-sm text-gray-500 leading-relaxed">Partagez un retour d'expérience positif pour rassurer vos prospects.</p>
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
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Expertise & Marché</h3>
            <span className="text-xs text-gray-300">{insightsCount}</span>
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
            <div key={`topic-${i}`} className="group relative bg-white p-5 rounded-xl border border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => onUseIdea('expert', topic)}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white rounded border border-gray-200 flex items-center justify-center text-lg shadow-sm flex-shrink-0">📰</div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1 leading-snug">{topic}</h4>
                  <p className="text-xs text-gray-500">Recycler cet article de blog en post visuel</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* COL 3: BRAND IDENTITY (Features, Values, Vocabulary) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Identité & Offre</h3>
            <span className="text-xs text-gray-300">{featuresCount + painPointsCount + vocabCount}</span>
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

          {/* Pain Points (NEW) */}
          {brandData.painPoints?.length > 0 && (
            <div className="bg-red-50/50 rounded-xl p-6 border border-red-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🎯</span>
                <h4 className="text-sm font-bold text-red-900 uppercase tracking-wide">Problèmes Résolus</h4>
              </div>
              <div className="space-y-3">
                {brandData.painPoints.map((pain: string, i: number) => (
                  <div 
                    key={`pain-${i}`}
                    onClick={() => onUseIdea('expert', `Comment résoudre : ${pain}`)}
                    className="bg-white p-3 rounded-lg border border-red-100 hover:border-red-300 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <span className="text-sm text-gray-700 font-medium">{pain}</span>
                    <span className="text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vocabulary (NEW) */}
          {brandData.vocabulary?.length > 0 && (
            <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🗣️</span>
                <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wide">Vocabulaire de Marque</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {brandData.vocabulary.map((word: string, i: number) => (
                  <span 
                    key={`vocab-${i}`}
                    onClick={() => onUseIdea('announcement', `Zoom sur : ${word}`)}
                    className="bg-white px-3 py-1.5 rounded-full border border-blue-100 text-xs font-medium text-blue-800 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
                  >
                    {word}
                  </span>
                ))}
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
            <div key={`val-${i}`} className="group relative bg-gradient-to-br from-gray-50 to-white p-5 rounded-lg border border-gray-200 hover:border-blue-300 transition-all cursor-pointer"
              onClick={() => onUseIdea('announcement', `Nos valeurs : ${v}`)}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">💎</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Valeur</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900">
                {v}
              </h4>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}