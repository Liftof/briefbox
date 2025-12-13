'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { useCredits, PLAN_NAMES } from '@/lib/useCredits';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  brandData?: any;
  onEditBrand?: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  brandData, 
  onEditBrand,
  isCollapsed,
  toggleCollapse
}: SidebarProps) {
  const { t, locale } = useTranslation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { credits, loading: creditsLoading } = useCredits();

  const menuItems = [
    { id: 'create', icon: '✦', label: t('playground.sidebar.create') },
    { id: 'projects', icon: '◫', label: t('playground.sidebar.projects') },
    { id: 'calendar', icon: '▤', label: t('playground.sidebar.calendar'), disabled: true },
    { id: 'stats', icon: '◔', label: t('playground.sidebar.stats'), disabled: true },
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

        {/* Brand Card - Bottom */}
        <div className={`border-t border-gray-100 ${isCollapsed ? 'p-2' : 'p-3'}`}>
          {brandData ? (
            <button
              onClick={onEditBrand}
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
                    <div className="text-[10px] text-gray-400 truncate">
                      {brandData.tagline || (locale === 'fr' ? 'Cliquez pour modifier' : 'Click to edit')}
                    </div>
                  </div>
                )}
                
                {!isCollapsed && (
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
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
            <Link 
            href="/api/stripe/checkout"
            onClick={async (e) => {
              e.preventDefault();
              if (credits?.plan === 'free') {
                // Redirect to checkout for pro plan
                try {
                  const res = await fetch('/api/stripe/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan: 'pro' }),
                  });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                } catch (err) {
                  console.error('Checkout error:', err);
                }
              } else {
                // Redirect to billing portal
                try {
                  const res = await fetch('/api/stripe/portal', { method: 'POST' });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                } catch (err) {
                  console.error('Portal error:', err);
                }
              }
            }}
            className={`block bg-gradient-to-br ${
              credits?.plan === 'pro' ? 'from-blue-50 to-blue-100 border-blue-200' :
              credits?.plan === 'business' ? 'from-purple-50 to-purple-100 border-purple-200' :
              'from-gray-50 to-gray-100 border-gray-200'
            } border rounded-lg hover:shadow-sm transition-all ${
              isCollapsed ? 'p-2' : 'p-3'
            }`}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className={`w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${
                credits?.plan === 'pro' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                credits?.plan === 'business' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                'bg-gradient-to-br from-gray-400 to-gray-500'
              }`}>
                {creditsLoading ? '...' : credits?.remaining ?? '?'}
              </div>
              {!isCollapsed && (
                <div className="text-left">
                  <div className="text-xs font-medium text-gray-900">
                    {locale === 'fr' ? 'Plan ' : ''}{PLAN_NAMES[credits?.plan || 'free']}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {creditsLoading ? '...' : (
                      credits?.plan === 'free' 
                        ? (locale === 'fr' ? `${credits?.remaining ?? 0} crédit${(credits?.remaining ?? 0) !== 1 ? 's' : ''} restant${(credits?.remaining ?? 0) !== 1 ? 's' : ''}` : `${credits?.remaining ?? 0} credit${(credits?.remaining ?? 0) !== 1 ? 's' : ''} left`)
                        : (locale === 'fr' ? `${credits?.remaining ?? 0}/${credits?.total ?? 0} ce mois` : `${credits?.remaining ?? 0}/${credits?.total ?? 0} this month`)
                    )}
                  </div>
                </div>
              )}
            </div>
          </Link>
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
