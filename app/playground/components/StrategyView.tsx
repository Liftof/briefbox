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
  onOpenGallery?: () => void;
}

export default function StrategyView({ brandData, onUseIdea, onOpenGallery }: StrategyViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'proof' | 'market' | 'identity'>('all');

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
  const blogCount = brandData?.contentNuggets?.blogTopics?.length || 0;
  const featuresCount = (brandData?.features?.length || 0) + (brandData?.values?.length || 0);
  const painPointsCount = brandData?.painPoints?.length || 0;
  const vocabCount = brandData?.vocabulary?.length || 0;
  
  const totalIdeas = statsCount + testimonialsCount + insightsCount + blogCount + featuresCount + painPointsCount + vocabCount;
  
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

    // Helper to render tab button
    const TabButton = ({ id, label, count, color }: { id: string, label: string, count: number, color: string }) => (
      <button
        onClick={() => setActiveTab(id as any)}
        className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 border ${
          activeTab === id 
            ? `bg-gray-900 text-white border-gray-900` 
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        {label}
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
          activeTab === id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
        }`}>
          {count}
        </span>
      </button>
    );

    return (
      <div className="max-w-7xl mx-auto py-10 px-6 animate-fade-in">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-900 flex items-center justify-center rounded-xl shadow-lg shadow-gray-200/50">
                  <span className="text-white text-lg">✦</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Stratégie & Idées</h1>
              </div>
              <p className="text-gray-500 text-sm max-w-xl leading-relaxed pl-1">
                Explorez les angles de communication détectés pour <span className="font-semibold text-gray-900">{brandData.name}</span>. 
                Cliquez sur une carte pour générer un visuel instantanément.
              </p>
            </div>
          </div>

          {/* STYLE MATCH ZONE - Compact & Modern */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-1 rounded-2xl shadow-xl mb-10">
            <div className="bg-gray-900/50 backdrop-blur-sm p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-2xl border border-white/10">
                  🎨
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Direction Artistique</h3>
                  <p className="text-gray-400 text-xs max-w-md font-light">
                    Importez une référence ou choisissez un style dans la galerie pour guider l'IA.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {onOpenGallery && (
                  <button 
                    onClick={onOpenGallery}
                    className="whitespace-nowrap px-4 py-2 bg-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2 border border-white/10 rounded-lg backdrop-blur-md"
                  >
                    ✨ Galerie
                  </button>
                )}
                <button 
                  onClick={() => document.getElementById('style-upload')?.click()}
                  className="group whitespace-nowrap px-4 py-2 bg-white text-gray-900 text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center gap-2 rounded-lg shadow-lg shadow-black/20"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Importer
                </button>
              </div>
              <input 
                id="style-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (typeof ev.target?.result === 'string') {
                            // Trigger event to add this to style refs in parent
                            const event = new CustomEvent('add-style-ref', { detail: ev.target.result });
                            window.dispatchEvent(event);
                        }
                    };
                    reader.readAsDataURL(e.target.files[0]);
                  }
                }}
              />
            </div>
          </div>

          {/* TABS NAVIGATION - Pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            <TabButton id="all" label="Vue d'ensemble" count={totalIdeas} color="gray" />
            <TabButton id="proof" label="Preuve Sociale" count={statsCount + testimonialsCount} color="emerald" />
            <TabButton id="market" label="Marché & Trends" count={insightsCount + blogCount} color="amber" />
            <TabButton id="identity" label="Offre & Identité" count={featuresCount + painPointsCount + vocabCount} color="purple" />
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 auto-rows-min">
          
          {/* SECTION: PROOF & TRUST */}
          {(activeTab === 'all' || activeTab === 'proof') && (
            <>
              {showGenerics && (
                <div className="group bg-white p-5 border border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all cursor-pointer rounded-2xl flex flex-col gap-3"
                  onClick={() => onUseIdea('quote', `"Le service de ${brandData.name} est exceptionnel..."`)}>
                  <div className="flex justify-between items-start">
                    <span className="text-2xl opacity-50 grayscale group-hover:grayscale-0 transition-all">💬</span>
                    <span className="bg-gray-100 text-gray-500 text-[9px] px-2 py-1 uppercase tracking-widest font-bold rounded-full">Générique</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">Témoignage client</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Partagez un retour d'expérience positif.</p>
                  </div>
                </div>
              )}

              {brandData.contentNuggets?.realStats?.map((stat: string, i: number) => (
                <div key={`stat-${i}`} className="group bg-white p-6 border border-gray-100 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer rounded-2xl flex flex-col relative overflow-hidden"
                  onClick={() => onUseIdea('stat', stat)}>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                  
                  <div className="flex items-center gap-2 mb-4 relative z-10">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs">📊</span>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Chiffre Clé</span>
                  </div>
                  
                  <h4 className="text-2xl font-bold text-gray-900 mb-4 leading-tight relative z-10 group-hover:text-emerald-900 transition-colors">
                    {stat}
                  </h4>
                  
                  <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-medium">Source: Site Web</span>
                    <span className="text-emerald-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">Créer →</span>
                  </div>
                </div>
              ))}

              {brandData.contentNuggets?.testimonials?.map((t: any, i: number) => (
                <div key={`testi-${i}`} className="group bg-gradient-to-b from-white to-gray-50/50 p-6 border border-gray-100 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer rounded-2xl flex flex-col"
                  onClick={() => onUseIdea('quote', `"${t.quote}" — ${t.author}`)}>
                  
                  <div className="mb-3 text-blue-200 group-hover:text-blue-400 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.0548 14.6598 14.6092 15.9455 13.6632C17.2313 12.6808 19.0773 12.1896 21.4836 12.1896V9.0072C18.6493 9.0072 16.652 9.6348 15.4917 10.89C14.368 12.1176 13.8062 14.154 13.8062 17V21H14.017ZM8.00002 21L8.00002 18C8.00002 16.0548 8.64283 14.6092 9.92859 13.6632C11.2144 12.6808 13.0603 12.1896 15.4667 12.1896V9.0072C12.6323 9.0072 10.6351 9.6348 9.47477 10.89C8.35108 12.1176 7.78924 14.154 7.78924 17V21H8.00002Z" /></svg>
                  </div>

                  <blockquote className="text-sm text-gray-700 font-medium mb-6 leading-relaxed flex-grow italic">
                    "{t.quote}"
                  </blockquote>

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 shadow-sm">
                      {t.author?.[0] || '?'}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-gray-900 uppercase tracking-wider">{t.author || 'Client'}</div>
                      <div className="text-[10px] text-gray-400">{t.role || 'Vérifié'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* SECTION: EXPERTISE & MARKET */}
          {(activeTab === 'all' || activeTab === 'market') && (
            <>
              {showGenerics && (
                <div className="group bg-white p-5 border border-dashed border-gray-300 hover:border-amber-500 hover:bg-amber-50/30 transition-all cursor-pointer rounded-2xl flex flex-col gap-3"
                  onClick={() => onUseIdea('expert', `3 conseils pour mieux gérer votre...`)}>
                  <div className="flex justify-between items-start">
                    <span className="text-2xl opacity-50 grayscale group-hover:grayscale-0 transition-all">🎓</span>
                    <span className="bg-gray-100 text-gray-500 text-[9px] px-2 py-1 uppercase tracking-widest font-bold rounded-full">Générique</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">Conseil d'expert</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Partagez votre expertise pour éduquer.</p>
                  </div>
                </div>
              )}

              {brandData.industryInsights?.map((insight: any, i: number) => (
                <div key={`insight-${i}`} className="group bg-white p-6 border border-gray-100 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/5 transition-all cursor-pointer rounded-2xl flex flex-col"
                  onClick={() => onUseIdea('expert', insight.didYouKnow || insight.fact)}>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-amber-50 text-amber-700 text-[9px] px-2 py-1 rounded-md font-bold uppercase tracking-wider border border-amber-100">Le saviez-vous ?</span>
                  </div>
                  
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 leading-relaxed flex-grow">
                    {insight.didYouKnow || insight.fact}
                  </h4>
                  
                  {insight.source && (
                    <div className="flex items-center gap-1 text-[9px] text-gray-400 font-mono mt-auto pt-3 border-t border-gray-50 uppercase tracking-wider">
                      <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                      Source: {insight.source}
                    </div>
                  )}
                </div>
              ))}

              {brandData.contentNuggets?.blogTopics?.slice(0, 3).map((topic: string, i: number) => (
                <div key={`topic-${i}`} className="group bg-white p-5 border border-gray-100 hover:border-gray-400 transition-all cursor-pointer rounded-2xl hover:shadow-lg flex items-center gap-4"
                  onClick={() => onUseIdea('expert', topic)}>
                  <div className="w-10 h-10 bg-gray-50 border border-gray-200 flex items-center justify-center text-lg flex-shrink-0 rounded-lg group-hover:bg-gray-100 transition-colors">
                    📰
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 mb-1 leading-snug uppercase tracking-wide group-hover:text-black transition-colors">{topic}</h4>
                    <p className="text-[10px] text-gray-500">Idée d'article</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* SECTION: IDENTITY & OFFER */}
          {(activeTab === 'all' || activeTab === 'identity') && (
            <>
              {showGenerics && (
                <div className="group bg-white p-5 border border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50/30 transition-all cursor-pointer rounded-2xl flex flex-col gap-3"
                  onClick={() => onUseIdea('product', `Découvrez notre solution pour...`)}>
                  <div className="flex justify-between items-start">
                    <span className="text-2xl opacity-50 grayscale group-hover:grayscale-0 transition-all">📦</span>
                    <span className="bg-gray-100 text-gray-500 text-[9px] px-2 py-1 uppercase tracking-widest font-bold rounded-full">Générique</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">Présentation produit</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Mettez en avant une fonctionnalité clé.</p>
                  </div>
                </div>
              )}

              {/* Pain Points - Compact List */}
              {brandData.painPoints?.length > 0 && (
                <div className="col-span-1 md:col-span-2 bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-xs">🎯</div>
                    <h4 className="text-xs font-bold text-rose-900 uppercase tracking-widest">Problèmes Résolus</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {brandData.painPoints.map((pain: string, i: number) => (
                      <div 
                        key={`pain-${i}`}
                        onClick={() => onUseIdea('expert', `Comment résoudre : ${pain}`)}
                        className="bg-white px-4 py-3 border border-rose-100 hover:border-rose-300 cursor-pointer transition-all flex items-center justify-between group rounded-xl shadow-sm"
                      >
                        <span className="text-xs text-gray-800 font-medium leading-tight">{pain}</span>
                        <span className="text-[10px] text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              {brandData.features?.map((f: string, i: number) => (
                <div key={`feat-${i}`} className="group bg-white p-6 border border-gray-100 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/5 transition-all cursor-pointer rounded-2xl flex flex-col"
                  onClick={() => onUseIdea('product', `Découvrez ${f}`)}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 flex items-center justify-center text-xl border border-purple-100 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      ✨
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">
                    {f}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-grow">
                    Atout compétitif clé
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                      Produit
                    </span>
                    <span className="text-purple-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity">Utiliser</span>
                  </div>
                </div>
              ))}

              {/* Values - Compact Tags */}
              {brandData.values?.length > 0 && (
                <div className="col-span-1 md:col-span-2 bg-white p-6 border border-gray-200 rounded-2xl">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span>💎</span> Nos Valeurs
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {brandData.values.map((v: string, i: number) => (
                      <button 
                        key={`val-${i}`}
                        onClick={() => onUseIdea('announcement', `Nos valeurs : ${v}`)}
                        className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg transition-all hover:scale-105"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    );
  }