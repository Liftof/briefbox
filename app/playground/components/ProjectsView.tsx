'use client';

import { useState, useEffect } from 'react';

// Types for generations and folders
export interface GenerationFeedback {
  rating: 1 | 2 | 3; // 1=bad, 2=ok, 3=good
  comment?: string;
  timestamp: string;
}

export interface Generation {
  id: string;
  url: string;
  prompt?: string;
  templateId?: string;
  brandName?: string;
  createdAt: string;
  folderId?: string;
  feedback?: GenerationFeedback;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

// LocalStorage keys
const GENERATIONS_KEY = 'palette_generations';
const FOLDERS_KEY = 'palette_folders';
const FEEDBACK_PATTERNS_KEY = 'palette_feedback_patterns';

// Feedback patterns for learning
export interface FeedbackPatterns {
  likedStyles: string[];      // Styles/templates user rates highly
  dislikedStyles: string[];   // Styles user rates poorly
  likedKeywords: string[];    // Keywords from highly rated prompts
  dislikedKeywords: string[]; // Keywords from poorly rated prompts
  avgRatingByTemplate: Record<string, { total: number; count: number }>;
  lastUpdated: string;
}

// Load/save feedback patterns
export const loadFeedbackPatterns = (): FeedbackPatterns => {
  if (typeof window === 'undefined') return getDefaultPatterns();
  try {
    const data = localStorage.getItem(FEEDBACK_PATTERNS_KEY);
    return data ? JSON.parse(data) : getDefaultPatterns();
  } catch {
    return getDefaultPatterns();
  }
};

const getDefaultPatterns = (): FeedbackPatterns => ({
  likedStyles: [],
  dislikedStyles: [],
  likedKeywords: [],
  dislikedKeywords: [],
  avgRatingByTemplate: {},
  lastUpdated: new Date().toISOString()
});

const saveFeedbackPatterns = (patterns: FeedbackPatterns) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FEEDBACK_PATTERNS_KEY, JSON.stringify(patterns));
};

// Update feedback patterns when user rates
const updateFeedbackPatterns = (generation: Generation, rating: 1 | 2 | 3, comment?: string) => {
  const patterns = loadFeedbackPatterns();
  
  // Extract keywords from prompt
  const promptKeywords = generation.prompt 
    ? generation.prompt.toLowerCase().split(/\s+/).filter(w => w.length > 4)
    : [];
  
  const templateId = generation.templateId || 'unknown';
  
  // Update template averages
  if (!patterns.avgRatingByTemplate[templateId]) {
    patterns.avgRatingByTemplate[templateId] = { total: 0, count: 0 };
  }
  patterns.avgRatingByTemplate[templateId].total += rating;
  patterns.avgRatingByTemplate[templateId].count += 1;
  
  // Learn from ratings
  if (rating === 3) {
    // User loved it - learn from this
    if (templateId && !patterns.likedStyles.includes(templateId)) {
      patterns.likedStyles.push(templateId);
    }
    // Remove from disliked if present
    patterns.dislikedStyles = patterns.dislikedStyles.filter(s => s !== templateId);
    // Add keywords
    promptKeywords.forEach(kw => {
      if (!patterns.likedKeywords.includes(kw)) {
        patterns.likedKeywords.push(kw);
      }
    });
  } else if (rating === 1) {
    // User didn't like it
    if (templateId && !patterns.dislikedStyles.includes(templateId)) {
      patterns.dislikedStyles.push(templateId);
    }
    patterns.likedStyles = patterns.likedStyles.filter(s => s !== templateId);
    // Add to disliked keywords
    promptKeywords.forEach(kw => {
      if (!patterns.dislikedKeywords.includes(kw)) {
        patterns.dislikedKeywords.push(kw);
      }
    });
  }
  
  // Parse comment for insights
  if (comment) {
    const commentLower = comment.toLowerCase();
    
    // Simple sentiment patterns (French)
    const positivePatterns = ['j\'aime', 'super', 'parfait', 'excellent', 'bien', 'top', 'nice', 'love'];
    const negativePatterns = ['pas bien', 'moche', 'nul', 'mauvais', 'horrible', 'non', 'déteste', 'trop'];
    
    positivePatterns.forEach(p => {
      if (commentLower.includes(p)) {
        // Extract what they liked
        const context = commentLower.split(p)[1]?.split(/[.,!?]/)[0]?.trim();
        if (context && context.length > 2 && !patterns.likedKeywords.includes(context)) {
          patterns.likedKeywords.push(context);
        }
      }
    });
    
    negativePatterns.forEach(p => {
      if (commentLower.includes(p)) {
        const context = commentLower.split(p)[1]?.split(/[.,!?]/)[0]?.trim();
        if (context && context.length > 2 && !patterns.dislikedKeywords.includes(context)) {
          patterns.dislikedKeywords.push(context);
        }
      }
    });
  }
  
  patterns.lastUpdated = new Date().toISOString();
  saveFeedbackPatterns(patterns);
  
  return patterns;
};

// Helper to load from localStorage
const loadGenerations = (): Generation[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(GENERATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const loadFolders = (): Folder[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(FOLDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Helper to save to localStorage
const saveGenerations = (generations: Generation[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GENERATIONS_KEY, JSON.stringify(generations));
};

const saveFolders = (folders: Folder[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
};

// Export function to add a generation (called from playground)
export const addGeneration = (gen: Omit<Generation, 'id' | 'createdAt'>) => {
  const generations = loadGenerations();
  const newGen: Generation = {
    ...gen,
    id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  generations.unshift(newGen);
  // No limit - save all generations
  saveGenerations(generations);
  return newGen;
};

// Export function to add multiple generations at once
export const addGenerations = (gens: Omit<Generation, 'id' | 'createdAt'>[]) => {
  const generations = loadGenerations();
  const newGens = gens.map((gen, i) => ({
    ...gen,
    id: `gen_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }));
  generations.unshift(...newGens);
  // No limit - save all generations
  saveGenerations(generations);
  return newGens;
};

const FOLDER_COLORS = [
  { name: 'Gris', value: '#6B7280' },
  { name: 'Rouge', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Jaune', value: '#EAB308' },
  { name: 'Vert', value: '#22C55E' },
  { name: 'Bleu', value: '#3B82F6' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Rose', value: '#EC4899' },
];

const ITEMS_PER_PAGE = 20;

export default function ProjectsView() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0].value);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [draggedGen, setDraggedGen] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Feedback UI state
  const [feedbackGenId, setFeedbackGenId] = useState<string | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');

  // Load data on mount
  useEffect(() => {
    setGenerations(loadGenerations());
    setFolders(loadFolders());
    
    // Listen for new generations
    const handleStorageChange = () => {
      setGenerations(loadGenerations());
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('generations-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('generations-updated', handleStorageChange);
    };
  }, []);

  // Filter generations - all without folder
  const unorganizedGenerations = generations.filter(g => !g.folderId);
  const totalPages = Math.ceil(unorganizedGenerations.length / ITEMS_PER_PAGE);
  
  // Paginated recent generations
  const recentGenerations = unorganizedGenerations
    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const folderGenerations = (folderId: string) => 
    generations.filter(g => g.folderId === folderId);

  // Create folder
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    const newFolder: Folder = {
      id: `folder_${Date.now()}`,
      name: newFolderName.trim(),
      color: newFolderColor,
      createdAt: new Date().toISOString(),
    };
    
    const updated = [...folders, newFolder];
    setFolders(updated);
    saveFolders(updated);
    setShowNewFolder(false);
    setNewFolderName('');
  };

  // Delete folder
  const handleDeleteFolder = (folderId: string) => {
    // Move generations back to unorganized
    const updatedGens = generations.map(g => 
      g.folderId === folderId ? { ...g, folderId: undefined } : g
    );
    setGenerations(updatedGens);
    saveGenerations(updatedGens);
    
    const updatedFolders = folders.filter(f => f.id !== folderId);
    setFolders(updatedFolders);
    saveFolders(updatedFolders);
    
    if (selectedFolder === folderId) setSelectedFolder(null);
  };

  // Drag & drop to folder
  const handleDrop = (folderId: string) => {
    if (!draggedGen) return;
    
    const updated = generations.map(g => 
      g.id === draggedGen ? { ...g, folderId } : g
    );
    setGenerations(updated);
    saveGenerations(updated);
    setDraggedGen(null);
  };

  // Remove from folder
  const handleRemoveFromFolder = (genId: string) => {
    const updated = generations.map(g => 
      g.id === genId ? { ...g, folderId: undefined } : g
    );
    setGenerations(updated);
    saveGenerations(updated);
  };

  // Delete generation
  const handleDeleteGeneration = (genId: string) => {
    const updated = generations.filter(g => g.id !== genId);
    setGenerations(updated);
    saveGenerations(updated);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  // Handle feedback rating
  const handleFeedback = (genId: string, rating: 1 | 2 | 3, comment?: string) => {
    const gen = generations.find(g => g.id === genId);
    if (!gen) return;
    
    const feedback: GenerationFeedback = {
      rating,
      comment: comment || feedbackComment || undefined,
      timestamp: new Date().toISOString()
    };
    
    // Update the generation with feedback
    const updated = generations.map(g => 
      g.id === genId ? { ...g, feedback } : g
    );
    setGenerations(updated);
    saveGenerations(updated);
    
    // Update patterns for learning
    updateFeedbackPatterns(gen, rating, feedback.comment);
    
    // Reset UI
    setFeedbackGenId(null);
    setFeedbackComment('');
  };

  // Render stars for rating
  const renderRatingStars = (gen: Generation, isCompact = false) => {
    const currentRating = gen.feedback?.rating;
    const starSize = isCompact ? 'text-xs' : 'text-sm';
    
    return (
      <div className={`flex items-center gap-0.5 ${isCompact ? 'scale-90' : ''}`}>
        {[1, 2, 3].map((star) => (
          <button
            key={star}
            onClick={(e) => {
              e.stopPropagation();
              if (currentRating === star) {
                // Click same star opens comment
                setFeedbackGenId(gen.id);
              } else {
                handleFeedback(gen.id, star as 1 | 2 | 3);
              }
            }}
            className={`${starSize} transition-all hover:scale-110 ${
              currentRating && currentRating >= star 
                ? star === 1 ? 'text-red-400' : star === 2 ? 'text-amber-400' : 'text-blue-400'
                : 'text-gray-300 hover:text-gray-400'
            }`}
            title={star === 1 ? 'Pas bien' : star === 2 ? 'Moyen' : 'Super !'}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <img src={lightboxImage} alt="" className="max-w-full max-h-full object-contain" />
          <button className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl">×</button>
        </div>
      )}

      {/* Feedback Comment Popup */}
      {feedbackGenId && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setFeedbackGenId(null)}
        >
          <div 
            className="bg-white p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Votre avis</h3>
              <button 
                onClick={() => setFeedbackGenId(null)}
                className="text-gray-400 hover:text-gray-600"
              >×</button>
            </div>
            
            {/* Current rating display */}
            {(() => {
              const gen = generations.find(g => g.id === feedbackGenId);
              return gen ? (
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm text-gray-500">Note :</span>
                  {renderRatingStars(gen)}
                </div>
              ) : null;
            })()}
            
            <textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Qu'est-ce qui vous plaît ou déplaît ? (optionnel)"
              className="w-full p-3 border border-gray-200 text-sm resize-none focus:outline-none focus:border-gray-400"
              rows={3}
            />
            
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => {
                  const gen = generations.find(g => g.id === feedbackGenId);
                  if (gen && gen.feedback?.rating) {
                    handleFeedback(feedbackGenId, gen.feedback.rating, feedbackComment);
                  }
                  setFeedbackGenId(null);
                }}
                className="flex-1 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-black"
              >
                Enregistrer
              </button>
              <button
                onClick={() => setFeedbackGenId(null)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Annuler
              </button>
            </div>
            
            {/* Quick comment suggestions */}
            <div className="mt-3 flex flex-wrap gap-1">
              {['Couleurs parfaites', 'Trop chargé', 'Texte illisible', 'Super composition', 'Pas assez pro'].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setFeedbackComment(prev => prev ? `${prev}, ${suggestion.toLowerCase()}` : suggestion)}
                  className="px-2 py-1 text-[10px] bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
           <h2 className="text-2xl font-bold mb-1">Mes Projets</h2>
          <p className="text-gray-500 text-sm">
            {generations.length} génération{generations.length !== 1 ? 's' : ''} · {folders.length} dossier{folders.length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      {/* Recent Generations Section */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🕐</span>
          <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">Générations récentes</h3>
          <span className="text-xs text-gray-400 font-mono">{unorganizedGenerations.length} visuel{unorganizedGenerations.length !== 1 ? 's' : ''}</span>
        </div>
        
        {recentGenerations.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {recentGenerations.map((gen) => (
                <div 
                  key={gen.id}
                  draggable
                  onDragStart={() => setDraggedGen(gen.id)}
                  onDragEnd={() => setDraggedGen(null)}
                  className={`relative aspect-square bg-gray-100 border border-gray-200 overflow-hidden group cursor-move hover:border-gray-400 transition-all ${
                    draggedGen === gen.id ? 'opacity-50 scale-95' : ''
                  } ${gen.feedback?.rating === 3 ? 'ring-2 ring-blue-400' : ''}`}
                >
                  <img 
                    src={gen.url} 
                    alt="" 
                    className="w-full h-full object-cover"
                    onClick={() => setLightboxImage(gen.url)}
                  />
                  
                  {/* Persistent rating indicator (if rated) */}
                  {gen.feedback?.rating && (
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm flex items-center gap-0.5">
                      {[1, 2, 3].map((star) => (
                        <span
                          key={star}
                          className={`text-[10px] ${
                            gen.feedback!.rating >= star 
                              ? star === 1 ? 'text-red-400' : star === 2 ? 'text-amber-400' : 'text-blue-400'
                              : 'text-gray-500'
                          }`}
                        >★</span>
                      ))}
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[9px] text-white/60 font-mono truncate">
                          {gen.templateId || 'custom'}
                        </div>
                        <div className="text-[10px] text-white/80">
                          {formatDate(gen.createdAt)}
                        </div>
                      </div>
                      
                      {/* Rating stars - always visible on hover */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] text-white/50 uppercase">Note:</span>
                          {renderRatingStars(gen, true)}
                        </div>
                        {gen.feedback?.comment && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFeedbackGenId(gen.id);
                              setFeedbackComment(gen.feedback?.comment || '');
                            }}
                            className="text-[9px] text-white/70 hover:text-white"
                            title={gen.feedback.comment}
                          >
                            💬
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFeedbackGenId(gen.id);
                        setFeedbackComment(gen.feedback?.comment || '');
                      }}
                      className="w-6 h-6 bg-white/90 flex items-center justify-center text-xs hover:bg-white"
                      title="Donner mon avis"
                    >
                      ✎
                    </button>
                    <a 
                      href={gen.url} 
                      download 
                      className="w-6 h-6 bg-white/90 flex items-center justify-center text-xs hover:bg-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ↓
                    </a>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGeneration(gen.id);
                      }}
                      className="w-6 h-6 bg-red-500/90 text-white flex items-center justify-center text-xs hover:bg-red-500"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  ←
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    // Smart pagination: show first, last, and around current
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i < 5 ? i + 1 : (i === 5 ? -1 : totalPages);
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = i === 0 ? 1 : (i === 1 ? -1 : totalPages - 6 + i);
                    } else {
                      pageNum = i === 0 ? 1 : (i === 1 ? -1 : (i === 5 ? -1 : (i === 6 ? totalPages : currentPage - 2 + i)));
                    }
                    
                    if (pageNum === -1) {
                      return <span key={i} className="px-2 text-gray-400">…</span>;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 text-sm transition-colors ${
                          currentPage === pageNum 
                            ? 'bg-gray-900 text-white' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-gray-50 border border-gray-200 p-8 text-center">
            <span className="text-3xl mb-3 block">🎨</span>
            <p className="text-gray-500 text-sm">Aucune génération pour l'instant</p>
            <p className="text-gray-400 text-xs mt-1">Créez votre premier visuel dans l'espace Créer</p>
          </div>
        )}
      </section>

      {/* Folders Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📁</span>
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">Dossiers</h3>
          </div>
            <button 
            onClick={() => setShowNewFolder(true)}
            className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium hover:bg-black transition-colors flex items-center gap-1"
            >
            <span>+</span> Nouveau dossier
            </button>
        </div>

        {/* New folder form */}
        {showNewFolder && (
          <div className="bg-gray-50 border border-gray-200 p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nom du dossier..."
                className="flex-1 px-3 py-2 border border-gray-200 text-sm outline-none focus:border-gray-400"
                autoFocus
              />
              <div className="flex gap-1">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setNewFolderColor(c.value)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      newFolderColor === c.value ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
         ))}
      </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewFolder(false);
                  setNewFolderName('');
                }}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Créer
              </button>
            </div>
          </div>
        )}

        {/* Folders grid */}
        {folders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => {
              const folderGens = folderGenerations(folder.id);
              const isExpanded = selectedFolder === folder.id;
              
              return (
                <div 
                  key={folder.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(folder.id)}
                  className={`bg-white border-2 transition-all ${
                    draggedGen ? 'border-dashed border-gray-300 hover:border-gray-500 hover:bg-gray-50' : 'border-gray-200'
                  }`}
                >
                  {/* Folder header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setSelectedFolder(isExpanded ? null : folder.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-sm"
                          style={{ backgroundColor: folder.color }}
                        />
                        <span className="font-medium text-gray-900">{folder.name}</span>
                        <span className="text-xs text-gray-400 font-mono">{folderGens.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder.id);
                          }}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <svg 
                          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
               </div>
               
                    {/* Thumbnail preview */}
                    {!isExpanded && folderGens.length > 0 && (
                      <div className="flex gap-1 mt-3">
                        {folderGens.slice(0, 4).map((gen, i) => (
                          <div key={gen.id} className="w-10 h-10 bg-gray-100 overflow-hidden">
                            <img src={gen.url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {folderGens.length > 4 && (
                          <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                            +{folderGens.length - 4}
                          </div>
                        )}
                     </div>
                  )}
               </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4">
                      {folderGens.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {folderGens.map((gen) => (
                            <div key={gen.id} className="relative aspect-square bg-gray-100 overflow-hidden group">
                              <img 
                                src={gen.url} 
                                alt="" 
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setLightboxImage(gen.url)}
                              />
                              <button
                                onClick={() => handleRemoveFromFolder(gen.id)}
                                className="absolute top-1 right-1 w-5 h-5 bg-white/90 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Retirer du dossier"
                              >
                                ↩
                              </button>
            </div>
         ))}
      </div>
                      ) : (
                        <p className="text-center text-gray-400 text-sm py-4">
                          Glissez des images ici
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-300 p-8 text-center">
            <span className="text-3xl mb-3 block">📂</span>
            <p className="text-gray-500 text-sm">Créez des dossiers pour organiser vos visuels</p>
            <p className="text-gray-400 text-xs mt-1">Glissez-déposez les images dans les dossiers</p>
          </div>
        )}
      </section>
    </div>
  );
}
