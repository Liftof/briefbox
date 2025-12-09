'use client';

import { useState } from 'react';

// Curated style categories - focused on app marketing styles
const CATEGORIES = [
  { id: 'all', label: 'Tout' },
  { id: 'playful', label: 'Playful & Fun' },
  { id: 'clean', label: 'Clean & Pro' },
  { id: 'bold', label: 'Bold & Vibrant' },
  { id: 'dark', label: 'Dark Mode' },
  { id: 'lifestyle', label: 'Lifestyle' },
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
    desc: 'Couleurs vives, mascotte, gamification',
    tags: ['colorful', 'fun', 'mascot', 'engaging']
  },
  {
    id: 'ref-6',
    category: 'playful',
    url: '/inspirations/ref-6.jpeg',
    title: 'Nature & Calm',
    desc: 'Tons verts/jaunes, lifestyle, zen',
    tags: ['nature', 'calm', 'lifestyle', 'soft']
  },
  
  // CLEAN & PROFESSIONAL
  {
    id: 'ref-2',
    category: 'clean',
    url: '/inspirations/ref-2.jpeg',
    title: 'Clean Pro',
    desc: 'Minimaliste, mockups devices, pro',
    tags: ['minimal', 'device', 'professional', 'clean']
  },
  {
    id: 'ref-4',
    category: 'clean',
    url: '/inspirations/ref-4.jpeg',
    title: 'Features Grid',
    desc: 'Grid layout, features, badges',
    tags: ['grid', 'features', 'organized', 'badges']
  },
  
  // BOLD & VIBRANT
  {
    id: 'ref-5',
    category: 'bold',
    url: '/inspirations/ref-5.jpeg',
    title: 'Bold Colors',
    desc: 'Couleurs saturées, contrastes forts',
    tags: ['saturated', 'contrast', 'bold', 'vibrant']
  },
  {
    id: 'ref-3',
    category: 'bold',
    url: '/inspirations/ref-3.jpeg',
    title: 'Multi-Cards',
    desc: 'Bento grid, multi-éléments, dynamique',
    tags: ['bento', 'cards', 'dynamic', 'colorful']
  },
  
  // DARK MODE
  {
    id: 'ref-8',
    category: 'dark',
    url: '/inspirations/ref-8.jpeg',
    title: 'Dark Mode',
    desc: 'Fond sombre, néons, premium',
    tags: ['dark', 'neon', 'premium', 'modern']
  },
  
  // LIFESTYLE
  {
    id: 'ref',
    category: 'lifestyle',
    url: '/inspirations/ref.jpeg',
    title: 'Lifestyle Mix',
    desc: 'Photos réelles, humain, authentique',
    tags: ['human', 'authentic', 'lifestyle', 'real']
  }
];

interface StyleGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export default function StyleGallery({ isOpen, onClose, onSelect }: StyleGalleryProps) {
  const [activeCategory, setActiveCategory] = useState('all');

  if (!isOpen) return null;

  const filteredImages = activeCategory === 'all' 
    ? INSPIRATIONS 
    : INSPIRATIONS.filter(img => img.category === activeCategory);

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[85vh] flex flex-col relative border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Galerie d'Inspirations</h2>
            <p className="text-sm text-gray-500 mt-1">Sélectionnez un style pour guider la direction artistique de vos visuels.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            ×
          </button>
        </div>

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
                {cat.label}
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
            {filteredImages.map(img => (
              <div 
                key={img.id}
                onClick={() => {
                  onSelect(img.url);
                  onClose();
                }}
                className="group relative aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500 hover:shadow-xl transition-all duration-300"
              >
                {/* Image with fallback */}
                <img 
                  src={img.url} 
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback to placeholder if image not found
                    (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x500/f3f4f6/9ca3af?text=${encodeURIComponent(img.title)}`;
                  }}
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <h3 className="text-white font-bold text-sm">{img.title}</h3>
                  <p className="text-white/80 text-xs mt-1 leading-relaxed">{img.desc}</p>
                  
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
                  
                  <button className="mt-3 w-full py-2.5 bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-blue-600 transition-colors">
                    Utiliser ce style
                  </button>
                </div>
                
                {/* Category badge always visible */}
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[9px] font-medium uppercase tracking-wider rounded-full">
                  {CATEGORIES.find(c => c.id === img.category)?.label || img.category}
                </div>
              </div>
            ))}
          </div>
          
          {/* Empty state if no images match */}
          {filteredImages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">Aucune inspiration dans cette catégorie</p>
            </div>
          )}
          
          {/* Upload your own prompt */}
          <div className="mt-6 p-4 bg-white border border-dashed border-gray-300 rounded-xl text-center">
            <p className="text-sm text-gray-500">
              💡 Vous pouvez aussi <span className="text-gray-900 font-medium">uploader votre propre image</span> comme référence de style
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
