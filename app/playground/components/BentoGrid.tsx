'use client';

import { useState, useEffect } from 'react';

export default function BentoGrid({ brandData, backgrounds = [], isGeneratingBackgrounds = false, onUpdate, onValidate, onAddSource, onBack }: { brandData: any, backgrounds?: string[], isGeneratingBackgrounds?: boolean, onUpdate: (data: any) => void, onValidate: () => void, onAddSource?: () => void, onBack?: () => void }) {
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

  const isDark = (color: string) => {
    if (!color || !color.startsWith('#')) return false;
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return ((r * 299) + (g * 587) + (b * 114)) / 1000 < 50;
  };

  const effectiveLogoBg = isDark(logoBgColor) ? '#FFFFFF' : logoBgColor;
  const finalLogoBg = effectiveLogoBg === '#FFFFFF' && logoBgColor === '#FFFFFF' ? '#F5F5F5' : effectiveLogoBg;

  return (
    <div className="animate-fade-in w-full">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Brand Identity</span>
          </div>
        </div>
        <button 
          onClick={onValidate}
          className="group relative px-6 py-2.5 bg-gray-900 text-white text-sm font-medium transition-all hover:bg-black"
        >
          <span className="relative z-10 flex items-center gap-2">
            Valider & Créer
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </header>

      {/* Brand name and URL */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <h2 className="text-3xl font-light text-gray-900 mb-2">
          {localData.name || 'Brand Identity'}
        </h2>
        <a href={localData.url} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-gray-400 hover:text-gray-900 transition-colors">
          {localData.url} ↗
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN - IDENTITY */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Logo */}
          <div className="relative">
            <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-gray-300" />
            <div 
              className="aspect-square p-8 flex items-center justify-center bg-white border border-gray-200"
              style={{ backgroundColor: finalLogoBg }}
            >
              {localData.logo ? (
                <img src={localData.logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-4xl text-gray-300 font-light">LOGO</span>
              )}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-gray-900 p-5 border border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Palette</span>
              <span className="ml-auto text-[10px] font-mono text-gray-600">{localData.colors?.length || 0}</span>
            </div>
            <div className="space-y-2">
              {localData.colors?.slice(0, 6).map((color: string, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="w-6 h-6 rounded-full ring-1 ring-white/10" style={{ backgroundColor: color }} />
                  <span className="text-xs font-mono text-gray-400 group-hover:text-white transition-colors">{color}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN - STRATEGY */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Typography & Tagline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 p-5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block mb-3">Primary Font</span>
              <div className="text-xl font-medium text-gray-900">{localData.fonts?.[0] || 'Inter'}</div>
              <div className="text-xs text-gray-300 mt-1 font-mono">Aa Bb Cc 123</div>
            </div>
            
            <div className="bg-white border border-gray-200 p-5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block mb-3">Tagline</span>
              <textarea 
                value={localData.tagline || ''}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-gray-900 resize-none h-16 leading-relaxed placeholder:text-gray-300"
                placeholder="Slogan de la marque..."
              />
            </div>
          </div>

          {/* Brand DNA */}
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Brand DNA</span>
            </div>
            
            {/* Values */}
            <div className="mb-6">
              <span className="text-xs text-gray-400 block mb-2">Core Values</span>
              <div className="flex flex-wrap gap-2">
                {localData.values?.map((val: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-gray-100 text-xs text-gray-700 font-medium">
                    {val}
                  </span>
                ))}
                <button className="px-2 py-1.5 border border-dashed border-gray-300 text-gray-400 text-xs hover:border-gray-900 hover:text-gray-900 transition-colors">+</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-5 border-t border-gray-100">
              <div>
                <span className="text-xs text-gray-400 block mb-2">Aesthetic</span>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(localData.aesthetic) ? localData.aesthetic : (localData.aesthetic?.split(',') || [])).map((val: string, i: number) => (
                    <span key={i} className="text-xs text-gray-600">{val.trim()}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-400 block mb-2">Tone of Voice</span>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(localData.toneVoice) ? localData.toneVoice : (localData.toneVoice?.split(',') || [])).map((val: string, i: number) => (
                    <span key={i} className="text-xs text-gray-500 italic">#{val.trim()}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-gray-200 p-6">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block mb-3">Business Overview</span>
            <textarea 
              value={localData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full bg-transparent outline-none text-sm text-gray-700 resize-none h-16 leading-relaxed placeholder:text-gray-300"
              placeholder="Description de l'entreprise..."
            />
            
            {(localData.features?.length > 0 || localData.services?.length > 0) && (
              <div className="pt-4 mt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400 block mb-2">Key Features</span>
                <div className="flex flex-wrap gap-2">
                  {[...(localData.features || []), ...(localData.services || [])].slice(0, 6).map((feat: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-medium">
                      ✓ {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Marketing Angles */}
          {localData.marketingAngles && localData.marketingAngles.length > 0 && (
            <div className="relative bg-gray-900 p-6 border border-gray-800">
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-emerald-500" />
              
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">Creative Angles</span>
                <span className="ml-auto text-[10px] text-gray-500">Ready to generate</span>
              </div>
              
              <div className="space-y-3 max-h-[200px] overflow-y-auto no-scrollbar">
                {localData.marketingAngles.slice(0, 4).map((angle: any, i: number) => (
                  <div key={i} className="group p-3 bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white text-sm truncate">{angle.title}</span>
                          {angle.platform && (
                            <span className="text-[8px] uppercase px-1.5 py-0.5 bg-gray-800 text-gray-400 flex-shrink-0">
                              {angle.platform}
                            </span>
                          )}
                        </div>
                        {angle.hook && (
                          <p className="text-emerald-400 text-xs italic mb-1 truncate">"{angle.hook}"</p>
                        )}
                        <p className="text-gray-400 text-[11px] line-clamp-2">{angle.concept}</p>
                      </div>
                      <button 
                        className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-emerald-500 text-white text-[9px] font-medium flex-shrink-0"
                        onClick={() => {
                          const brief = angle.concept || angle.title;
                          window.dispatchEvent(new CustomEvent('use-angle', { detail: brief }));
                        }}
                      >
                        USE →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - ASSETS */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Asset Library */}
          <div className="bg-white border border-gray-200 flex flex-col h-[60vh]">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Asset Library</span>
                <span className="text-[9px] font-mono bg-gray-900 text-white px-1.5 py-0.5">{localData.images?.length || 0}</span>
              </div>
              <button 
                onClick={() => onAddSource?.()}
                className="text-[10px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                + ADD
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
              <div className="columns-2 gap-3 space-y-3">
                {localData.images?.map((img: string, i: number) => {
                  const labelObj = localData.labeledImages?.find((li: any) => li.url === img);
                  const label = labelObj?.category || (img === localData.logo ? 'main_logo' : 'other');
                  
                  return (
                    <div key={i} className="break-inside-avoid overflow-hidden relative group border border-gray-200 hover:border-gray-400 transition-all">
                      <div className="absolute top-2 left-2 z-10">
                        <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 ${
                          label === 'main_logo' ? 'bg-gray-900 text-white' :
                          label === 'product' ? 'bg-emerald-500 text-white' :
                          label === 'app_ui' ? 'bg-purple-500 text-white' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {label.replace('_', ' ')}
                        </span>
                      </div>
                      <img src={img} className="w-full h-auto" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} loading="lazy" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => window.open(img, '_blank')} className="w-8 h-8 bg-white text-gray-900 flex items-center justify-center hover:scale-110 transition-transform text-sm">👁</button>
                        <button onClick={() => handleChange('images', localData.images.filter((_: any, idx: number) => idx !== i))} className="w-8 h-8 bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform text-sm">×</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Backgrounds */}
          <div className="bg-gray-900 border border-gray-800 flex flex-col flex-1">
            <div className="px-5 py-4 border-b border-gray-800">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Textures</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
              {backgrounds && backgrounds.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {backgrounds.map((bg, i) => (
                    <div key={i} className="aspect-square overflow-hidden border border-gray-800 group relative">
                      <img src={bg} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => window.open(bg, '_blank')} className="text-[9px] bg-white text-gray-900 px-2 py-1 font-medium">VIEW</button>
                      </div>
                    </div>
                  ))}
                  {isGeneratingBackgrounds && (
                    <div className="aspect-square border border-gray-800 flex flex-col items-center justify-center bg-white/5 animate-pulse">
                      <div className="w-4 h-4 border-2 border-gray-600 border-t-white rounded-full animate-spin mb-2" />
                      <span className="text-[8px] text-gray-500 font-mono uppercase">Generating</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center">
                  {isGeneratingBackgrounds ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin mb-3" />
                      <p className="text-[10px] font-mono uppercase tracking-widest">Creating textures...</p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-600">No textures generated</p>
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
