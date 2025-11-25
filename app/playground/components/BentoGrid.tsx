'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Tag options including the new "visuel de référence"
const TAG_OPTIONS = [
  { value: 'main_logo', label: 'Logo', color: 'bg-gray-900 text-white' },
  { value: 'product', label: 'Produit', color: 'bg-emerald-500 text-white' },
  { value: 'app_ui', label: 'App/UI', color: 'bg-purple-500 text-white' },
  { value: 'reference', label: 'Visuel de référence', color: 'bg-amber-500 text-white' },
  { value: 'team', label: 'Équipe', color: 'bg-blue-500 text-white' },
  { value: 'lifestyle', label: 'Lifestyle', color: 'bg-pink-500 text-white' },
  { value: 'other', label: 'Autre', color: 'bg-gray-200 text-gray-600' },
];

// Import popup component
function ImportPopup({ 
  isOpen, 
  onClose, 
  onImport 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onImport: (files: { url: string; tag: string }[]) => void;
}) {
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string; tag: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/')).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      tag: 'other'
    }));
    
    setPendingFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (index: number) => {
    setPendingFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const updateTag = (index: number, tag: string) => {
    setPendingFiles(prev => {
      const newFiles = [...prev];
      newFiles[index] = { ...newFiles[index], tag };
      return newFiles;
    });
  };

  const handleImport = async () => {
    // Convert files to base64 data URLs for storage
    const filesWithUrls = await Promise.all(
      pendingFiles.map(async ({ file, tag }) => {
        return new Promise<{ url: string; tag: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({ url: reader.result as string, tag });
          };
          reader.readAsDataURL(file);
        });
      })
    );
    
    onImport(filesWithUrls);
    
    // Cleanup
    pendingFiles.forEach(f => URL.revokeObjectURL(f.preview));
    setPendingFiles([]);
    onClose();
  };

  const handleClose = () => {
    pendingFiles.forEach(f => URL.revokeObjectURL(f.preview));
    setPendingFiles([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wider">Importer des fichiers</h2>
          </div>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drop zone */}
        <div 
          className={`m-6 border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
            isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
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
          <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-1">Glissez-déposez vos images ici</p>
          <p className="text-xs text-gray-400">ou cliquez pour parcourir</p>
        </div>

        {/* Pending files preview */}
        {pendingFiles.length > 0 && (
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <div className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3">
              {pendingFiles.length} fichier{pendingFiles.length > 1 ? 's' : ''} sélectionné{pendingFiles.length > 1 ? 's' : ''}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {pendingFiles.map((item, index) => (
                <div key={index} className="relative group border border-gray-200 bg-gray-50">
                  <div className="aspect-square overflow-hidden">
                    <img src={item.preview} alt="" className="w-full h-full object-cover" />
                  </div>
                  
                  {/* Tag selector */}
                  <div className="p-2 border-t border-gray-200 bg-white">
                    <select
                      value={item.tag}
                      onChange={(e) => updateTag(index, e.target.value)}
                      className="w-full text-[10px] font-mono uppercase bg-gray-50 border border-gray-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {TAG_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Remove button */}
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleImport}
            disabled={pendingFiles.length === 0}
            className={`px-6 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
              pendingFiles.length > 0
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Importer
          </button>
        </div>
      </div>
    </div>
  );
}

// Color editor popup
function ColorEditorPopup({
  isOpen,
  onClose,
  colors,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  colors: string[];
  onSave: (colors: string[]) => void;
}) {
  const [editableColors, setEditableColors] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEditableColors([...colors]);
    }
  }, [isOpen, colors]);

  const addColor = () => {
    setEditableColors([...editableColors, '#808080']);
  };

  const updateColor = (index: number, value: string) => {
    const newColors = [...editableColors];
    newColors[index] = value;
    setEditableColors(newColors);
  };

  const removeColor = (index: number) => {
    setEditableColors(editableColors.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(editableColors.filter(c => /^#[0-9A-Fa-f]{6}$/.test(c)));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 w-full max-w-md max-h-[70vh] flex flex-col shadow-2xl border border-gray-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <h2 className="text-sm font-medium text-white uppercase tracking-wider">Modifier la palette</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Colors list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {editableColors.map((color, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded group">
              {/* Color preview & picker */}
              <div className="relative">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => updateColor(index, e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-10 h-10"
                />
                <div 
                  className="w-10 h-10 rounded-lg ring-2 ring-white/20 cursor-pointer" 
                  style={{ backgroundColor: color }} 
                />
              </div>
              
              {/* Hex input */}
              <input
                type="text"
                value={color}
                onChange={(e) => updateColor(index, e.target.value)}
                onFocus={() => setEditingIndex(index)}
                onBlur={() => setEditingIndex(null)}
                className={`flex-1 bg-transparent text-sm font-mono uppercase outline-none transition-colors ${
                  editingIndex === index ? 'text-white' : 'text-gray-400'
                }`}
                maxLength={7}
              />
              
              {/* Delete button */}
              <button
                onClick={() => removeColor(index)}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
          
          {/* Add color button */}
          <button
            onClick={addColor}
            className="w-full p-3 border-2 border-dashed border-gray-700 text-gray-500 hover:border-emerald-500 hover:text-emerald-400 transition-all flex items-center justify-center gap-2 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs font-mono uppercase">Ajouter une couleur</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" />
            </svg>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// Tag editor dropdown
function TagEditor({ 
  currentTag, 
  onTagChange, 
  position 
}: { 
  currentTag: string; 
  onTagChange: (tag: string) => void;
  position: { top: number; left: number };
}) {
  return (
    <div 
      className="fixed z-50 bg-white shadow-xl border border-gray-200 py-1 min-w-[160px]"
      style={{ top: position.top, left: position.left }}
    >
      {TAG_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onTagChange(opt.value)}
          className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors ${
            currentTag === opt.value ? 'bg-gray-50' : ''
          }`}
        >
          <div className={`w-3 h-3 rounded-sm ${opt.color.split(' ')[0]}`} />
          <span className="text-gray-700">{opt.label}</span>
          {currentTag === opt.value && (
            <svg className="w-3 h-3 ml-auto text-emerald-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}

export default function BentoGrid({ brandData, backgrounds = [], isGeneratingBackgrounds = false, onUpdate, onValidate, onAddSource, onBack }: { brandData: any, backgrounds?: string[], isGeneratingBackgrounds?: boolean, onUpdate: (data: any) => void, onValidate: () => void, onAddSource?: () => void, onBack?: () => void }) {
  const [localData, setLocalData] = useState(brandData);
  const [importPopupOpen, setImportPopupOpen] = useState(false);
  const [colorEditorOpen, setColorEditorOpen] = useState(false);
  const [tagEditorState, setTagEditorState] = useState<{ isOpen: boolean; imageIndex: number; position: { top: number; left: number } }>({
    isOpen: false,
    imageIndex: -1,
    position: { top: 0, left: 0 }
  });

  useEffect(() => {
    setLocalData(brandData);
  }, [brandData]);

  // Close tag editor when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (tagEditorState.isOpen) {
        setTagEditorState(prev => ({ ...prev, isOpen: false }));
      }
    };
    
    if (tagEditorState.isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [tagEditorState.isOpen]);

  const handleChange = (field: string, value: any) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onUpdate(newData);
  };

  const handleImportFiles = (files: { url: string; tag: string }[]) => {
    const newImages = [...(localData.images || []), ...files.map(f => f.url)];
    const newLabeledImages = [
      ...(localData.labeledImages || []),
      ...files.map(f => ({ url: f.url, category: f.tag }))
    ];
    
    const newData = { 
      ...localData, 
      images: newImages,
      labeledImages: newLabeledImages
    };
    setLocalData(newData);
    onUpdate(newData);
  };

  const handleTagChange = (imageIndex: number, newTag: string) => {
    const imageUrl = localData.images[imageIndex];
    const newLabeledImages = [...(localData.labeledImages || [])];
    
    const existingIndex = newLabeledImages.findIndex((li: any) => li.url === imageUrl);
    if (existingIndex >= 0) {
      newLabeledImages[existingIndex] = { url: imageUrl, category: newTag };
    } else {
      newLabeledImages.push({ url: imageUrl, category: newTag });
    }
    
    handleChange('labeledImages', newLabeledImages);
    setTagEditorState(prev => ({ ...prev, isOpen: false }));
  };

  const openTagEditor = (e: React.MouseEvent, imageIndex: number) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTagEditorState({
      isOpen: true,
      imageIndex,
      position: { top: rect.bottom + 4, left: rect.left }
    });
  };

  const handleSaveColors = (newColors: string[]) => {
    handleChange('colors', newColors);
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

  const getTagColor = (tag: string) => {
    return TAG_OPTIONS.find(t => t.value === tag)?.color || 'bg-gray-200 text-gray-600';
  };

  return (
    <div className="animate-fade-in w-full">
      {/* Import Popup */}
      <ImportPopup 
        isOpen={importPopupOpen}
        onClose={() => setImportPopupOpen(false)}
        onImport={handleImportFiles}
      />

      {/* Color Editor Popup */}
      <ColorEditorPopup
        isOpen={colorEditorOpen}
        onClose={() => setColorEditorOpen(false)}
        colors={localData.colors || []}
        onSave={handleSaveColors}
      />

      {/* Tag Editor */}
      {tagEditorState.isOpen && (
        <TagEditor
          currentTag={
            localData.labeledImages?.find((li: any) => li.url === localData.images[tagEditorState.imageIndex])?.category || 'other'
          }
          onTagChange={(tag) => handleTagChange(tagEditorState.imageIndex, tag)}
          position={tagEditorState.position}
        />
      )}

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

          {/* Colors - with edit button */}
          <div className="bg-gray-900 p-5 border border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Palette</span>
              <span className="ml-auto text-[10px] font-mono text-gray-600">{localData.colors?.length || 0}</span>
              <button
                onClick={() => setColorEditorOpen(true)}
                className="ml-2 p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-all"
                title="Modifier les couleurs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
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

          {/* Industry Insights - "Le saviez-vous?" */}
          {localData.industryInsights && localData.industryInsights.length > 0 && (
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">💡</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-600">Insights Industrie</span>
                {localData.industryInsights.some((i: any) => i.isRealData) && (
                  <span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-mono uppercase rounded-full">
                    ✓ Données réelles
                  </span>
                )}
              </div>
              
              <div className="space-y-3">
                {localData.industryInsights.slice(0, 4).map((insight: any, i: number) => (
                  <button 
                    key={i}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('use-template', { 
                        detail: { 
                          templateId: 'didyouknow', 
                          headline: insight.didYouKnow,
                          subheadline: insight.source ? `Source: ${insight.source}` : 'Source: Industry Report',
                          source: insight.isRealData ? 'industry_insight' : 'generated'
                        } 
                      }));
                    }}
                    className="w-full text-left p-3 bg-white/60 hover:bg-white transition-all border border-amber-200 hover:border-amber-400 group relative"
                  >
                    {/* Real data indicator */}
                    {insight.isRealData && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500" title="Données réelles" />
                    )}
                    
                    <div className="text-sm text-gray-800 font-medium leading-snug pr-4">
                      {insight.didYouKnow}
                    </div>
                    
                    {/* Relevance hint */}
                    {insight.relevance && (
                      <div className="text-[9px] text-amber-700/70 italic mt-1.5 line-clamp-1">
                        → {insight.relevance}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[9px] text-gray-400 font-mono flex items-center gap-1">
                        {insight.isRealData && <span className="text-emerald-500">●</span>}
                        {insight.source || 'Industry Report'}
                      </span>
                      <span className="text-[9px] text-amber-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Utiliser →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Sources list */}
              {localData.industrySources && localData.industrySources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-amber-200/50">
                  <div className="text-[8px] font-mono uppercase text-amber-600/60 mb-2">Sources consultées</div>
                  <div className="flex flex-wrap gap-1">
                    {localData.industrySources.slice(0, 4).map((source: any, i: number) => (
                      <a 
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[8px] text-gray-500 hover:text-amber-600 truncate max-w-[150px]"
                        title={source.title}
                      >
                        {source.title?.slice(0, 30)}...
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Suggested Post Templates - Enhanced */}
          {localData.suggestedPosts && localData.suggestedPosts.length > 0 && (
            <div className="relative bg-gray-900 p-6 border border-gray-800">
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-emerald-500" />
              
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">Posts suggérés</span>
                <span className="ml-auto text-[10px] text-gray-500">Cliquez pour générer</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto no-scrollbar">
                {localData.suggestedPosts.slice(0, 8).map((post: any, i: number) => {
                  const templateIcons: Record<string, string> = {
                    stat: '📊',
                    announcement: '📢',
                    quote: '💬',
                    event: '🎤',
                    expert: '👤',
                    product: '✨',
                    didyouknow: '💡'
                  };
                  const sourceColors: Record<string, string> = {
                    real_data: 'bg-emerald-500',
                    industry_insight: 'bg-amber-500',
                    generated: 'bg-gray-500'
                  };
                  const sourceLabels: Record<string, string> = {
                    real_data: 'Données réelles',
                    industry_insight: 'Insight industrie',
                    generated: 'Suggestion'
                  };
                  
                  const icon = templateIcons[post.templateId] || '📝';
                  const displayText = post.headline || (post.metric ? `${post.metric} ${post.metricLabel || ''}` : 'Post');
                  const sourceColor = sourceColors[post.source] || 'bg-gray-500';
                  const sourceLabel = sourceLabels[post.source] || 'Suggestion';
                  
                  return (
                    <button 
                      key={i} 
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('use-template', { 
                          detail: { templateId: post.templateId, ...post } 
                        }));
                      }}
                      className="group p-4 bg-white/5 hover:bg-emerald-500/20 transition-all text-left border border-transparent hover:border-emerald-500/50 relative"
                      title={post.intent || ''}
                    >
                      {/* Source indicator */}
                      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${sourceColor}`} title={sourceLabel} />
                      
                      <div className="text-2xl mb-2">{icon}</div>
                      <div className="text-xs uppercase text-gray-500 mb-1 font-mono tracking-wider">
                        {post.templateId}
                      </div>
                      <div className="text-white text-sm font-medium line-clamp-2 mb-2">
                        {displayText}
                      </div>
                      
                      {/* Intent tooltip on hover */}
                      {post.intent && (
                        <div className="text-[9px] text-gray-400 italic line-clamp-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          {post.intent}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-800">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[8px] text-gray-500 font-mono">Données réelles</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[8px] text-gray-500 font-mono">Insight industrie</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                  <span className="text-[8px] text-gray-500 font-mono">Généré</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Content Nuggets - Real data extracted */}
          {localData.contentNuggets && (
            (localData.contentNuggets.realStats?.length > 0 || 
             localData.contentNuggets.testimonials?.length > 0 ||
             localData.contentNuggets.achievements?.length > 0) && (
            <div className="bg-white border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🔍</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Données extraites du site</span>
              </div>
              
              {/* Real Stats */}
              {localData.contentNuggets.realStats?.length > 0 && (
                <div className="mb-4">
                  <span className="text-[9px] font-mono text-emerald-600 uppercase tracking-wider block mb-2">Statistiques trouvées</span>
                  <div className="flex flex-wrap gap-2">
                    {localData.contentNuggets.realStats.slice(0, 5).map((stat: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('use-template', { 
                            detail: { templateId: 'stat', headline: stat, source: 'real_data' } 
                          }));
                        }}
                        className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        📊 {stat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Testimonials */}
              {localData.contentNuggets.testimonials?.length > 0 && (
                <div className="mb-4">
                  <span className="text-[9px] font-mono text-blue-600 uppercase tracking-wider block mb-2">Témoignages clients</span>
                  <div className="space-y-2">
                    {localData.contentNuggets.testimonials.slice(0, 3).map((t: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('use-template', { 
                            detail: { 
                              templateId: 'quote', 
                              headline: t.quote,
                              subheadline: t.author ? `— ${t.author}${t.company ? `, ${t.company}` : ''}` : undefined,
                              source: 'real_data'
                            } 
                          }));
                        }}
                        className="w-full text-left p-2 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <div className="text-xs text-gray-700 italic line-clamp-2">"{t.quote}"</div>
                        {t.author && (
                          <div className="text-[9px] text-gray-500 mt-1">— {t.author}{t.company ? `, ${t.company}` : ''}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Achievements */}
              {localData.contentNuggets.achievements?.length > 0 && (
                <div>
                  <span className="text-[9px] font-mono text-amber-600 uppercase tracking-wider block mb-2">Distinctions</span>
                  <div className="flex flex-wrap gap-2">
                    {localData.contentNuggets.achievements.slice(0, 4).map((achievement: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-medium">
                        🏆 {achievement}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Fallback: Old Marketing Angles (backwards compatibility) */}
          {!localData.suggestedPosts?.length && localData.marketingAngles?.length > 0 && (
            <div className="relative bg-gray-900 p-6 border border-gray-800">
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-emerald-500" />
              
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">Creative Angles</span>
              </div>
              
              <div className="space-y-3 max-h-[200px] overflow-y-auto no-scrollbar">
                {localData.marketingAngles.slice(0, 4).map((angle: any, i: number) => (
                  <div key={i} className="group p-3 bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-white text-sm truncate block">{angle.title || angle.hook || 'Angle'}</span>
                        <p className="text-gray-400 text-[11px] line-clamp-2 mt-1">{angle.concept || angle.hook || ''}</p>
                      </div>
                      <button 
                        className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-emerald-500 text-white text-[9px] font-medium flex-shrink-0"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('use-angle', { detail: angle.concept || angle.title }));
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
                onClick={() => setImportPopupOpen(true)}
                className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-medium uppercase tracking-wider hover:bg-emerald-600 transition-colors flex items-center gap-1"
              >
                <span>+</span> Ajouter
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
              <div className="columns-2 gap-3 space-y-3">
                {localData.images?.map((img: string, i: number) => {
                  const labelObj = localData.labeledImages?.find((li: any) => li.url === img);
                  const label = labelObj?.category || (img === localData.logo ? 'main_logo' : 'other');
                  
                  return (
                    <div key={i} className="break-inside-avoid overflow-hidden relative group border border-gray-200 hover:border-gray-400 transition-all">
                      {/* Tag badge - clickable to edit */}
                      <button
                        onClick={(e) => openTagEditor(e, i)}
                        className={`absolute top-2 left-2 z-10 text-[8px] font-mono uppercase px-1.5 py-0.5 ${getTagColor(label)} hover:ring-2 hover:ring-white/50 transition-all`}
                      >
                        {TAG_OPTIONS.find(t => t.value === label)?.label || label.replace('_', ' ')}
                      </button>
                      
                      <img src={img} className="w-full h-auto" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} loading="lazy" />
                      
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => window.open(img, '_blank')} className="w-8 h-8 bg-white text-gray-900 flex items-center justify-center hover:scale-110 transition-transform text-sm">👁</button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openTagEditor(e, i);
                          }} 
                          className="w-8 h-8 bg-amber-500 text-white flex items-center justify-center hover:scale-110 transition-transform text-sm"
                          title="Modifier le tag"
                        >
                          🏷️
                        </button>
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
