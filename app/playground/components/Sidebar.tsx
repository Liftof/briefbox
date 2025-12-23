'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import CreditsWidget from './CreditsWidget';
import { BrandSummary } from '@/lib/useBrands';
import { useCredits, CreditsInfo } from '@/lib/useCredits';

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
  onRescrape?: () => void;
  onDeleteBrand?: (brandId: number) => void;
  // Credits sync
  creditsInfo?: CreditsInfo | null;
}

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
  onRescrape,
  onDeleteBrand,
  creditsInfo,
}: SidebarProps) {
  const { t, locale } = useTranslation();
  const { credits: hookCredits } = useCredits();
  const credits = creditsInfo ?? hookCredits; // Use passed credits if available
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isFree = credits?.plan === 'free';

  const menuItems = [
    { id: 'create', icon: '✦', label: t('sidebar.create') },
    { id: 'gallery', icon: '◰', label: t('sidebar.gallery') },
    { id: 'calendar', icon: '▤', label: t('sidebar.calendar'), disabled: true },
    { id: 'publish', icon: '↗', label: t('sidebar.publish'), disabled: true },
    { id: 'stats', icon: '◔', label: t('sidebar.stats'), disabled: true },
  ];

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 z-40 flex flex-col transition-all duration-300 ease-out ${isCollapsed ? 'w-16' : 'w-56'
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
                    className={`w-full flex items-center gap-3 rounded-lg transition-all duration-150 ${isCollapsed ? 'justify-center h-11 px-0' : 'px-3 h-10'
                      } ${isDisabled
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
                        {t('common.soon')}
                      </span>
                    )}
                  </button>

                  {/* Tooltip when collapsed */}
                  {isCollapsed && hoveredItem === item.id && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-md whitespace-nowrap z-50 shadow-lg">
                      {item.label}
                      {isDisabled && <span className="text-gray-400 ml-1">({t('common.soon')})</span>}
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
          <CreditsWidget isCollapsed={isCollapsed} creditsOverride={credits} />
        </div>

        {/* Brand Selector */}
        <div className={`border-t border-gray-100 ${isCollapsed ? 'p-2' : 'p-3'} relative`}>
          {brandData ? (
            <button
              onClick={() => setShowBrandPicker(!showBrandPicker)}
              className={`w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg transition-all group ${isCollapsed ? 'p-2' : 'p-3'
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
                      <span>{t('common.manage')}</span>
                      <svg className={`w-3 h-3 transition-transform ${showBrandPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
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
                {t('sidebar.noBrand')}
              </div>
            </div>
          )}

          {/* Brand Picker Dropdown */}
          {showBrandPicker && !isCollapsed && brandData && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 max-h-64 overflow-y-auto">
              <div className="p-2 border-b border-gray-100 bg-gray-50">
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                  {t('sidebar.yourBrands')}
                </span>
              </div>
              {userBrands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => {
                    onSwitchBrand?.(brand);
                    setShowBrandPicker(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${brand.id === selectedBrandId ? 'bg-blue-50 border-l-2 border-blue-500' : ''
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
                  {t('sidebar.addBrand')}
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
                    {t('sidebar.editBrand')}
                  </span>
                </button>
              )}

              {/* Re-scrape brand (Pro+ only) */}
              {brandData && (
                <button
                  onClick={() => {
                    if (isFree) {
                      alert(t('sidebar.refreshBrandPro'));
                    } else {
                      onRescrape?.();
                      setShowBrandPicker(false);
                    }
                  }}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-t border-gray-100 ${isFree ? 'text-gray-300' : 'text-blue-600'
                    }`}
                >
                  <div className={`w-6 h-6 rounded border flex items-center justify-center ${isFree ? 'border-gray-200' : 'border-blue-200'
                    }`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <span className="text-sm flex items-center gap-2">
                    {t('sidebar.refresh')}
                    {isFree && (
                      <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">PRO</span>
                    )}
                  </span>
                </button>
              )}

              {/* Delete brand */}
              {brandData && selectedBrandId && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-red-50 transition-colors border-t border-gray-100 text-red-500"
                >
                  <div className="w-6 h-6 rounded border border-red-200 flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <span className="text-sm">
                    {t('common.delete')}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
              <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('sidebar.deleteBrand')}
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    {t('sidebar.deleteBrandConfirm', { name: brandData?.name || '' })}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={() => {
                        if (selectedBrandId) {
                          onDeleteBrand?.(selectedBrandId);
                        }
                        setShowDeleteConfirm(false);
                        setShowBrandPicker(false);
                      }}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings button */}
        <div className={`border-t border-gray-100 ${isCollapsed ? 'p-2' : 'px-3 py-2'}`}>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 rounded-lg transition-all duration-150 ${isCollapsed ? 'justify-center h-10 px-0' : 'px-3 h-10'
              } ${activeTab === 'settings'
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
          >
            <span className={`text-base flex-shrink-0 ${activeTab === 'settings' ? 'text-blue-400' : ''}`}>⚙</span>
            {!isCollapsed && (
              <span className="text-sm font-medium">{t('sidebar.settings')}</span>
            )}
          </button>
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
