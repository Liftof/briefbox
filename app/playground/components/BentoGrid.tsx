'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Tag options
const TAG_OPTIONS = [
  { value: 'main_logo', label: 'Logo', color: 'bg-gray-900 text-white' },
  { value: 'product', label: 'Produit', color: 'bg-emerald-500 text-white' },
  { value: 'app_ui', label: 'App/UI', color: 'bg-purple-500 text-white' },
  { value: 'reference', label: 'Visuel de référence', color: 'bg-amber-500 text-white' },
  { value: 'team', label: 'Équipe', color: 'bg-blue-500 text-white' },
  { value: 'lifestyle', label: 'Lifestyle', color: 'bg-pink-500 text-white' },
  { value: 'other', label: 'Autre', color: 'bg-gray-200 text-gray-600' },
];

// Checker pattern style for transparent/white images (like Photoshop)
const CHECKER_PATTERN_STYLE: React.CSSProperties = {
  backgroundImage: `
    linear-gradient(45deg, #e5e5e5 25%, transparent 25%),
    linear-gradient(-45deg, #e5e5e5 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e5e5e5 75%),
    linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)
  `,
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
  backgroundColor: '#fafafa'
};

// Edit button component for consistency
function EditButton({ onClick, title }: { onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all"
      title={title || 'Modifier'}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  );
}

// Import popup component
function ImportPopup({ isOpen, onClose, onImport, forReferences = false }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onImport: (files: { url: string; tag: string }[]) => void;
  forReferences?: boolean;
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
    const filesWithUrls = await Promise.all(
      pendingFiles.map(async ({ file, tag }) => {
        return new Promise<{ url: string; tag: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ url: reader.result as string, tag });
          reader.readAsDataURL(file);
        });
      })
    );
    onImport(filesWithUrls);
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
      <div className={`bg-white w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border ${forReferences ? 'border-purple-300' : 'border-gray-200'}`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${forReferences ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-fuchsia-50' : 'border-gray-200'}`}>
          <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${forReferences ? 'bg-purple-500' : 'bg-emerald-500'}`} />
            {forReferences ? '🎨 Importer des visuels de référence' : 'Importer des fichiers'}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-900">×</button>
        </div>
        
        {/* Info banner for reference imports */}
        {forReferences && (
          <div className="mx-6 mt-4 p-3 bg-purple-50 border border-purple-200 text-xs text-purple-700">
            <strong>Ces visuels guideront le style de vos créations :</strong> couleurs, composition, ambiance. 
            Ils seront automatiquement tagués "Visuel de référence".
          </div>
        )}

        <div 
          className={`m-6 border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
            isDragging 
              ? (forReferences ? 'border-purple-500 bg-purple-50' : 'border-emerald-500 bg-emerald-50') 
              : 'border-gray-300 hover:border-gray-400'
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
          <p className="text-sm text-gray-600">Glissez-déposez vos images ici</p>
          <p className="text-xs text-gray-400">ou cliquez pour parcourir</p>
        </div>

        {pendingFiles.length > 0 && (
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <div className="grid grid-cols-3 gap-3">
              {pendingFiles.map((item, index) => (
                <div key={index} className={`relative group border ${forReferences ? 'border-purple-200' : 'border-gray-200'}`}>
                  <div 
                    className="aspect-square overflow-hidden"
                    style={CHECKER_PATTERN_STYLE}
                  >
                    <img src={item.preview} alt="" className="w-full h-full object-contain relative z-10" />
                  </div>
                  {/* Hide tag selector if importing for references (auto-tagged) */}
                  {!forReferences && (
                    <div className="p-2 border-t border-gray-200 bg-white">
                      <select
                        value={item.tag}
                        onChange={(e) => updateTag(index, e.target.value)}
                        className="w-full text-[10px] font-mono uppercase bg-gray-50 border border-gray-200 px-2 py-1.5"
                      >
                        {TAG_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {forReferences && (
                    <div className="p-2 border-t border-purple-100 bg-purple-50">
                      <span className="text-[10px] font-mono uppercase text-purple-600">🎨 Référence</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  >×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`px-6 py-4 border-t flex items-center justify-between ${forReferences ? 'border-purple-200 bg-purple-50/50' : 'border-gray-200 bg-gray-50'}`}>
          <button onClick={handleClose} className="px-4 py-2 text-sm text-gray-600">Annuler</button>
          <button
            onClick={handleImport}
            disabled={pendingFiles.length === 0}
            className={`px-6 py-2 text-sm font-medium ${
              pendingFiles.length > 0 
                ? (forReferences ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-emerald-500 text-white hover:bg-emerald-600') 
                : 'bg-gray-200 text-gray-400'
            }`}
          >Importer {pendingFiles.length > 0 && `(${pendingFiles.length})`}</button>
        </div>
      </div>
    </div>
  );
}

// Color editor popup
function ColorEditorPopup({ isOpen, onClose, colors, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  colors: string[];
  onSave: (colors: string[]) => void;
}) {
  const [editableColors, setEditableColors] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) setEditableColors([...colors]);
  }, [isOpen, colors]);

  const addColor = () => setEditableColors([...editableColors, '#808080']);
  const updateColor = (index: number, value: string) => {
    const newColors = [...editableColors];
    newColors[index] = value;
    setEditableColors(newColors);
  };
  const removeColor = (index: number) => setEditableColors(editableColors.filter((_, i) => i !== index));

  const handleSave = () => {
    onSave(editableColors.filter(c => /^#[0-9A-Fa-f]{6}$/.test(c)));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 w-full max-w-md max-h-[70vh] flex flex-col shadow-2xl border border-gray-800">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            Modifier la palette
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {editableColors.map((color, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded group">
              <div className="relative">
                <input type="color" value={color} onChange={(e) => updateColor(index, e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-10 h-10" />
                <div className="w-10 h-10 rounded-lg ring-2 ring-white/20" style={{ backgroundColor: color }} />
              </div>
              <input
                type="text"
                value={color}
                onChange={(e) => updateColor(index, e.target.value)}
                className="flex-1 bg-transparent text-sm font-mono uppercase outline-none text-gray-400 focus:text-white"
                maxLength={7}
              />
              <button onClick={() => removeColor(index)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
            </div>
          ))}
          <button onClick={addColor} className="w-full p-3 border-2 border-dashed border-gray-700 text-gray-500 hover:border-emerald-500 hover:text-emerald-400 transition-all flex items-center justify-center gap-2 rounded">
            + Ajouter une couleur
          </button>
        </div>

        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400">Annuler</button>
          <button onClick={handleSave} className="px-6 py-2 bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

// Tag editor dropdown
function TagEditor({ currentTag, onTagChange, position }: { 
  currentTag: string; 
  onTagChange: (tag: string) => void;
  position: { top: number; left: number };
}) {
  return (
    <div className="fixed z-50 bg-white shadow-xl border border-gray-200 py-1 min-w-[160px]" style={{ top: position.top, left: position.left }}>
      {TAG_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onTagChange(opt.value)}
          className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-gray-50 ${currentTag === opt.value ? 'bg-gray-50' : ''}`}
        >
          <div className={`w-3 h-3 rounded-sm ${opt.color.split(' ')[0]}`} />
          <span className="text-gray-700">{opt.label}</span>
          {currentTag === opt.value && <span className="ml-auto text-emerald-500">✓</span>}
        </button>
      ))}
    </div>
  );
}

// Simple inline add input
function AddItemInput({ placeholder, onAdd }: { placeholder: string, onAdd: (value: string) => void }) {
  const [value, setValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isAdding) {
    return (
      <button 
        onClick={() => setIsAdding(true)}
        className="w-full py-2 mt-2 text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-200 hover:border-gray-300 flex items-center justify-center gap-1 transition-all"
      >
        <span>+</span> Ajouter
      </button>
    );
  }

  return (
    <div className="mt-2 flex gap-2">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            onAdd(value.trim());
            setValue('');
            setIsAdding(false);
          } else if (e.key === 'Escape') {
            setIsAdding(false);
          }
        }}
        placeholder={placeholder}
        className="flex-1 px-2 py-1 text-xs border border-gray-300 outline-none focus:border-gray-500"
      />
      <button 
        onClick={() => {
          if (value.trim()) onAdd(value.trim());
          setValue('');
          setIsAdding(false);
        }}
        className="px-2 py-1 bg-gray-900 text-white text-xs"
      >
        OK
      </button>
    </div>
  );
}

export default function BentoGrid({ brandData, backgrounds = [], isGeneratingBackgrounds = false, onUpdate, onValidate, onAddSource, onBack }: { 
  brandData: any, 
  backgrounds?: string[], 
  isGeneratingBackgrounds?: boolean, 
  onUpdate: (data: any) => void, 
  onValidate: () => void, 
  onAddSource?: () => void, 
  onBack?: () => void 
}) {
  const [localData, setLocalData] = useState(brandData);
  const [importPopupOpen, setImportPopupOpen] = useState(false);
  const [importForReferences, setImportForReferences] = useState(false); // NEW: Track if importing for reference visuals
  const [colorEditorOpen, setColorEditorOpen] = useState(false);
  const [logoSelectorOpen, setLogoSelectorOpen] = useState(false);
  const [tagEditorState, setTagEditorState] = useState<{ isOpen: boolean; imageIndex: number; position: { top: number; left: number } }>({
    isOpen: false, imageIndex: -1, position: { top: 0, left: 0 }
  });

  useEffect(() => { setLocalData(brandData); }, [brandData]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (tagEditorState.isOpen) setTagEditorState(prev => ({ ...prev, isOpen: false }));
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
  
  // Open import popup - optionally for references
  const openImportPopup = (forReferences: boolean = false) => {
    setImportForReferences(forReferences);
    setImportPopupOpen(true);
  };

  const handleImportFiles = (files: { url: string; tag: string }[]) => {
    // If importing for references, force all tags to 'reference'
    const processedFiles = importForReferences 
      ? files.map(f => ({ ...f, tag: 'reference' }))
      : files;
    
    const newImages = [...(localData.images || []), ...processedFiles.map(f => f.url)];
    const newLabeledImages = [...(localData.labeledImages || []), ...processedFiles.map(f => ({ url: f.url, category: f.tag }))];
    const newData = { ...localData, images: newImages, labeledImages: newLabeledImages };
    setLocalData(newData);
    onUpdate(newData);
    
    // Reset the import mode
    setImportForReferences(false);
  };

  const handleTagChange = (imageIndex: number, newTag: string) => {
    const imageUrl = localData.images[imageIndex];
    const newLabeledImages = [...(localData.labeledImages || [])];
    const existingIndex = newLabeledImages.findIndex((li: any) => li.url === imageUrl);
    if (existingIndex >= 0) newLabeledImages[existingIndex] = { url: imageUrl, category: newTag };
    else newLabeledImages.push({ url: imageUrl, category: newTag });
    handleChange('labeledImages', newLabeledImages);
    setTagEditorState(prev => ({ ...prev, isOpen: false }));
  };

  const openTagEditor = (e: React.MouseEvent, imageIndex: number) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTagEditorState({ isOpen: true, imageIndex, position: { top: rect.bottom + 4, left: rect.left } });
  };

  const handleLogoChange = (newLogoUrl: string) => {
    handleChange('logo', newLogoUrl);
    const newLabeledImages = (localData.labeledImages || []).map((li: any) => {
      if (li.url === localData.logo) return { ...li, category: 'other' };
      if (li.url === newLogoUrl) return { ...li, category: 'main_logo' };
      return li;
    });
    handleChange('labeledImages', newLabeledImages);
    setLogoSelectorOpen(false);
  };

  const logoBgColor = localData.colors?.[0] || '#F5F0EA';
  const isDark = (color: string) => {
    if (!color?.startsWith('#')) return false;
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return ((r * 299) + (g * 587) + (b * 114)) / 1000 < 50;
  };
  const isLight = (color: string) => {
    if (!color?.startsWith('#')) return true;
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return ((r * 299) + (g * 587) + (b * 114)) / 1000 > 200;
  };
  const finalLogoBg = isDark(logoBgColor) ? '#FFFFFF' : isLight(logoBgColor) ? '#1a1a1a' : logoBgColor;

  const getTagColor = (tag: string) => TAG_OPTIONS.find(t => t.value === tag)?.color || 'bg-gray-200 text-gray-600';

  // Get non-reference images for asset library
  const assetImages = localData.images?.filter((img: string) => {
    const labelObj = localData.labeledImages?.find((li: any) => li.url === img);
    return labelObj?.category !== 'reference';
  }) || [];

  return (
    <div className="animate-fade-in w-full max-w-6xl mx-auto">
      {/* Popups */}
      <ImportPopup 
        isOpen={importPopupOpen} 
        onClose={() => { setImportPopupOpen(false); setImportForReferences(false); }} 
        onImport={handleImportFiles}
        forReferences={importForReferences}
      />
      <ColorEditorPopup isOpen={colorEditorOpen} onClose={() => setColorEditorOpen(false)} colors={localData.colors || []} onSave={(colors) => handleChange('colors', colors)} />
      {tagEditorState.isOpen && (
        <TagEditor
          currentTag={localData.labeledImages?.find((li: any) => li.url === localData.images[tagEditorState.imageIndex])?.category || 'other'}
          onTagChange={(tag) => handleTagChange(tagEditorState.imageIndex, tag)}
          position={tagEditorState.position}
        />
      )}

      {/* Logo Selector */}
      {logoSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg max-h-[70vh] flex flex-col shadow-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wider">Changer le logo</h2>
              <button onClick={() => setLogoSelectorOpen(false)} className="text-gray-400 hover:text-gray-900">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-3 gap-3">
                {localData.images?.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleLogoChange(img)}
                    className={`aspect-square border-2 overflow-hidden transition-all hover:border-emerald-500 ${img === localData.logo ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200'}`}
                    style={CHECKER_PATTERN_STYLE}
                  >
                    <img src={img} className="w-full h-full object-contain relative z-10" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header - Simple */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="w-10 h-10 flex items-center justify-center border border-gray-200 hover:border-gray-900">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h2 className="text-2xl font-light text-gray-900">{localData.name || 'Brand Identity'}</h2>
            <a href={localData.url} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-gray-400 hover:text-gray-900">
              {localData.url} ↗
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Brand Identity
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SECTION 1: BRAND IDENTITY & DIRECTION ARTISTIQUE
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-2 h-2 bg-gray-900 rounded-full" />
          <h3 className="text-lg font-semibold text-gray-900">Identité & Direction Artistique</h3>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Logo */}
          <div className="col-span-3">
            <button 
              onClick={() => setLogoSelectorOpen(true)}
              className="w-full aspect-square p-4 flex items-center justify-center border border-gray-200 transition-all hover:border-emerald-500 relative group overflow-hidden"
              style={CHECKER_PATTERN_STYLE}
            >
              {localData.logo ? (
                <img src={localData.logo} alt="Logo" className="w-full h-full object-contain relative z-10" />
              ) : (
                <span className="text-3xl text-gray-300 relative z-10">LOGO</span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                <span className="text-white text-xs font-medium flex items-center gap-1">
                  <span className="text-emerald-400">✎</span> Changer
                </span>
              </div>
            </button>
          </div>

          {/* Colors */}
          <div className="col-span-3 bg-gray-900 p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Palette</span>
              <EditButton onClick={() => setColorEditorOpen(true)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {localData.colors?.slice(0, 6).map((color: string, i: number) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded">
                  <div className="w-4 h-4 rounded-full ring-1 ring-white/10" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-mono text-gray-400">{color}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fonts - Show ALL fonts */}
          <div className="col-span-3 bg-white border border-gray-200 p-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block mb-3">Typographies</span>
            <div className="space-y-2">
              {localData.fonts?.map((font: string, i: number) => (
                <div key={i} className={`flex items-center gap-2 ${i === 0 ? '' : 'opacity-60'}`}>
                  {i === 0 && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                  <span className={`text-sm ${i === 0 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>{font}</span>
                  {i === 0 && <span className="text-[8px] text-emerald-600 font-mono uppercase ml-auto">principale</span>}
                </div>
              )) || <span className="text-sm text-gray-400">Sans-serif</span>}
            </div>
          </div>
            
          {/* Tagline */}
          <div className="col-span-3 bg-white border border-gray-200 p-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block mb-3">Tagline</span>
              <textarea 
                value={localData.tagline || ''}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-gray-900 resize-none h-16 leading-relaxed placeholder:text-gray-300"
              placeholder="Slogan..."
              />
          </div>

          {/* STRATEGIE DE MARQUE - New Block */}
          <div className="col-span-6 bg-white border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Stratégie & Cible</span>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider block mb-1">🎯 Cible (Target Audience)</span>
                <textarea 
                  value={localData.targetAudience || ''}
                  onChange={(e) => handleChange('targetAudience', e.target.value)}
                  className="w-full bg-emerald-50/50 border-b border-emerald-100 p-2 outline-none text-sm text-gray-700 resize-none h-14 leading-relaxed placeholder:text-gray-300"
                  placeholder="Qui sont vos clients idéaux ?"
                />
              </div>
              <div>
                <span className="text-[9px] text-amber-600 font-bold uppercase tracking-wider block mb-1">⚡ Promesse (Unique Value Prop)</span>
                <textarea 
                  value={localData.uniqueValueProposition || ''}
                  onChange={(e) => handleChange('uniqueValueProposition', e.target.value)}
                  className="w-full bg-amber-50/50 border-b border-amber-100 p-2 outline-none text-sm text-gray-700 resize-none h-14 leading-relaxed placeholder:text-gray-300"
                  placeholder="Quelle est votre promesse unique ?"
                />
              </div>
            </div>
          </div>

          {/* Storytelling */}
          <div className="col-span-6 bg-white border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Brand Story</span>
            </div>
            <div className="h-full">
              <span className="text-[9px] text-purple-600 font-bold uppercase tracking-wider block mb-1">📖 Notre Histoire</span>
              <textarea 
                value={localData.brandStory || ''}
                onChange={(e) => handleChange('brandStory', e.target.value)}
                className="w-full bg-purple-50/50 border-b border-purple-100 p-2 outline-none text-sm text-gray-700 resize-none h-32 leading-relaxed placeholder:text-gray-300"
                placeholder="Racontez l'histoire de votre marque..."
              />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════
            SECTION 2: DONNÉES & INSIGHTS (NEW)
            ═══════════════════════════════════════════════════════════════════════════ */}
        <section className="mt-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            <h3 className="text-lg font-semibold text-gray-900">Données & Insights</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Chiffres clés */}
            <div className="bg-white border border-gray-200 p-4">
               <div className="flex items-center justify-between mb-3">
                 <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Chiffres clés</span>
                 <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 font-bold rounded">
                   {localData.contentNuggets?.realStats?.length || 0}
                 </span>
               </div>
               <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                 {localData.contentNuggets?.realStats?.length > 0 ? (
                   localData.contentNuggets.realStats.map((stat: string, i: number) => (
                     <div key={i} className="group relative p-2 bg-gray-50 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all rounded">
                       <p className="text-xs text-gray-700 leading-relaxed">{stat}</p>
                       <button 
                         onClick={() => {
                            const newStats = [...localData.contentNuggets.realStats];
                            newStats.splice(i, 1);
                            const newNuggets = { ...localData.contentNuggets, realStats: newStats };
                            handleChange('contentNuggets', newNuggets);
                         }}
                         className="absolute top-1 right-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                       </button>
                     </div>
                   ))
                 ) : (
                   <div className="text-center py-8 text-gray-300 text-xs">Aucun chiffre trouvé</div>
                 )}
               </div>
               <AddItemInput 
                 placeholder="Ex: +40% de croissance" 
                 onAdd={(val) => {
                   const newNuggets = { 
                     ...localData.contentNuggets, 
                     realStats: [...(localData.contentNuggets?.realStats || []), val] 
                   };
                   handleChange('contentNuggets', newNuggets);
                 }}
               />
            </div>

            {/* Témoignages */}
            <div className="bg-white border border-gray-200 p-4">
               <div className="flex items-center justify-between mb-3">
                 <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Témoignages</span>
                 <span className="bg-purple-100 text-purple-700 text-[9px] px-1.5 py-0.5 font-bold rounded">
                   {localData.contentNuggets?.testimonials?.length || 0}
                 </span>
               </div>
               <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                 {localData.contentNuggets?.testimonials?.length > 0 ? (
                   localData.contentNuggets.testimonials.map((t: any, i: number) => (
                     <div key={i} className="group relative p-2 bg-gray-50 hover:bg-purple-50 border border-transparent hover:border-purple-100 transition-all rounded">
                       <p className="text-xs text-gray-600 italic mb-1">"{t.quote?.slice(0, 80)}{t.quote?.length > 80 ? '...' : ''}"</p>
                       <p className="text-[10px] text-gray-900 font-medium">— {t.author || 'Anonyme'} {t.company ? `(${t.company})` : ''}</p>
                       <button 
                         onClick={() => {
                            const newTestimonials = [...localData.contentNuggets.testimonials];
                            newTestimonials.splice(i, 1);
                            const newNuggets = { ...localData.contentNuggets, testimonials: newTestimonials };
                            handleChange('contentNuggets', newNuggets);
                         }}
                         className="absolute top-1 right-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                       </button>
                     </div>
                   ))
                 ) : (
                   <div className="text-center py-8 text-gray-300 text-xs">Aucun témoignage trouvé</div>
                 )}
               </div>
               <AddItemInput 
                 placeholder="'Citation' - Auteur" 
                 onAdd={(val) => {
                   // Basic parsing: "Quote" - Author
                   const lastDash = val.lastIndexOf('-');
                   let quote, author;
                   
                   if (lastDash > 0) {
                     quote = val.substring(0, lastDash).trim().replace(/^["']|["']$/g, '');
                     author = val.substring(lastDash + 1).trim();
                   } else {
                     quote = val;
                     author = 'Client';
                   }
                   
                   const newNuggets = { 
                     ...localData.contentNuggets, 
                     testimonials: [...(localData.contentNuggets?.testimonials || []), { quote, author, company: '' }] 
                   };
                   handleChange('contentNuggets', newNuggets);
                 }}
               />
            </div>

            {/* Industry Insights */}
            <div className="bg-white border border-gray-200 p-4">
               <div className="flex items-center justify-between mb-3">
                 <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Infos Marché</span>
                 <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 font-bold rounded">
                   {localData.industryInsights?.length || 0}
                 </span>
               </div>
               <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                 {localData.industryInsights?.length > 0 ? (
                   localData.industryInsights.map((insight: any, i: number) => (
                     <div key={i} className="group relative p-2 bg-gray-50 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all rounded">
                       <p className="text-xs text-gray-800 font-medium mb-1">{insight.fact}</p>
                       <p className="text-[10px] text-gray-500 leading-tight">{insight.didYouKnow}</p>
                       {insight.source && <p className="text-[9px] text-amber-600 mt-1">Src: {insight.source}</p>}
                       <button 
                         onClick={() => {
                            const newInsights = [...localData.industryInsights];
                            newInsights.splice(i, 1);
                            handleChange('industryInsights', newInsights);
                         }}
                         className="absolute top-1 right-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                       </button>
                     </div>
                   ))
                 ) : (
                   <div className="text-center py-8 text-gray-300 text-xs">Aucune info marché</div>
                 )}
               </div>
               <AddItemInput 
                 placeholder="Fait marquant..." 
                 onAdd={(val) => {
                   const newInsights = [...(localData.industryInsights || []), { fact: val, didYouKnow: `Le saviez-vous ? ${val}`, source: 'Manuel' }];
                   handleChange('industryInsights', newInsights);
                 }}
               />
            </div>
          </div>
        </section>

        {/* Asset Library - Expanded with grid view */}
        <div className="mt-4 bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                Bibliothèque d'assets
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                {assetImages.length || 0} images
              </span>
              {/* Crawl stats indicator */}
              {localData._crawlStats && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-mono">
                  {localData._crawlStats.pagesScraped || 0} pages crawlées
                </span>
              )}
            </div>
            <button 
              onClick={() => openImportPopup(false)}
              className="px-2 py-1 bg-emerald-500 text-white text-[9px] font-medium uppercase hover:bg-emerald-600 flex items-center gap-1"
            >
              <span>+</span> Ajouter
            </button>
          </div>
          
          {/* Grid view for all images - responsive */}
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-[200px] overflow-y-auto no-scrollbar">
            {assetImages.map((img: string, i: number) => {
              const labelObj = localData.labeledImages?.find((li: any) => li.url === img);
              const label = labelObj?.category || 'other';
              const originalIndex = localData.images?.indexOf(img);
              return (
                <div key={i} className="relative aspect-square group" style={CHECKER_PATTERN_STYLE}>
                  <img 
                    src={img} 
                    className="w-full h-full object-contain border border-gray-200 hover:border-emerald-400 transition-colors relative z-10" 
                    loading="lazy" 
                    onError={(e) => {
                      // Hide broken images
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    onClick={(e) => openTagEditor(e, originalIndex)}
                    className={`absolute top-0.5 left-0.5 text-[6px] font-mono uppercase px-0.5 py-0.5 leading-none ${getTagColor(label)} opacity-0 group-hover:opacity-100 transition-opacity`}
                  >
                    {TAG_OPTIONS.find(t => t.value === label)?.label.slice(0, 4) || '...'}
                  </button>
                  <button 
                    onClick={() => handleChange('images', localData.images.filter((_: any, idx: number) => idx !== originalIndex))} 
                    className="absolute top-0.5 right-0.5 w-3 h-3 bg-red-500 text-white flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                  >×</button>
                </div>
              );
            })}
          </div>
          
          {/* No images hint */}
          {assetImages.length === 0 && (
            <div className="text-center py-6 bg-gray-50 border border-dashed border-gray-200">
              <span className="text-gray-400 text-sm">Aucune image trouvée</span>
              <p className="text-[10px] text-gray-300 mt-1">Ajoutez des images ou vérifiez l'URL du site</p>
            </div>
          )}
          
          {/* Image count by category */}
          {assetImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {(() => {
                const categoryCounts: Record<string, number> = {};
                assetImages.forEach((img: string) => {
                  const labelObj = localData.labeledImages?.find((li: any) => li.url === img);
                  const cat = labelObj?.category || 'other';
                  categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                });
                return Object.entries(categoryCounts).map(([cat, count]) => (
                  <span key={cat} className={`text-[9px] px-1.5 py-0.5 ${getTagColor(cat)}`}>
                    {TAG_OPTIONS.find(t => t.value === cat)?.label || cat}: {count}
                  </span>
                ));
              })()}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SECTION 3: ACTION - VALIDER & CRÉER
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="border-t border-gray-200 pt-6">
        <button 
          onClick={onValidate}
          className="w-full group relative py-4 bg-gray-900 text-white text-sm font-medium transition-all hover:bg-black"
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            Valider & Créer
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </section>
    </div>
  );
}