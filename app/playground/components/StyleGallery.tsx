'use client';

import { useState } from 'react';

// Curated style categories
const CATEGORIES = [
  { id: 'all', label: 'Tout' },
  { id: 'minimal', label: 'Minimaliste' },
  { id: 'tech', label: 'Tech & SaaS' },
  { id: 'fashion', label: 'Mode & Luxe' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'creative', label: 'Créatif & Bold' },
];

// Curated inspiration images (using Unsplash for demo purposes)
// In a real app, these would be hosted assets optimized for style transfer
const INSPIRATIONS = [
  {
    id: 'min-1',
    category: 'minimal',
    url: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=600&q=80',
    title: 'Soft Mineral',
    desc: 'Tons neutres, lumière douce, composition aérée'
  },
  {
    id: 'min-2',
    category: 'minimal',
    url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80',
    title: 'Swiss Clean',
    desc: 'Grilles strictes, typographie forte, fond uni'
  },
  {
    id: 'tech-1',
    category: 'tech',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
    title: 'Cyber Dark',
    desc: 'Néons, fonds sombres, gradients futuristes'
  },
  {
    id: 'tech-2',
    category: 'tech',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    title: 'Data Flow',
    desc: 'Abstrait, connectivité, bleu technique'
  },
  {
    id: 'lux-1',
    category: 'fashion',
    url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=600&q=80',
    title: 'Editorial',
    desc: 'Grain argentique, flou artistique, haute couture'
  },
  {
    id: 'lux-2',
    category: 'fashion',
    url: 'https://images.unsplash.com/photo-1618932260643-2b67265569f3?auto=format&fit=crop&w=600&q=80',
    title: 'Modern Luxe',
    desc: 'Épuré, matériaux nobles, serif élégant'
  },
  {
    id: 'corp-1',
    category: 'corporate',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    title: 'Glass Office',
    desc: 'Professionnel, urbain, bleu confiance'
  },
  {
    id: 'corp-2',
    category: 'corporate',
    url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=600&q=80',
    title: 'Team Success',
    desc: 'Collaboration, humain, dynamique'
  },
  {
    id: 'bold-1',
    category: 'creative',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80',
    title: 'Retro Pop',
    desc: 'Couleurs vives, collage, années 80/90'
  },
  {
    id: 'bold-2',
    category: 'creative',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    title: 'Abstract Art',
    desc: 'Formes organiques, peintures, textures riches'
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
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map(img => (
              <div 
                key={img.id}
                onClick={() => {
                  onSelect(img.url);
                  onClose();
                }}
                className="group relative aspect-[4/5] bg-gray-200 rounded-lg overflow-hidden cursor-pointer border border-gray-200 hover:border-gray-900 hover:shadow-lg transition-all"
              >
                <img 
                  src={img.url} 
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <h3 className="text-white font-bold text-sm">{img.title}</h3>
                  <p className="text-white/70 text-xs mt-0.5">{img.desc}</p>
                  <button className="mt-3 w-full py-2 bg-white text-black text-xs font-bold uppercase tracking-wider rounded">
                    Choisir ce style
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
