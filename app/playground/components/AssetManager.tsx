'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Tag options with colors
const TAG_OPTIONS = [
  { value: 'main_logo', label: 'Logo', labelEn: 'Logo', color: 'bg-gray-900 text-white' },
  { value: 'product', label: 'Produit', labelEn: 'Product', color: 'bg-blue-500 text-white' },
  { value: 'app_ui', label: 'App/UI', labelEn: 'App/UI', color: 'bg-purple-500 text-white' },
  { value: 'reference', label: 'Référence', labelEn: 'Reference', color: 'bg-amber-500 text-white' },
  { value: 'team', label: 'Équipe', labelEn: 'Team', color: 'bg-pink-500 text-white' },
  { value: 'lifestyle', label: 'Lifestyle', labelEn: 'Lifestyle', color: 'bg-emerald-500 text-white' },
  { value: 'other', label: 'Autre', labelEn: 'Other', color: 'bg-gray-400 text-white' },
];

// Checker pattern for transparent images
const CHECKER_PATTERN_STYLE: React.CSSProperties = {
  backgroundImage: `
    linear-gradient(45deg, #e5e5e5 25%, transparent 25%),
    linear-gradient(-45deg, #e5e5e5 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e5e5e5 75%),
    linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)
  `,
  backgroundSize: '12px 12px',
  backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
  backgroundColor: '#fafafa'
};

interface LabeledImage {
  url: string;
  category: string;
}

interface AssetManagerProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  labeledImages: LabeledImage[];
  selectedImages: string[];
  logoUrl?: string;
  onSelectionChange: (selected: string[]) => void;
  onLabelChange: (imageUrl: string, newLabel: string) => void;
  onImport: (files: { url: string; tag: string }[]) => void;
  onDelete?: (imageUrl: string) => void;
  locale?: 'fr' | 'en';
}

export default function AssetManager({
  isOpen,
  onClose,
  images,
  labeledImages,
  selectedImages,
  logoUrl,
  onSelectionChange,
  onLabelChange,
  onImport,
  onDelete,
  locale = 'fr'
}: AssetManagerProps) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [localSelected, setLocalSelected] = useState<string[]>(selectedImages);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with prop changes
  useEffect(() => {
    setLocalSelected(selectedImages);
  }, [selectedImages]);

  // Get label for an image
  const getLabel = useCallback((imageUrl: string): string => {
    if (imageUrl === logoUrl) return 'main_logo';
    const found = labeledImages.find(li => li.url === imageUrl);
    return found?.category || 'other';
  }, [labeledImages, logoUrl]);

  // Get tag display info
  const getTagInfo = (tagValue: string) => {
    const tag = TAG_OPTIONS.find(t => t.value === tagValue);
    return tag || TAG_OPTIONS[TAG_OPTIONS.length - 1]; // fallback to 'other'
  };

  // Filter images by category
  const filteredImages = activeFilter === 'all' 
    ? images 
    : images.filter(img => getLabel(img) === activeFilter);

  // Toggle image selection
  const toggleSelection = (imageUrl: string) => {
    // Logo is always selected, can't toggle
    if (imageUrl === logoUrl) return;
    
    setLocalSelected(prev => {
      if (prev.includes(imageUrl)) {
        return prev.filter(url => url !== imageUrl);
      } else {
        return [...prev, imageUrl];
      }
    });
  };

  // Select all visible
  const selectAll = () => {
    const allVisible = filteredImages.filter(img => img !== logoUrl);
    setLocalSelected(prev => {
      const existing = new Set(prev);
      allVisible.forEach(img => existing.add(img));
      if (logoUrl) existing.add(logoUrl);
      return Array.from(existing);
    });
  };

  // Deselect all (except logo)
  const deselectAll = () => {
    setLocalSelected(logoUrl ? [logoUrl] : []);
  };

  // Handle file upload
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    Promise.all(
      imageFiles.map(file => {
        return new Promise<{ url: string; tag: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ url: reader.result as string, tag: 'other' });
          reader.readAsDataURL(file);
        });
      })
    ).then(results => {
      onImport(results);
    });
  }, [onImport]);

  // Handle drag & drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  // Apply selection and close
  const handleApply = () => {
    onSelectionChange(localSelected);
    onClose();
  };

  // Count by category
  const getCategoryCount = (category: string): number => {
    if (category === 'all') return images.length;
    return images.filter(img => getLabel(img) === category).length;
  };

  if (!isOpen) return null;

  const t = {
    title: locale === 'fr' ? 'Visuels de la marque' : 'Brand Visuals',
    filter: locale === 'fr' ? 'Filtrer' : 'Filter',
    all: locale === 'fr' ? 'Tous' : 'All',
    selectAll: locale === 'fr' ? 'Tout sélectionner' : 'Select all',
    deselectAll: locale === 'fr' ? 'Tout désélectionner' : 'Deselect all',
    selected: locale === 'fr' ? 'sélectionné(s)' : 'selected',
    drop: locale === 'fr' ? 'Glissez vos images ici ou' : 'Drop images here or',
    browse: locale === 'fr' ? 'parcourir' : 'browse',
    apply: locale === 'fr' ? 'Utiliser' : 'Use',
    cancel: locale === 'fr' ? 'Annuler' : 'Cancel',
    logoLocked: locale === 'fr' ? 'Logo (toujours inclus)' : 'Logo (always included)',
    changeLabel: locale === 'fr' ? 'Changer le label' : 'Change label',
    noImages: locale === 'fr' ? 'Aucune image dans cette catégorie' : 'No images in this category',
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[85vh] flex flex-col relative border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t.title}</h2>
              <p className="text-xs text-gray-500">{images.length} images • {localSelected.length} {t.selected}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter tabs */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-gray-500 mr-2">{t.filter}:</span>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
              activeFilter === 'all' 
                ? 'bg-gray-900 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {t.all} ({getCategoryCount('all')})
          </button>
          {TAG_OPTIONS.map(tag => {
            const count = getCategoryCount(tag.value);
            if (count === 0) return null;
            return (
              <button
                key={tag.value}
                onClick={() => setActiveFilter(tag.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 ${
                  activeFilter === tag.value 
                    ? tag.color
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {locale === 'fr' ? tag.label : tag.labelEn} ({count})
              </button>
            );
          })}
        </div>

        {/* Bulk actions */}
        <div className="px-6 py-2 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              {t.selectAll}
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={deselectAll}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {t.deselectAll}
            </button>
          </div>
          <span className="text-xs text-gray-400">
            {localSelected.length} {t.selected}
          </span>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {filteredImages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">{t.noImages}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {filteredImages.map((imageUrl, index) => {
                const isLogo = imageUrl === logoUrl;
                const isSelected = localSelected.includes(imageUrl) || isLogo;
                const label = getLabel(imageUrl);
                const tagInfo = getTagInfo(label);
                
                return (
                  <div 
                    key={index}
                    className="relative group"
                  >
                    {/* Image card */}
                    <div 
                      onClick={() => toggleSelection(imageUrl)}
                      className={`aspect-square rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${
                        isSelected 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-transparent hover:border-gray-300'
                      } ${isLogo ? 'cursor-default' : ''}`}
                      style={CHECKER_PATTERN_STYLE}
                    >
                      <img 
                        src={imageUrl} 
                        alt="" 
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                      
                      {/* Selection indicator */}
                      {isSelected && !isLogo && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Logo badge */}
                      {isLogo && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-gray-900 text-white text-[9px] font-bold rounded-full shadow-lg">
                          LOGO ✓
                        </div>
                      )}
                      
                      {/* Delete button (on hover, not for logo) */}
                      {onDelete && !isLogo && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(imageUrl);
                          }}
                          className="absolute top-2 left-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg text-xs"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    
                    {/* Label dropdown */}
                    <div className="mt-2">
                      <select
                        value={label}
                        onChange={(e) => onLabelChange(imageUrl, e.target.value)}
                        disabled={isLogo}
                        className={`w-full text-[10px] font-medium py-1.5 px-2 rounded-md border transition-all ${
                          isLogo 
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
                            : 'bg-white border-gray-200 hover:border-gray-400 cursor-pointer'
                        }`}
                        title={isLogo ? t.logoLocked : t.changeLabel}
                      >
                        {TAG_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {locale === 'fr' ? opt.label : opt.labelEn}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Drop zone for upload */}
          <div 
            className={`mt-6 border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                {t.drop} <span className="text-blue-600 font-medium">{t.browse}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            {t.apply} {localSelected.length} {locale === 'fr' ? 'visuels' : 'visuals'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
