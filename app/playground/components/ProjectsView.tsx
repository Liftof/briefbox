'use client';

import { useState, useEffect } from 'react';
import {
  useGenerations as useGenerationsHook,
  type Generation,
  type Folder,
  type GenerationFeedback,
} from '@/lib/useGenerations';
import { useTranslation } from '@/lib/i18n';

// Re-export types for backward compatibility
export type { Generation, Folder, GenerationFeedback };

// Re-export functions for backward compatibility (used by playground)
export { addGeneration, addGenerations } from '@/lib/useGenerations';

// Simplified feedback patterns (for backward compatibility)
export interface FeedbackPatterns {
  likedStyles: string[];
  dislikedStyles: string[];
  likedKeywords: string[];
  dislikedKeywords: string[];
  avgRatingByTemplate: Record<string, { total: number; count: number }>;
  lastUpdated: string;
}

// Simplified - just returns empty patterns now
export const loadFeedbackPatterns = (): FeedbackPatterns => ({
  likedStyles: [],
  dislikedStyles: [],
  likedKeywords: [],
  dislikedKeywords: [],
  avgRatingByTemplate: {},
  lastUpdated: new Date().toISOString()
});

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

export default function ProjectsView({ brandId }: { brandId?: number }) {
  const { t } = useTranslation();

  // Use the hook for data management (API + localStorage fallback)
  const {
    generations,
    folders,
    loading,
    updateGeneration,
    deleteGeneration,
    createFolder,
    deleteFolder,
    refresh,
  } = useGenerationsHook(brandId);

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0].value);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [draggedGen, setDraggedGen] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<Generation | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editAdditionalImages, setEditAdditionalImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Favorites filter
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Listen for new generations
  useEffect(() => {
    const handleUpdate = () => {
      refresh();
    };
    window.addEventListener('generations-updated', handleUpdate);

    return () => {
      window.removeEventListener('generations-updated', handleUpdate);
    };
  }, [refresh]);

  // Filter generations - all without folder, optionally only favorites
  const unorganizedGenerations = generations
    .filter(g => !g.folderId)
    .filter(g => !showFavoritesOnly || g.feedback?.rating === 3);

  const totalPages = Math.ceil(unorganizedGenerations.length / ITEMS_PER_PAGE);

  // Paginated recent generations
  const recentGenerations = unorganizedGenerations
    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Count favorites
  const favoritesCount = generations.filter(g => g.feedback?.rating === 3).length;

  const folderGenerations = (folderId: string) =>
    generations.filter(g => g.folderId === folderId);

  // Create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    await createFolder(newFolderName.trim(), newFolderColor);
    setShowNewFolder(false);
    setNewFolderName('');
  };

  // Delete folder
  const handleDeleteFolder = async (folderId: string) => {
    await deleteFolder(folderId);
    if (selectedFolder === folderId) setSelectedFolder(null);
  };

  // Drag & drop to folder
  const handleDrop = async (folderId: string) => {
    if (!draggedGen) return;

    await updateGeneration(draggedGen, { folderId });
    setDraggedGen(null);
  };

  // Remove from folder
  const handleRemoveFromFolder = async (genId: string) => {
    await updateGeneration(genId, { folderId: undefined });
  };

  // Delete generation
  const handleDeleteGeneration = async (genId: string) => {
    await deleteGeneration(genId);
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

  // Toggle favorite
  const handleToggleFavorite = async (genId: string) => {
    const gen = generations.find(g => g.id === genId);
    if (!gen) return;

    const isFavorite = gen.feedback?.rating === 3;
    const feedback: GenerationFeedback = isFavorite
      ? { rating: 1, timestamp: new Date().toISOString() } // Unfavorite
      : { rating: 3, timestamp: new Date().toISOString() }; // Favorite

    await updateGeneration(genId, { feedback });
  };

  // Render favorite heart button
  const renderFavoriteButton = (gen: Generation, isCompact = false) => {
    const isFavorite = gen.feedback?.rating === 3;
    const size = isCompact ? 'w-4 h-4' : 'w-5 h-5';

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleToggleFavorite(gen.id);
        }}
        className={`transition-all hover:scale-110 ${isFavorite ? 'text-red-500' : 'text-gray-300 hover:text-red-400'
          }`}
        title={isFavorite ? t('projects.removeFromFavorites') : t('projects.addToFavorites')}
      >
        <svg className={size} fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Edit Modal */}
      {editingImage && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-4xl flex flex-col md:flex-row relative border border-gray-200">
            {/* Close button */}
            <button
              onClick={() => {
                setEditingImage(null);
                setEditAdditionalImages([]);
                setEditPrompt('');
              }}
              className="absolute top-4 right-4 z-10 w-8 h-8 border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image preview */}
            <div className="flex-1 bg-gray-50 flex items-center justify-center p-6 border-r border-gray-100">
              <img src={editingImage} className="max-h-[60vh] w-auto object-contain" />
            </div>

            {/* Edit form */}
            <div className="flex-1 flex flex-col justify-center p-8">
              <div className="text-[10px] font-mono uppercase tracking-widest text-blue-600 mb-2">
                ✏️ {t('playground.gallery.editMode')}
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('playground.gallery.editThisImage')}</h3>
              <p className="text-sm text-gray-500 mb-6">
                {t('playground.gallery.editDescription')}
              </p>

              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                className="w-full h-28 p-4 border border-gray-200 resize-none mb-4 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all text-sm"
                placeholder={t('playground.gallery.editPlaceholder')}
              />

              {/* Additional Images for Editing */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">{t('playground.gallery.referenceImages')}</label>
                  <span className="text-[10px] text-gray-400">{editAdditionalImages.length}/3</span>
                </div>
                <p className="text-[10px] text-gray-400 mb-2">
                  {t('playground.gallery.referenceImagesHint')}
                </p>

                <div className="grid grid-cols-4 gap-2">
                  {editAdditionalImages.map((img, i) => (
                    <div key={i} className="relative aspect-square group rounded overflow-hidden border border-gray-200">
                      <img src={img} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setEditAdditionalImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/50 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-500 transition-colors"
                      >×</button>
                    </div>
                  ))}

                  {editAdditionalImages.length < 3 && (
                    <div
                      className="aspect-square border-2 border-dashed border-gray-200 rounded flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
                      onClick={() => document.getElementById('edit-image-upload')?.click()}
                    >
                      <span className="text-gray-400 text-xl">+</span>
                    </div>
                  )}
                </div>
                <input
                  id="edit-image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      Array.from(e.target.files).forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (typeof ev.target?.result === 'string') {
                            setEditAdditionalImages(prev => [...prev, ev.target!.result as string].slice(0, 3));
                          }
                        };
                        reader.readAsDataURL(file);
                      });
                    }
                  }}
                />
              </div>

              <button
                onClick={() => {
                  if (!editPrompt.trim() || !editingImage) return;
                  // TODO: Call edit API
                  alert('Edition feature coming soon!');
                  setEditingImage(null);
                  setEditPrompt('');
                  setEditAdditionalImages([]);
                }}
                className="group bg-gray-900 text-white py-4 font-medium text-sm hover:bg-black transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                disabled={!editPrompt.trim()}
              >
                <span className="text-blue-400">✏️</span>
                {t('playground.gallery.applyEdit')}
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox with Options Panel */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 z-10 w-10 h-10 border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 transition rounded-full bg-black/50"
            onClick={() => setLightboxImage(null)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Main content area */}
          <div className="flex flex-col md:flex-row w-full h-full" onClick={(e) => e.stopPropagation()}>
            {/* Image preview - takes most of the space */}
            <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden">
              <img
                src={lightboxImage.url}
                alt="Full view"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Options Panel - Right side on desktop, bottom on mobile */}
            <div className="w-full md:w-80 bg-gray-900 border-t md:border-t-0 md:border-l border-white/10 p-6 flex flex-col gap-4">
              {/* Header */}
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-white font-medium text-lg mb-1">{t('playground.gallery.yourCreation')}</h3>
                <p className="text-gray-400 text-xs">
                  {lightboxImage.aspectRatio || '1:1'} • {t('playground.gallery.readyForExport')}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {/* Edit */}
                <button
                  onClick={() => {
                    setEditingImage(lightboxImage.url);
                    setLightboxImage(null);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-lg font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>{t('playground.gallery.edit')}</span>
                </button>

                {/* Download */}
                <a
                  href={lightboxImage.url}
                  download
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 transition-colors text-white rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>{t('playground.gallery.download')}</span>
                </a>

                {/* Delete */}
                <button
                  onClick={() => {
                    if (confirm(t('playground.gallery.confirmDelete'))) {
                      handleDeleteGeneration(lightboxImage.id);
                      setLightboxImage(null);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 transition-colors text-red-400 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>{t('playground.gallery.delete')}</span>
                </button>
              </div>

              {/* Metadata */}
              {lightboxImage.prompt && (
                <div className="mt-auto pt-4 border-t border-white/10">
                  <p className="text-gray-400 text-xs mb-1">{t('playground.gallery.promptUsed')}</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{lightboxImage.prompt}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-1">{t('projects.title')}</h2>
          <p className="text-gray-500 text-sm">
            {generations.length} {generations.length !== 1 ? t('projects.generationsPlural') : t('projects.generations')} · {folders.length} {folders.length !== 1 ? t('projects.foldersPlural') : t('projects.folders')}
            {favoritesCount > 0 && ` · ${favoritesCount} ${favoritesCount !== 1 ? t('projects.favoritesPlural') : t('projects.favorites')}`}
          </p>
        </div>

        {/* Favorites filter */}
        {favoritesCount > 0 && (
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${showFavoritesOnly
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
          >
            <svg className="w-4 h-4" fill={showFavoritesOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-sm font-medium">
              {showFavoritesOnly ? t('projects.showAll') : t('projects.showFavorites')}
            </span>
          </button>
        )}
      </header>

      {/* Recent Generations Section */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🕐</span>
          <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">{t('projects.myGenerations')}</h3>
          <span className="text-xs text-gray-400 font-mono">{unorganizedGenerations.length} {unorganizedGenerations.length !== 1 ? t('projects.visualsPlural') : t('projects.visuals')}</span>
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
                  onClick={() => setLightboxImage(gen)}
                  className={`relative aspect-square bg-gray-100 border border-gray-200 overflow-hidden group cursor-pointer hover:border-gray-400 transition-all ${draggedGen === gen.id ? 'opacity-50 scale-95' : ''
                    } ${gen.feedback?.rating === 3 ? 'ring-2 ring-red-400' : ''}`}
                >
                  <img
                    src={gen.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />

                  {/* Favorite indicator (if favorited) */}
                  {gen.feedback?.rating === 3 && (
                    <div className="absolute top-1 left-1 p-1 bg-black/60 backdrop-blur-sm rounded-full">
                      <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] text-white/80">
                          {formatDate(gen.createdAt)}
                        </div>
                        {renderFavoriteButton(gen, true)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(gen.id);
                      }}
                      className={`w-6 h-6 bg-white/90 flex items-center justify-center hover:bg-white transition-colors ${gen.feedback?.rating === 3 ? 'text-red-500' : 'text-gray-400'
                        }`}
                      title={gen.feedback?.rating === 3 ? t('projects.removeFromFavorites') : t('projects.addToFavorites')}
                    >
                      <svg className="w-4 h-4" fill={gen.feedback?.rating === 3 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
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
                        className={`w-8 h-8 text-sm transition-colors ${currentPage === pageNum
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
            <p className="text-gray-500 text-sm">{t('projects.noGenerations')}</p>
            <p className="text-gray-400 text-xs mt-1">{t('projects.createFirst')}</p>
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
            <span>+</span> {t('projects.newFolder')}
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
                placeholder={t('projects.folderName')}
                className="flex-1 px-3 py-2 border border-gray-200 text-sm outline-none focus:border-gray-400"
                autoFocus
              />
              <div className="flex gap-1">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setNewFolderColor(c.value)}
                    className={`w-6 h-6 rounded-full transition-transform ${newFolderColor === c.value ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''
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
                {t('projects.cancel')}
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {t('projects.create')}
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
                  className={`bg-white border-2 transition-all ${draggedGen ? 'border-dashed border-gray-300 hover:border-gray-500 hover:bg-gray-50' : 'border-gray-200'
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
                                onClick={() => setLightboxImage(gen)}
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
            <p className="text-gray-500 text-sm">{t('projects.emptyFolders')}</p>
            <p className="text-gray-400 text-xs mt-1">{t('projects.dragDrop')}</p>
          </div>
        )}
      </section>
    </div>
  );
}
