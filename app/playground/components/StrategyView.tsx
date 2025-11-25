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
  const totalIdeas = statsCount + testimonialsCount + insightsCount + featuresCount;
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
                {featuresCount} Atouts
              </div>
            </div>
          )}
        </div>

        {/* STYLE MATCH ZONE - NEW FEATURE */}
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
                // Logic to handle style transfer would go here
                // For now, just trigger a toast or console log
                console.log("Style reference uploaded:", e.target.files[0]);
              }
            }}
          />
        </div>
      </div>

      {/* Masonry-like Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* COL 1: PROOF & TRUST (Stats, Testimonials) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Preuve & Confiance</h3>
            <span className="text-xs text-gray-300">{statsCount + testimonialsCount}</span>
          </div>

          {showGenerics && (
            <div className="group relative bg-white p-5 rounded-lg border border-gray-200 border-dashed hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer"
              onClick={() => onUseIdea('quote', `"Le service de ${brandData.name} est exceptionnel..."`)}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-lg text-gray-400">💬</div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Témoignage client</h4>
                  <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">Générique</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">Partagez un retour d'expérience positif pour rassurer vos prospects.</p>
            </div>
          )}

          {brandData.contentNuggets?.realStats?.map((stat: string, i: number) => (
            <div key={`stat-${i}`} className="group relative bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer"
              onClick={() => onUseIdea('stat', stat)}>
              <div className="mb-4">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase tracking-wide">Statistique</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4 leading-snug">
                {stat}
              </h4>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">Format suggéré</span>
                  <span className="text-xs font-medium text-gray-700">{getTemplateIcon('stat')} Chiffre clé</span>
                </div>
                <span className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium">Créer →</span>
              </div>
            </div>
          ))}

          {brandData.contentNuggets?.testimonials?.map((t: any, i: number) => (
            <div key={`testi-${i}`} className="group relative bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer"
              onClick={() => onUseIdea('quote', `"${t.quote}" — ${t.author}`)}>
              <div className="mb-3">
                <span className="text-3xl text-emerald-200 font-serif">“</span>
              </div>
              <blockquote className="text-sm text-gray-700 font-medium mb-4 leading-relaxed pl-2 border-l-2 border-emerald-100">
                {t.quote}
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                  {t.author?.[0] || '?'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-900 truncate">{t.author || 'Client'}</div>
                  <div className="text-[10px] text-gray-500 truncate">{t.role || 'Vérifié'}</div>
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
            <div className="group relative bg-white p-5 rounded-lg border border-gray-200 border-dashed hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
              onClick={() => onUseIdea('expert', `3 conseils pour mieux gérer votre...`)}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-lg text-gray-400">💡</div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Conseil d'expert</h4>
                  <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">Générique</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">Partagez votre expertise pour éduquer votre audience.</p>
            </div>
          )}

          {brandData.industryInsights?.map((insight: any, i: number) => (
            <div key={`insight-${i}`} className="group relative bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer"
              onClick={() => onUseIdea('expert', insight.didYouKnow || insight.fact)}>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">💡</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded uppercase tracking-wide">Le saviez-vous ?</span>
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-3 leading-relaxed">
                {insight.didYouKnow || insight.fact}
              </h4>
              {insight.source && (
                <p className="text-[10px] text-gray-400 italic mb-4">Source: {insight.source}</p>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">Format</span>
                  <span className="text-xs font-medium text-gray-700">{getTemplateIcon('expert')} Expertise</span>
                </div>
                <span className="text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium">Créer →</span>
              </div>
            </div>
          ))}

          {brandData.contentNuggets?.blogTopics?.slice(0, 3).map((topic: string, i: number) => (
            <div key={`topic-${i}`} className="group relative bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => onUseIdea('expert', topic)}>
              <div className="flex items-start gap-3">
                <span className="text-xl opacity-50">📰</span>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">{topic}</h4>
                  <p className="text-[10px] text-gray-400">Sujet issu de votre blog</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* COL 3: BRAND & PRODUCT (Features, Values) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Marque & Produit</h3>
            <span className="text-xs text-gray-300">{featuresCount}</span>
          </div>

          {showGenerics && (
            <div className="group relative bg-white p-5 rounded-lg border border-gray-200 border-dashed hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
              onClick={() => onUseIdea('product', `Découvrez notre solution pour...`)}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-lg text-gray-400">✨</div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Focus Produit</h4>
                  <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">Générique</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">Mettez en avant votre produit phare.</p>
            </div>
          )}

          {brandData.features?.map((f: string, i: number) => (
            <div key={`feat-${i}`} className="group relative bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer"
              onClick={() => onUseIdea('product', `Découvrez ${f}`)}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center text-sm shadow-sm">✨</div>
                <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">Atout</span>
              </div>
              <h4 className="text-base font-semibold text-gray-900 mb-2">
                {f}
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Mettez en avant cet avantage compétitif.
              </p>
              <div className="flex justify-end">
                <span className="text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium">Générer →</span>
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