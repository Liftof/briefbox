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

// Curated inspiration images (scraped from Dribbble)
const INSPIRATIONS = [
  {
    id: 'dribbble-fmlqoxkj3',
    category: 'creative',
    url: 'https://cdn.dribbble.com/userupload/17346481/file/still-9818a1ac0393843a498db0c7a1def8b0.png?format=webp&resize=400x300&vertical=center',
    title: 'Swiftmate : Digital Bank',
    desc: 'Animation, brand design, digital bank graphic design'
  },
  {
    id: 'dribbble-6k9f618ox',
    category: 'minimal',
    url: 'https://cdn.dribbble.com/userupload/15810940/file/original-1cfe42a229beedfd8a9a58c4abbf2ca8.png?format=webp&resize=400x300&vertical=center',
    title: 'Vegetarian Website Branding',
    desc: 'Clean colors, whitespace, organic feel'
  },
  {
    id: 'dribbble-i13orgmhv',
    category: 'creative',
    url: 'https://cdn.dribbble.com/userupload/16834492/file/still-0e52651c763c61f9117c96b43e2b662f.png?format=webp&resize=400x300&vertical=center',
    title: 'Dash Race : Running',
    desc: 'Dynamic, motion, sport branding'
  },
  {
    id: 'dribbble-9ntrm0afh',
    category: 'creative',
    url: 'https://cdn.dribbble.com/userupload/10973375/file/still-e9d72fd032a747ab2dc2243b5ff0e674.gif?format=webp&resize=400x300&vertical=center',
    title: '8Luck Casino Brand',
    desc: 'Bold, entertainment, vibrant colors'
  },
  {
    id: 'dribbble-eiiwx1v7b',
    category: 'tech',
    url: 'https://cdn.dribbble.com/userupload/42885398/file/original-fb3c5d455d814b86bbdad2b4193eef3e.png?format=webp&resize=400x300&vertical=center',
    title: 'Pragmatike – Assets',
    desc: 'Tech branding, UI elements, clean layout'
  },
  {
    id: 'dribbble-z1s2clj92',
    category: 'creative',
    url: 'https://cdn.dribbble.com/userupload/17332935/file/still-b668b251ea84178381fac75f8b51c4c0.png?format=webp&resize=400x300&vertical=center',
    title: 'ChainGPT — Halloween',
    desc: 'Thematic, illustration, dark mode'
  },
  {
    id: 'dribbble-833qn8uld',
    category: 'creative',
    url: 'https://cdn.dribbble.com/userupload/18067496/file/original-1828a3d1d6f1b15b08ce355f5d79ec28.png?format=webp&resize=400x300&vertical=center',
    title: 'Visualtap : Resources',
    desc: 'Design resources, modern, bold typography'
  },
  {
    id: 'dribbble-sidmp06ub',
    category: 'tech',
    url: 'https://cdn.dribbble.com/userupload/17663902/file/original-ff8d6bf12ac202d74456a3250616e8e9.png?format=webp&resize=400x300&vertical=center',
    title: 'Happi Loop : Kids',
    desc: 'Playful, colorful, rounded shapes'
  },
  {
    id: 'dribbble-fsu2sa5vx',
    category: 'creative',
    url: 'https://cdn.dribbble.com/userupload/44933625/file/9141f81b5441e5a4d972968f66859619.png?format=webp&resize=400x300&vertical=center',
    title: 'Design Exploration',
    desc: 'Artistic, collage style, textured'
  },
  {
    id: 'dribbble-zmwfib0bd',
    category: 'creative',
    url: 'https://cdn.dribbble.com/userupload/18230207/file/original-a2afce4ae7c1ccfbdaf9832f902246e5.jpg?crop=0x0-3201x2401&format=webp&resize=400x300&vertical=center',
    title: 'Door7 Social Media',
    desc: 'Modern 3D, isometric, vibrant'
  },
  {
    id: 'dribbble-p2q6siae8',
    category: 'minimal',
    url: 'https://cdn.dribbble.com/userupload/16991874/file/original-bea84810e79d5c84e0b0581ceaceb5b3.png?format=webp&resize=400x300&vertical=center',
    title: 'Architect Studio',
    desc: 'Architectural, structured, minimal'
  },
  {
    id: 'dribbble-luouoytje',
    category: 'minimal',
    url: 'https://cdn.dribbble.com/userupload/43262855/file/original-f73d7cfaf0f70f69e88becc07732c82c.png?format=webp&resize=400x300&vertical=center',
    title: 'Hubspot Branding',
    desc: 'SaaS, CRM, orange & white, clean'
  },
  {
    id: 'dribbble-f50fpmeqj',
    category: 'creative',
    url: 'https://cdn.dribbble.com/userupload/17885322/file/still-b10232707fae1026f638f67e354dd373.png?format=webp&resize=400x300&vertical=center',
    title: 'Bloomaroo Visuals',
    desc: 'Organic, nature-inspired, soft colors'
  },
  {
    id: 'dribbble-1qemm9jut',
    category: 'creative',
    url: 'https://cdn.dribbble.com/userupload/42815588/file/original-25d755232381898fd90118e4e6bf6ff7.png?format=webp&resize=400x300&vertical=center',
    title: 'Travel Banner',
    desc: 'Travel, photographic, adventurous'
  },
  {
    id: 'dribbble-rw533w3z6',
    category: 'creative',
    url: 'https://cdn.dribbble.com/userupload/17444644/file/original-74d3a4d6cc9ad6b601d4be550b618dba.png?format=webp&resize=400x300&vertical=center',
    title: 'Genova Supplements',
    desc: 'Health, clean, product focus'
  },
  {
    id: 'dribbble-hw9d2p255',
    category: 'minimal',
    url: 'https://cdn.dribbble.com/userupload/36163232/file/original-1c23ee62b7599ab688fa6903c26cbf58.png?format=webp&resize=400x300&vertical=center',
    title: 'Sandow AI Fitness',
    desc: 'Fitness app, dark mode, data viz'
  },
  {
    id: 'dribbble-4clg14yi4',
    category: 'tech',
    url: 'https://cdn.dribbble.com/userupload/5204851/file/original-c27484a0c8f2842417482dafb0cef251.png?format=webp&resize=400x300&vertical=center',
    title: 'Voltaire Booster',
    desc: 'SaaS dashboard, analytics, blue'
  },
  {
    id: 'dribbble-h2pbjr3h4',
    category: 'creative',
    url: 'https://cdn.dribbble.com/userupload/16874310/file/still-cb5abe8b197cb12b6a9e54b06b8447bf.png?format=webp&resize=400x300&vertical=center',
    title: 'Infinity Production',
    desc: 'Video production, kinetic typography'
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
