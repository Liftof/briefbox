'use client';

import { Generation } from '@/lib/useGenerations';

// Aspect ratio to CSS class mapping
const getAspectClass = (ratio?: string): string => {
  const aspectClasses: Record<string, string> = {
    '1:1': 'aspect-square',
    '4:5': 'aspect-[4/5]',
    '9:16': 'aspect-[9/16]',
    '16:9': 'aspect-[16/9]',
    '3:2': 'aspect-[3/2]',
    '21:9': 'aspect-[21/9]',
  };
  return aspectClasses[ratio || '1:1'] || 'aspect-square';
};

// Get appropriate width for thumbnail based on ratio
const getThumbnailWidth = (ratio?: string): string => {
  // Vertical ratios need more height (so less width to keep same area)
  // Horizontal ratios need more width
  switch (ratio) {
    case '9:16': return 'w-10'; // Narrow for vertical
    case '4:5': return 'w-14'; // Slightly narrow
    case '16:9': return 'w-24'; // Wide for horizontal
    case '21:9': return 'w-28'; // Very wide
    case '3:2': return 'w-20'; // Slightly wide
    default: return 'w-16'; // Square
  }
};

interface RecentVisualsProps {
  generations: Generation[];
  onViewAll: () => void;
  onImageClick?: (gen: Generation) => void;
  locale?: 'fr' | 'en';
}

export default function RecentVisuals({ 
  generations, 
  onViewAll, 
  onImageClick,
  locale = 'fr' 
}: RecentVisualsProps) {
  // Only show if we have generations
  if (!generations || generations.length === 0) return null;

  // Get the 5 most recent
  const recent = generations.slice(0, 5);

  // Check if a generation is "new" (created today or is a daily visual)
  const isNew = (gen: Generation) => {
    if (gen.type === 'daily') return true;
    
    const createdDate = new Date(gen.createdAt);
    const today = new Date();
    return createdDate.toDateString() === today.toDateString();
  };

  return (
    <div className="border-t border-gray-100 pt-6 mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-widest text-gray-400">
            {t('recentVisuals.title')}
          </span>
          {recent.some(isNew) && (
            <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
              {t('recentVisuals.new')}
            </span>
          )}
        </div>
        <button
          onClick={onViewAll}
          className="text-xs text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
        >
          {t('recentVisuals.manageVisuals')}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Thumbnails row */}
      <div className="flex gap-2 overflow-x-auto pb-2 items-end">
        {recent.map((gen) => {
          const aspectClass = getAspectClass(gen.aspectRatio);
          const widthClass = getThumbnailWidth(gen.aspectRatio);
          
          return (
            <div
              key={gen.id}
              className="relative flex-shrink-0 group cursor-pointer"
              onClick={() => onImageClick?.(gen)}
            >
              {/* Image with dynamic aspect ratio */}
              <div className={`${widthClass} ${aspectClass} rounded-lg overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors`}>
                <img
                  src={gen.url}
                  alt={gen.prompt || 'Generated visual'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>

              {/* New badge */}
              {isNew(gen) && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
              )}

              {/* Daily visual indicator */}
              {gen.type === 'daily' && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white text-[8px] font-medium text-center py-0.5">
                  ☀️
                </div>
              )}
            </div>
          );
        })}

        {/* "View more" card if there are more than 5 */}
        {generations.length > 5 && (
          <button
            onClick={onViewAll}
            className="w-16 h-16 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <span className="text-lg font-light">+{generations.length - 5}</span>
            <span className="text-[8px] uppercase tracking-wider">
              {t('common.others')}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
