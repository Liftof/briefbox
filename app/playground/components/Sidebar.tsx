'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import CreditsWidget from './CreditsWidget';
import { BrandSummary } from '@/lib/useBrands';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  brandData?: any;
  onEditBrand?: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  // Multi-brand props
  userBrands?: BrandSummary[];
  selectedBrandId?: number | null;
  onSwitchBrand?: (brand: BrandSummary) => void;
  onAddBrand?: () => void;
}

// Fallback labels if translations fail
const MENU_LABELS = {
  create: { fr: 'Créer', en: 'Create' },
  projects: { fr: 'Projets', en: 'Projects' },
  calendar: { fr: 'Calendrier', en: 'Calendar' },
  stats: { fr: 'Stats', en: 'Stats' },
};

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  brandData, 
  onEditBrand,
  isCollapsed,
  toggleCollapse,
  userBrands = [],
  selectedBrandId,
  onSwitchBrand,
  onAddBrand,
}: SidebarProps) {
  const { t, locale } = useTranslation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showBrandPicker, setShowBrandPicker] = useState(false);

  // Use translated labels with fallback
  const getLabel = (id: keyof typeof MENU_LABELS) => {
    const translated = t(`playground.sidebar.${id}`);
    // If translation returns the key itself, use fallback
    if (translated.includes('playground.sidebar.')) {
      return MENU_LABELS[id][locale] || MENU_LABELS[id].fr;
    }
    return translated;
  };

  const menuItems = [
    { id: 'create', icon: '✦', label: getLabel('create') },
    { id: 'projects', icon: '◫', label: getLabel('projects') },
    { id: 'calendar', icon: '▤', label: getLabel('calendar'), disabled: true },
    { id: 'stats', icon: '◔', label: getLabel('stats'), disabled: true },
  ];

  return (
    <>
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 z-40 flex flex-col transition-all duration-300 ease-out ${
          isCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        {/* Header with logo */}
        <div className={`flex items-center h-16 border-b border-gray-100 ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}>
          <Link href="/" className="flex items-center gap-2 group">
            <img 
              src="/logo-icon.png" 
              alt="Palette" 
              className="w-8 h-8 object-contain flex-shrink-0" 
            />
            {!isCollapsed && (
              <span className="font-semibold text-gray-900 tracking-tight">Palette</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              const isDisabled = item.disabled;
              
              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => !isDisabled && setActiveTab(item.id)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-3 rounded-lg transition-all duration-150 ${
                      isCollapsed ? 'justify-center h-11 px-0' : 'px-3 h-10'
                    } ${
                      isDisabled 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : isActive 
                          ? 'bg-gray-900 text-white' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className={`text-base flex-shrink-0 ${isActive ? 'text-blue-400' : ''}`}>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                    {!isCollapsed && isDisabled && (
                      <span className="ml-auto text-[9px] font-mono uppercase tracking-wider text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded">
                        {t('playground.sidebar.soon')}
                      </span>
                    )}
                  </button>
                  
                  {/* Tooltip when collapsed */}
                  {isCollapsed && hoveredItem === item.id && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-md whitespace-nowrap z-50 shadow-lg">
                      {item.label}
                      {isDisabled && <span className="text-gray-400 ml-1">({t('playground.sidebar.soon')})</span>}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Credits Widget - Always visible */}
        <div className={`border-t border-gray-100 ${isCollapsed ? 'p-2' : 'p-3'}`}>
          <CreditsWidget isCollapsed={isCollapsed} locale={locale} />
        </div>

        {/* Brand Selector */}
        <div className={`border-t border-gray-100 ${isCollapsed ? 'p-2' : 'p-3'} relative`}>
          {brandData ? (
            <button
              onClick={() => userBrands.length > 1 ? setShowBrandPicker(!showBrandPicker) : onEditBrand?.()}
              className={`w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg transition-all group ${
                isCollapsed ? 'p-2' : 'p-3'
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                {/* Brand logo */}
                <div className="w-8 h-8 bg-white rounded border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {brandData.logo ? (
                    <img src={brandData.logo} className="w-full h-full object-contain" alt="" />
                  ) : (
                    <span className="text-gray-400 text-xs">◆</span>
                  )}
                </div>
                
                {!isCollapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {brandData.name || t('playground.sidebar.myBrand')}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                      {userBrands.length > 1 ? (
                        <>
                          <span>{userBrands.length} {locale === 'fr' ? 'marques' : 'brands'}</span>
                          <svg className={`w-3 h-3 transition-transform ${showBrandPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      ) : (
                        <span>{locale === 'fr' ? 'Cliquez pour modifier' : 'Click to edit'}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Color palette preview */}
              {!isCollapsed && brandData.colors?.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {brandData.colors.slice(0, 5).map((color: string, i: number) => (
                    <div 
                      key={i}
                      className="w-4 h-4 rounded-sm border border-gray-200"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </button>
          ) : (
            <div className={`text-center ${isCollapsed ? '' : 'py-4'}`}>
              <div className="text-gray-400 text-xs">
                {locale === 'fr' ? 'Aucune marque' : 'No brand'}
              </div>
            </div>
          )}
          
          {/* Brand Picker Dropdown */}
          {showBrandPicker && !isCollapsed && userBrands.length > 0 && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 max-h-64 overflow-y-auto">
              <div className="p-2 border-b border-gray-100 bg-gray-50">
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                  {locale === 'fr' ? 'Vos marques' : 'Your brands'}
                </span>
              </div>
              {userBrands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => {
                    onSwitchBrand?.(brand);
                    setShowBrandPicker(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                    brand.id === selectedBrandId ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                  }`}
                >
                  <div className="w-6 h-6 bg-white rounded border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {brand.logo ? (
                      <img src={brand.logo} className="w-full h-full object-contain" alt="" />
                    ) : (
                      <span className="text-gray-400 text-[10px]">◆</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium text-gray-900 truncate">{brand.name}</div>
                  </div>
                  {brand.id === selectedBrandId && (
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
              
              {/* Add brand button */}
              <button
                onClick={() => {
                  onAddBrand?.();
                  setShowBrandPicker(false);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-t border-gray-100 text-blue-600"
              >
                <div className="w-6 h-6 rounded border border-dashed border-blue-300 flex items-center justify-center">
                  <span className="text-blue-500 text-sm">+</span>
                </div>
                <span className="text-sm font-medium">
                  {locale === 'fr' ? 'Ajouter une marque' : 'Add a brand'}
                </span>
              </button>
              
              {/* Edit current brand */}
              {brandData && (
                <button
                  onClick={() => {
                    onEditBrand?.();
                    setShowBrandPicker(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-t border-gray-100 text-gray-500"
                >
                  <div className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <span className="text-sm">
                    {locale === 'fr' ? 'Modifier la marque actuelle' : 'Edit current brand'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <div className="border-t border-gray-100 p-2">
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center h-9 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}
