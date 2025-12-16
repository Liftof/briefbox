'use client';

import { useState, useRef, useCallback } from 'react';

// Curated style categories - focused on app marketing styles
const CATEGORIES = [
  { id: 'all', label: 'Tout', labelEn: 'All' },
  { id: 'playful', label: 'Playful & Fun', labelEn: 'Playful & Fun' },
  { id: 'clean', label: 'Clean & Pro', labelEn: 'Clean & Pro' },
  { id: 'bold', label: 'Bold & Vibrant', labelEn: 'Bold & Vibrant' },
  { id: 'dark', label: 'Dark Mode', labelEn: 'Dark Mode' },
  { id: 'lifestyle', label: 'Lifestyle', labelEn: 'Lifestyle' },
];

// Curated App Store style inspirations
// Real-world app marketing examples for style reference
const INSPIRATIONS = [
  // PLAYFUL & FUN
  {
    id: 'ref-7',
    category: 'playful',
    url: '/inspirations/ref-7.jpeg',
    title: 'App Playful',
    titleEn: 'App Playful',
    desc: 'Couleurs vives, mascotte, gamification',
    descEn: 'Bright colors, mascot, gamification',
    tags: ['colorful', 'fun', 'mascot', 'engaging']
  },
  {
    id: 'ref-6',
    category: 'playful',
    url: '/inspirations/ref-6.jpeg',
    title: 'Nature & Calm',
    titleEn: 'Nature & Calm',
    desc: 'Tons verts/jaunes, lifestyle, zen',
    descEn: 'Green/yellow tones, lifestyle, zen',
    tags: ['nature', 'calm', 'lifestyle', 'soft']
  },
  
  // CLEAN & PROFESSIONAL
  {
    id: 'ref-2',
    category: 'clean',
    url: '/inspirations/ref-2.jpeg',
    title: 'Clean Pro',
    titleEn: 'Clean Pro',
    desc: 'Minimaliste, mockups devices, pro',
    descEn: 'Minimalist, device mockups, pro',
    tags: ['minimal', 'device', 'professional', 'clean']
  },
  {
    id: 'ref-4',
    category: 'clean',
    url: '/inspirations/ref-4.jpeg',
    title: 'Features Grid',
    titleEn: 'Features Grid',
    desc: 'Grid layout, features, badges',
    descEn: 'Grid layout, features, badges',
    tags: ['grid', 'features', 'organized', 'badges']
  },
  
  // BOLD & VIBRANT
  {
    id: 'ref-5',
    category: 'bold',
    url: '/inspirations/ref-5.jpeg',
    title: 'Bold Colors',
    titleEn: 'Bold Colors',
    desc: 'Couleurs saturées, contrastes forts',
    descEn: 'Saturated colors, strong contrasts',
    tags: ['saturated', 'contrast', 'bold', 'vibrant']
  },
  {
    id: 'ref-3',
    category: 'bold',
    url: '/inspirations/ref-3.jpeg',
    title: 'Multi-Cards',
    titleEn: 'Multi-Cards',
    desc: 'Bento grid, multi-éléments, dynamique',
    descEn: 'Bento grid, multi-elements, dynamic',
    tags: ['bento', 'cards', 'dynamic', 'colorful']
  },
  
  // DARK MODE
  {
    id: 'ref-8',
    category: 'dark',
    url: '/inspirations/ref-8.jpeg',
    title: 'Dark Mode',
    titleEn: 'Dark Mode',
    desc: 'Fond sombre, néons, premium',
    descEn: 'Dark background, neons, premium',
    tags: ['dark', 'neon', 'premium', 'modern']
  },
  
  // LIFESTYLE
  {
    id: 'ref',
    category: 'lifestyle',
    url: '/inspirations/ref.jpeg',
    title: 'Lifestyle Mix',
    titleEn: 'Lifestyle Mix',
    desc: 'Photos réelles, humain, authentique',
    descEn: 'Real photos, human, authentic',
    tags: ['human', 'authentic', 'lifestyle', 'real']
  }
];

interface StyleRef {
  url: string;
  note?: string;
}

interface StyleGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  // New: Multi-select mode
  multiSelect?: boolean;
  selectedStyles?: StyleRef[];
  onMultiSelect?: (styles: StyleRef[]) => void;
  locale?: 'fr' | 'en';
}

export default function StyleGallery({ 
  isOpen, 
  onClose, 
  onSelect,
  multiSelect = false,
  selectedStyles = [],
  onMultiSelect,
  locale = 'fr'
}: StyleGalleryProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [localSelections, setLocalSelections] = useState<StyleRef[]>(selectedStyles);
  const [globalNote, setGlobalNote] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload for custom inspiration
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        if (multiSelect && onMultiSelect) {
          const newStyle: StyleRef = { url: ev.target!.result as string };
          setLocalSelections(prev => [...prev, newStyle].slice(0, 3));
        } else {
          onSelect(ev.target!.result as string);
          onClose();
        }
      }
    };
    reader.readAsDataURL(file);
  }, [multiSelect, onMultiSelect, onSelect, onClose]);

  // Toggle selection in multi-select mode
  const toggleSelection = (url: string) => {
    if (!multiSelect) {
      onSelect(url);
      onClose();
      return;
    }
    
    setLocalSelections(prev => {
      const exists = prev.find(s => s.url === url);
      if (exists) {
        return prev.filter(s => s.url !== url);
      } else if (prev.length < 3) {
        return [...prev, { url }];
      }
      return prev;
    });
  };

  // Apply multi-selection
  const handleApply = () => {
    if (onMultiSelect) {
      // Add global note to selections that don't have one
      const withNotes = localSelections.map(s => ({
        ...s,
        note: s.note || globalNote || undefined
      }));
      onMultiSelect(withNotes);
    }
    onClose();
  };

  // Remove a selection
  const removeSelection = (url: string) => {
    setLocalSelections(prev => prev.filter(s => s.url !== url));
  };

  if (!isOpen) return null;

  const filteredImages = activeCategory === 'all' 
    ? INSPIRATIONS 
    : INSPIRATIONS.filter(img => img.category === activeCategory);

  const t = {
    title: locale === 'fr' ? "Galerie d'Inspirations" : "Inspiration Gallery",
    subtitle: locale === 'fr' 
      ? "Sélectionnez un ou plusieurs styles pour guider la direction artistique." 
      : "Select one or more styles to guide the art direction.",
    useStyle: locale === 'fr' ? 'Utiliser ce style' : 'Use this style',
    noImages: locale === 'fr' ? 'Aucune inspiration dans cette catégorie' : 'No inspiration in this category',
    uploadOwn: locale === 'fr' ? 'Uploader votre propre image' : 'Upload your own image',
    uploadHint: locale === 'fr' ? 'comme référence de style' : 'as style reference',
    selected: locale === 'fr' ? 'sélectionné(s)' : 'selected',
    whatYouLike: locale === 'fr' 
      ? "Qu'est-ce qui vous plaît dans ces styles ? (optionnel)" 
      : "What do you like about these styles? (optional)",
    placeholder: locale === 'fr' 
      ? "Ex: J'aime les couleurs vives et la mise en page épurée..." 
      : "E.g.: I like the bright colors and clean layout...",
    apply: locale === 'fr' ? 'Appliquer' : 'Apply',
    cancel: locale === 'fr' ? 'Annuler' : 'Cancel',
    max3: locale === 'fr' ? 'Max 3 styles' : 'Max 3 styles',
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[85vh] flex flex-col relative border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-xl">🎨</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
                <p className="text-sm text-gray-500">{t.subtitle}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Selected styles preview (multi-select mode) */}
        {multiSelect && localSelections.length > 0 && (
          <div className="px-8 py-4 bg-purple-50 border-b border-purple-100">
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-purple-700 uppercase tracking-wider">
                {localSelections.length}/3 {t.selected}
              </span>
              <div className="flex gap-2 flex-1">
                {localSelections.map((style, i) => (
                  <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-purple-400">
                    <img src={style.url} className="w-full h-full object-cover" alt="" />
                    <button
                      onClick={() => removeSelection(style.url)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <span className="text-xs text-purple-500">{t.max3}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="px-8 pt-4 bg-white border-b border-gray-100 overflow-x-auto">
          <div className="flex gap-6">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`pb-4 text-sm font-medium transition-all relative whitespace-nowrap ${
                  activeCategory === cat.id 
                    ? 'text-gray-900' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {locale === 'fr' ? cat.label : cat.labelEn}
                {activeCategory === cat.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map(img => {
              const isSelected = localSelections.some(s => s.url === img.url || s.url.includes(img.url));
              
              return (
                <div 
                  key={img.id}
                  onClick={() => toggleSelection(img.url)}
                  className={`group relative aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                    isSelected 
                      ? 'border-purple-500 ring-2 ring-purple-200' 
                      : 'border-transparent hover:border-blue-500 hover:shadow-xl'
                  }`}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center z-10 shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Image with fallback */}
                  <img 
                    src={img.url} 
                    alt={locale === 'fr' ? img.title : img.titleEn}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x500/f3f4f6/9ca3af?text=${encodeURIComponent(img.title)}`;
                    }}
                  />
                  
                  {/* Overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 flex flex-col justify-end p-4 ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <h3 className="text-white font-bold text-sm">{locale === 'fr' ? img.title : img.titleEn}</h3>
                    <p className="text-white/80 text-xs mt-1 leading-relaxed">{locale === 'fr' ? img.desc : img.descEn}</p>
                    
                    {/* Tags */}
                    {img.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {img.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-white/20 backdrop-blur-sm text-white/90 text-[9px] rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {!multiSelect && (
                      <button className="mt-3 w-full py-2.5 bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-blue-600 transition-colors">
                        {t.useStyle}
                      </button>
                    )}
                  </div>
                  
                  {/* Category badge always visible */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[9px] font-medium uppercase tracking-wider rounded-full">
                    {locale === 'fr' 
                      ? CATEGORIES.find(c => c.id === img.category)?.label 
                      : CATEGORIES.find(c => c.id === img.category)?.labelEn}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Empty state if no images match */}
          {filteredImages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">{t.noImages}</p>
            </div>
          )}
          
          {/* Upload your own */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="mt-6 p-6 bg-white border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                <span className="text-purple-600 font-medium">{t.uploadOwn}</span> {t.uploadHint}
              </p>
            </div>
          </div>
        </div>

        {/* Footer with note input (multi-select mode) */}
        {multiSelect && (
          <div className="px-8 py-4 border-t border-gray-200 bg-white">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              {t.whatYouLike}
            </label>
            <textarea
              value={globalNote}
              onChange={(e) => setGlobalNote(e.target.value)}
              placeholder={t.placeholder}
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleApply}
                disabled={localSelections.length === 0}
                className="px-6 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {t.apply} ({localSelections.length})
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
