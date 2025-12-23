'use client';

import { useCredits } from '@/lib/useCredits';
import { useTranslation } from '@/lib/i18n';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  brandData?: any;
  onEditBrand?: () => void;
}

export default function MobileNav({
  activeTab,
  setActiveTab,
  brandData,
  onEditBrand,
}: MobileNavProps) {
  const { t } = useTranslation();
  const { credits } = useCredits();
  
  const menuItems = [
    { 
      id: 'create', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      ),
      label: t('mobileNav.create'),
    },
    {
      id: 'projects',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      label: t('mobileNav.projects'),
    },
    {
      id: 'brand',
      icon: brandData?.logo ? (
        <img src={brandData.logo} className="w-6 h-6 object-contain" alt="" />
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      label: t('common.brand'),
      action: onEditBrand,
    },
  ];

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id || (item.id === 'brand' && activeTab === 'settings');
            
            return (
              <button
                key={item.id}
                onClick={() => item.action ? item.action() : setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors ${
                  isActive ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                <div className={`${isActive ? 'text-blue-500' : ''}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Credits indicator */}
        {credits && credits.plan === 'free' && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2">
            <div className="bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-full font-medium shadow-lg">
              {credits.remaining}/{credits.total} {t('common.credits')}
            </div>
          </div>
        )}
      </nav>
      
      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 h-14 flex items-center justify-between px-4 safe-area-top">
        <div className="flex items-center gap-2">
          <img src="/logo-icon.png" alt="Palette" className="w-7 h-7 object-contain" />
          <span className="font-semibold text-gray-900">Palette</span>
        </div>
        
        {brandData && (
          <button
            onClick={onEditBrand}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg"
          >
            {brandData.logo && (
              <img src={brandData.logo} className="w-5 h-5 object-contain" alt="" />
            )}
            <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
              {brandData.name || t('sidebar.myBrand')}
            </span>
          </button>
        )}
      </header>
    </>
  );
}
