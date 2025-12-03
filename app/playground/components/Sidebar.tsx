'use client';

import { useState, useRef, useEffect } from 'react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  brandData, 
  onEditBrand,
  isCollapsed,
  toggleCollapse
}: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void,
  brandData?: any,
  onEditBrand?: () => void,
  isCollapsed: boolean,
  toggleCollapse: () => void
}) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Expand on hover with small delay for smooth UX
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 150); // Small delay to prevent accidental triggers
  };
  
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300); // Delay before collapsing
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);
  
  // Sidebar is expanded if hovered OR manually expanded
  const isExpanded = isHovered || !isCollapsed;

  const menuItems = [
    { id: 'create', icon: '✦', label: 'Créer', disabled: false },
    // Strategy merged into Create view - angles carousel at top
    { id: 'projects', icon: '◫', label: 'Projets', disabled: false },
    { id: 'calendar', icon: '▤', label: 'Calendrier', disabled: true },
    { id: 'stats', icon: '◔', label: 'Statistiques', disabled: true },
  ];

  return (
    <aside 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed left-4 top-4 bottom-4 bg-white border border-gray-200 z-40 flex flex-col justify-between transition-all duration-300 ease-out ${
        isExpanded ? 'w-[260px] p-5' : 'w-[72px] p-3'
      }`}
    >
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Collapse Toggle - Pin/Unpin button */}
      <button 
        onClick={toggleCollapse}
        className="absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-400 transition-all z-50"
        title={isCollapsed ? "Épingler ouvert" : "Dépingler"}
      >
        <svg 
          className={`w-3 h-3 transition-transform ${!isCollapsed ? 'rotate-45' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          viewBox="0 0 24 24"
        >
          {isCollapsed ? (
            <path d="M9 5l7 7-7 7" />
          ) : (
            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /> 
          )}
        </svg>
      </button>

      <div className="relative z-10">
        {/* Logo */}
        <div className={`flex items-center gap-3 mb-8 transition-all ${!isExpanded ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 bg-gray-900 flex-shrink-0 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">Q</span>
          </div>
          <span className={`font-semibold text-lg tracking-tight overflow-hidden whitespace-nowrap transition-all duration-300 ${!isExpanded ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            QuitteTonAgence
          </span>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <div key={item.id} className="relative group">
              <button
                onClick={() => !item.disabled && setActiveTab(item.id)}
                disabled={item.disabled}
                className={`flex items-center gap-3 text-sm font-medium transition-all duration-200 ${
                  !isExpanded 
                    ? 'w-12 h-12 justify-center p-0 mx-auto' 
                    : 'w-full px-4 py-3'
                } ${
                  item.disabled 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : activeTab === item.id 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={!isExpanded ? item.label : undefined}
              >
                <span className={`text-base ${activeTab === item.id && !item.disabled ? 'text-emerald-400' : ''}`}>
                  {item.icon}
                </span>
                <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${!isExpanded ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                  {item.label}
                </span>
              </button>
              
              {/* Tooltip for collapsed state */}
              {!isExpanded && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                  {item.disabled && ' (bientôt)'}
                </div>
              )}
              
              {item.disabled && isExpanded && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono uppercase tracking-widest text-gray-300">
                  soon
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Brand Card */}
      <div className="relative z-10">
        {brandData ? (
          <div 
            className={`bg-gray-50 border border-gray-200 cursor-pointer hover:border-gray-400 transition-all group ${
              !isExpanded ? 'p-2 flex flex-col items-center justify-center' : 'p-4'
            }`}
            onClick={onEditBrand}
          >
            {isExpanded && (
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400">Ma Marque</span>
                <svg className="w-3 h-3 text-gray-300 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            )}
            
            <div className={`flex items-center gap-3 ${!isExpanded ? 'justify-center w-full' : 'mb-3'}`}>
              <div className="w-9 h-9 bg-white flex items-center justify-center p-1 border border-gray-200 flex-shrink-0">
                {brandData.logo ? (
                  <img src={brandData.logo} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-sm text-gray-400">◆</span>
                )}
              </div>
              
              <div className={`overflow-hidden transition-all duration-300 ${!isExpanded ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                <div className="font-medium text-sm truncate text-gray-900">{brandData.name}</div>
                <div className="text-[10px] text-gray-400 truncate">{brandData.tagline || 'Aucun slogan'}</div>
              </div>
            </div>

            {isExpanded && brandData.colors && brandData.colors.length > 0 && (
              <div className="flex gap-1">
                {brandData.colors.slice(0, 5).map((c: string, i: number) => (
                  <div 
                    key={i} 
                    className="w-5 h-5 border border-gray-200" 
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={`bg-gray-50 border border-gray-200 transition-all ${!isExpanded ? 'p-2 flex flex-col items-center' : 'p-4'}`}>
            <div className={`flex items-center gap-3 ${!isExpanded ? 'justify-center' : 'mb-3'}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 flex-shrink-0" />
              <div className={`transition-all duration-300 ${!isExpanded ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                <div className="text-xs font-medium text-gray-900">Free Plan</div>
                <div className="text-[10px] text-gray-400">75/100 crédits</div>
              </div>
            </div>
            
            {isExpanded && (
              <div className="h-px bg-gray-200 overflow-hidden">
                <div className="h-full bg-gray-900 w-[75%]" />
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
