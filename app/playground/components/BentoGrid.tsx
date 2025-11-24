'use client';

import { useState, useEffect } from 'react';

export default function BentoGrid({ brandData, backgrounds = [], isGeneratingBackgrounds = false, onUpdate, onValidate, onAddSource, onSave }: { brandData: any, backgrounds?: string[], isGeneratingBackgrounds?: boolean, onUpdate: (data: any) => void, onValidate: () => void, onAddSource?: () => void, onSave?: () => void }) {
  const [localData, setLocalData] = useState(brandData);

  useEffect(() => {
    setLocalData(brandData);
  }, [brandData]);

  const handleChange = (field: string, value: any) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onUpdate(newData);
  };

  const logoBgColor = localData.colors?.[0] || '#F5F0EA';

  // Helper to prevent black-on-black if the scraped color is very dark
  const isDark = (color: string) => {
    if (!color || !color.startsWith('#')) return false;
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return ((r * 299) + (g * 587) + (b * 114)) / 1000 < 50; // very dark threshold
  };

  const effectiveLogoBg = isDark(logoBgColor) ? '#FFFFFF' : logoBgColor;

  return (
    <div className="animate-fade-in text-[#ECECEC] w-full">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-baseline gap-4">
           <h2 className="text-4xl font-black text-[#414141] tracking-tight">{localData.name || 'Brand Identity'}</h2>
           <a href={localData.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-black transition-colors font-mono text-xs border border-gray-200 px-2 py-1 rounded-full">
             {localData.url} ↗
           </a>
        </div>
        <div className="flex gap-3">
            <button 
              onClick={onSave}
              className="px-6 py-3 bg-white text-black border border-gray-200 rounded-full font-bold text-sm hover:bg-gray-50 transition shadow-sm hover:shadow-md flex items-center gap-2"
            >
              💾 Sauvegarder
            </button>
            <button 
              onClick={onValidate}
              className="px-8 py-3 bg-black text-white rounded-full font-bold text-sm hover:scale-105 transition shadow-xl hover:shadow-2xl"
            >
              Valider & Générer →
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 auto-rows-[minmax(100px,auto)]">
        
        {/* LEFT COLUMN - IDENTITY (Cols 1-3) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Logo */}
            <div 
                className="aspect-square rounded-[24px] p-6 border border-gray-800/10 relative group flex items-center justify-center overflow-hidden shadow-sm hover:shadow-md transition-all"
                style={{ backgroundColor: effectiveLogoBg }}
            >
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <span className="text-[10px] font-bold bg-black/10 text-black px-2 py-1 rounded-full backdrop-blur-sm cursor-pointer">Change</span>
                </div>
                {localData.logo ? (
                    <img src={localData.logo} alt="Logo" className="w-full h-full object-contain drop-shadow-sm" />
                ) : (
                    <span className="text-6xl opacity-20 mix-blend-overlay">LOGO</span>
                )}
            </div>

            {/* Colors Compact */}
            <div className="bg-[#1A1A1A] p-5 rounded-[24px] border border-gray-800 shadow-sm flex-1 flex flex-col">
               <h3 className="font-medium text-gray-400 text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                 Palette <span className="bg-gray-800 text-gray-500 px-1.5 rounded-full">{localData.colors?.length || 0}</span>
               </h3>
               <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] no-scrollbar pr-1">
                  {localData.colors?.slice(0, 6).map((color: string, i: number) => (
                     <div key={i} className="group flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                        <div className="w-8 h-8 rounded-full shadow-sm ring-1 ring-white/10" style={{ backgroundColor: color }}></div>
                        <div className="flex flex-col">
                            <span className="text-xs font-mono text-gray-300 group-hover:text-white transition-colors">{color}</span>
                            <span className="text-[9px] text-gray-600">Primary</span>
                        </div>
                        <span className="ml-auto text-[9px] text-gray-500 opacity-0 group-hover:opacity-100">Copy</span>
                     </div>
                  ))}
               </div>
            </div>
        </div>

        {/* MIDDLE COLUMN - STRATEGY (Cols 4-8) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Row 1: Typography & Tagline */}
            <div className="flex gap-4 h-40">
                <div className="flex-1 bg-[#262627] p-5 rounded-[24px] border border-gray-800 flex flex-col relative overflow-hidden group">
                    <h3 className="font-medium text-gray-500 text-[10px] uppercase tracking-widest mb-1">Primary Font</h3>
                    <div className="mt-auto">
                        <div className="text-2xl font-bold text-white truncate" style={{ fontFamily: 'sans-serif' }}>{localData.fonts?.[0] || 'Inter'}</div>
                        <div className="text-xs text-gray-500 mt-1">Aa Bb Cc Dd 123</div>
                    </div>
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-[#d4f34a]">Edit</span>
                    </div>
                </div>
                
                <div className="flex-[1.2] bg-[#1A1A1A] p-5 rounded-[24px] border border-gray-800 flex flex-col">
                    <h3 className="font-medium text-gray-500 text-[10px] uppercase tracking-widest mb-2">Tagline</h3>
                    <textarea 
                        value={localData.tagline || ''}
                        onChange={(e) => handleChange('tagline', e.target.value)}
                        className="bg-transparent text-[#d4f34a] text-lg font-serif italic outline-none resize-none w-full h-full leading-tight placeholder:text-gray-700"
                        placeholder="Slogan de la marque..."
                    />
                </div>
            </div>

            {/* Row 2: Brand DNA (Unified Card) */}
            <div className="bg-[#1A1A1A] p-6 rounded-[24px] border border-gray-800 flex flex-col gap-6">
                {/* Values */}
                <div>
                    <h3 className="font-medium text-gray-500 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                        ⚡ Core Values
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {localData.values?.map((val: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-xs text-gray-200 shadow-sm hover:border-gray-500 transition-colors cursor-default">
                                {val}
                            </span>
                        ))}
                        <button className="px-2 py-1.5 rounded-lg border border-dashed border-gray-700 text-gray-600 text-xs hover:text-gray-400 hover:border-gray-500 transition-colors">+</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-gray-800/50">
                    {/* Aesthetic */}
                    <div>
                        <h3 className="font-medium text-gray-500 text-[10px] uppercase tracking-widest mb-2">🎨 Aesthetic</h3>
                        <div className="flex flex-wrap gap-1.5">
                            {(Array.isArray(localData.aesthetic) ? localData.aesthetic : (localData.aesthetic?.split(',') || [])).map((val: string, i: number) => (
                                <span key={i} className="px-2 py-1 rounded bg-white/5 text-[11px] text-gray-300 border border-transparent hover:border-gray-700 transition-colors">
                                    {val.trim()}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Tone */}
                    <div>
                        <h3 className="font-medium text-gray-500 text-[10px] uppercase tracking-widest mb-2">🗣️ Tone</h3>
                        <div className="flex flex-wrap gap-2">
                            {(Array.isArray(localData.toneVoice) ? localData.toneVoice : (localData.toneVoice?.split(',') || [])).map((val: string, i: number) => (
                                <span key={i} className="text-[11px] text-gray-400 italic"># {val.trim()}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

             {/* Row 3: Description & Features */}
            <div className="bg-[#1A1A1A] p-5 rounded-[24px] border border-gray-800 flex-1 flex flex-col">
                <h3 className="font-medium text-gray-500 text-[10px] uppercase tracking-widest mb-2">Business Overview</h3>
                <textarea 
                    value={localData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="w-full h-20 bg-transparent outline-none text-sm leading-relaxed text-gray-300 resize-none placeholder:text-gray-700 mb-4"
                    placeholder="Description de l'entreprise..."
                />
                
                {/* Key Features / Services */}
                {(localData.features?.length > 0 || localData.services?.length > 0) && (
                    <div className="pt-4 border-t border-gray-800/50">
                        <h3 className="font-medium text-gray-500 text-[10px] uppercase tracking-widest mb-2">Key Features</h3>
                        <div className="flex flex-wrap gap-2">
                            {[...(localData.features || []), ...(localData.services || [])].slice(0, 6).map((feat: string, i: number) => (
                                <span key={i} className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px]">
                                    ✓ {feat}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* RIGHT COLUMN - ASSETS (Cols 9-12) */}
        <div className="lg:col-span-4 flex flex-col gap-4 h-[85vh]">
            
            {/* Asset Library (60% height) */}
            <div className="bg-[#1A1A1A] rounded-[24px] border border-gray-800 shadow-lg flex flex-col flex-[2] overflow-hidden relative">
               <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1A1A1A]/95 backdrop-blur z-10">
                   <h3 className="font-medium text-gray-300 text-xs uppercase tracking-widest flex items-center gap-2">
                       Asset Library <span className="bg-[#d4f34a] text-black text-[9px] font-bold px-1.5 rounded-sm">{localData.images?.length || 0}</span>
                   </h3>
                   <button 
                       onClick={() => onAddSource?.()}
                       className="text-[10px] font-bold bg-white text-black px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
                   >
                       + ADD
                   </button>
               </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar p-4">
                    <div className="columns-2 gap-4 space-y-4">
                        {localData.images?.map((img: string, i: number) => {
                            const labelObj = localData.labeledImages?.find((li: any) => li.url === img);
                            const label = labelObj?.category || (img === localData.logo ? 'main_logo' : 'other');
                            
                            return (
                            <div key={i} className="break-inside-avoid rounded-xl overflow-hidden relative group bg-gray-900 border border-gray-800 hover:border-gray-600 transition-all">
                                <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1">
                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm shadow-sm ${
                                        label === 'main_logo' ? 'bg-[#d4f34a] text-black' :
                                        label === 'client_logo' ? 'bg-gray-600 text-white' :
                                        label === 'product' ? 'bg-blue-500 text-white' :
                                        label === 'app_ui' ? 'bg-purple-500 text-white' :
                                        label === 'person' ? 'bg-orange-500 text-white' :
                                        'bg-black/50 text-white border border-white/20 backdrop-blur-sm'
                                    }`}>
                                        {label.replace('_', ' ')}
                                    </span>
                                </div>
                                <img src={img} className="w-full h-auto object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} loading="lazy" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                                    <div className="flex gap-2">
                                        <button onClick={() => window.open(img, '_blank')} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform">👁</button>
                                        <button onClick={() => handleChange('images', localData.images.filter((_: any, idx: number) => idx !== i))} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform">×</button>
                                    </div>
                                </div>
                            </div>
                        )})}
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#1A1A1A] to-transparent pointer-events-none"></div>
            </div>

            {/* Brand Backgrounds (40% height) */}
            <div className="bg-[#1A1A1A] rounded-[24px] border border-gray-800 shadow-lg flex flex-col flex-1 overflow-hidden relative">
                <div className="px-6 py-3 border-b border-gray-800 bg-[#1A1A1A] z-10">
                    <h3 className="font-medium text-gray-300 text-xs uppercase tracking-widest">Textures & Backgrounds</h3>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-4">
                    {backgrounds && backgrounds.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {backgrounds.map((bg, i) => (
                                <div key={i} className="aspect-square rounded-xl overflow-hidden border border-gray-800 group relative">
                                    <img src={bg} className="w-full h-full object-cover" loading="lazy" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={() => window.open(bg, '_blank')} className="text-[10px] bg-white text-black px-2 py-1 rounded-full font-bold">VIEW</button>
                                    </div>
                                </div>
                            ))}
                             {isGeneratingBackgrounds && (
                                <div className="aspect-square rounded-xl overflow-hidden border border-gray-800 flex flex-col items-center justify-center bg-white/5 animate-pulse">
                                    <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin mb-2"></div>
                                    <span className="text-[8px] text-gray-500 uppercase">Génération...</span>
                                </div>
                            )}
                        </div>
                    ) : (
                         <div className="h-full flex flex-col items-center justify-center text-gray-600 text-center p-4">
                             {isGeneratingBackgrounds ? (
                                <>
                                    <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin mb-3"></div>
                                    <p className="text-[10px] uppercase tracking-widest animate-pulse">Création des textures...</p>
                                </>
                             ) : (
                                <>
                                    <span className="text-2xl mb-2">🎨</span>
                                    <p className="text-xs">Aucune texture générée.</p>
                                </>
                             )}
                        </div>
                    )}
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}
