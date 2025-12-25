'use client';

import { useState } from 'react';
import { useCredits, PLAN_NAMES, CreditsInfo } from '@/lib/useCredits';
import { useTranslation } from '@/lib/i18n';

interface CreditsWidgetProps {
  isCollapsed?: boolean;
  creditsOverride?: CreditsInfo | null; // Pass from parent to keep in sync
}

export default function CreditsWidget({ isCollapsed = false, creditsOverride }: CreditsWidgetProps) {
  const { t, locale } = useTranslation();
  const { credits: hookCredits, loading } = useCredits();
  const credits = creditsOverride ?? hookCredits; // Use override if provided
  const [isHovered, setIsHovered] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);

  const handleClick = () => {
    // Always show upgrade popup (even for premium users, they can manage subscription there)
    setShowUpgradePopup(true);
  };

  if (loading) {
    return (
      <div className={`bg-gray-100 animate-pulse ${isCollapsed ? 'w-10 h-10 mx-auto' : 'h-14'}`} />
    );
  }

  const isFree = credits?.plan === 'free';
  const isLow = credits && credits.remaining <= 1;
  const ratio = (credits?.remaining ?? 0) / (credits?.total ?? 3);

  return (
    <>
      <div
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative cursor-pointer transition-all duration-200
          ${isFree
            ? 'border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 hover:border-blue-600'
            : 'border border-gray-200 bg-white hover:border-gray-900'
          }
          ${isCollapsed ? 'p-2' : 'p-3'}
        `}
      >
      {/* Collapsed view */}
      {isCollapsed ? (
        <div className={`
          w-8 h-8 flex items-center justify-center text-sm font-mono font-bold
          ${isLow ? 'text-red-600' : 'text-gray-900'}
        `}>
          {credits?.remaining ?? '?'}
        </div>
      ) : (
        <>
          {/* Expanded view */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Credits count */}
              <div className={`
                text-2xl font-mono font-bold tabular-nums
                ${isLow ? 'text-red-600' : 'text-gray-900'}
              `}>
                {credits?.remaining ?? 0}
              </div>
              
              {/* Info */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    {t('common.credits')}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {PLAN_NAMES[credits?.plan || 'free']}
                </div>
              </div>
            </div>
            
            {/* Upgrade button */}
            {isFree && (
              <div className="flex items-center gap-1.5 text-blue-600 font-medium text-xs">
                <span>{t('credits.upgrade')}</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-0.5 bg-gray-100 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                isLow ? 'bg-red-500' : 'bg-gray-900'
              }`}
              style={{ width: `${ratio * 100}%` }}
            />
          </div>

          {/* Hover CTA */}
          {isHovered && isFree && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <span className="text-white text-xs font-medium tracking-wide">
                {t('credits.upgrade').toUpperCase()} →
              </span>
            </div>
          )}
        </>
      )}
      </div>

      {/* Upgrade/Manage Popup */}
      <UpgradePopup
        isOpen={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
        creditsRemaining={credits?.remaining ?? 0}
        currentPlan={credits?.plan}
      />
    </>
  );
}

// ============================================
// UPGRADE POPUP (after free generations used)
// ============================================

interface UpgradePopupProps {
  isOpen: boolean;
  onClose: () => void;
  creditsRemaining: number;
  currentPlan?: 'free' | 'pro' | 'premium';
}

export function UpgradePopup({ isOpen, onClose, creditsRemaining, currentPlan = 'free' }: UpgradePopupProps) {
  const { t, locale } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async (plan: 'pro' | 'premium') => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        console.error('Checkout error:', data.error);
        alert(`Erreur: ${data.error}`);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Erreur de connexion. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Portal error:', err);
    }
  };

  const isBlocked = creditsRemaining <= 0;
  const isFree = currentPlan === 'free';
  const isPro = currentPlan === 'pro';
  const isPremium = currentPlan === 'premium';

  return (
    <div 
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={!isBlocked ? onClose : undefined}
    >
      <div 
        className="bg-white max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 text-center border-b border-gray-100">
          <h2 className="text-xl font-light text-gray-900 mb-2">
            {isBlocked ? t('credits.popup.exhausted') : t('credits.popup.loving')}
          </h2>
          <p className="text-sm text-gray-500">
            {isBlocked
              ? t('credits.popup.goPro')
              : t('credits.popup.creationsLeft', { count: creditsRemaining, plural: creditsRemaining > 1 ? 's' : '' })
            }
          </p>
        </div>

        {/* Plans */}
        <div className={`p-6 ${isPremium ? '' : 'grid md:grid-cols-2'} gap-4`}>
          {/* Show Pro only if user is Free */}
          {isFree && (
            <button
              onClick={() => handleUpgrade('pro')}
              disabled={isLoading}
              className="group text-left p-5 border border-gray-200 hover:border-gray-900 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">{t('credits.plans.pro')}</span>
                <span className="text-sm font-mono text-gray-500">{locale === 'fr' ? '19€' : '$19'}</span>
              </div>
              <div className="text-xs text-gray-400 mb-3">
                {t('credits.plans.proVisuals')}
              </div>
              <div className="text-xs text-gray-900 group-hover:translate-x-1 transition-transform">
                {t('credits.plans.choosePro')}
              </div>
            </button>
          )}

          {/* Show Premium if user is Free or Pro */}
          {!isPremium && (
            <button
              onClick={() => handleUpgrade('premium')}
              disabled={isLoading}
              className="group text-left p-5 border border-gray-200 hover:border-gray-900 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">{t('credits.plans.premium')}</span>
                <span className="text-sm font-mono text-gray-500">{locale === 'fr' ? '49€' : '$49'}</span>
              </div>
              <div className="text-xs text-gray-400 mb-3">
                {t('credits.plans.premiumVisuals')}
              </div>
              <div className="text-xs text-gray-900 group-hover:translate-x-1 transition-transform">
                {t('credits.plans.choosePremium')}
              </div>
            </button>
          )}

          {/* If Premium user, show manage subscription button */}
          {isPremium && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-4">
                {locale === 'fr' ? 'Vous êtes déjà sur le plan Premium !' : 'You\'re already on Premium!'}
              </p>
              <button
                onClick={handleManageSubscription}
                className="text-sm text-gray-900 hover:text-black font-medium transition-colors"
              >
                {locale === 'fr' ? 'Gérer mon abonnement →' : 'Manage subscription →'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex justify-center gap-6">
          {/* Manage subscription link for Pro/Premium users */}
          {!isFree && !isPremium && (
            <button
              onClick={handleManageSubscription}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {locale === 'fr' ? 'Gérer mon abonnement' : 'Manage subscription'}
            </button>
          )}

          {/* Maybe later button */}
          {!isBlocked && (
            <button
              onClick={onClose}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('credits.popup.maybeLater')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// CREDITS TOAST (after each generation)
// ============================================

interface CreditsToastProps {
  creditsRemaining: number;
  isVisible: boolean;
  locale?: 'fr' | 'en';
}

export function CreditsToast({ creditsRemaining, isVisible, locale = 'fr' }: CreditsToastProps) {
  const { t } = useTranslation();
  if (!isVisible) return null;

  const messageMap: Record<number, string> = {
    2: t('credits.toast.twoLeft'),
    1: t('credits.toast.oneLeft'),
    0: t('credits.toast.exhausted'),
  };

  const message = messageMap[creditsRemaining] || '';
  if (!message) return null;

  return (
    <div className={`
      fixed bottom-4 right-4 z-50
      bg-gray-900 text-white px-4 py-3 
      animate-in slide-in-from-bottom-4 fade-in duration-300
      text-sm font-medium
    `}>
      <div className="flex items-center gap-3">
        <span className="font-mono">{t('credits.inline.creditsLeft', { count: creditsRemaining, plural: creditsRemaining > 1 ? 's' : '' })}</span>
        <span className="text-gray-400">—</span>
        <span>{message}</span>
      </div>
    </div>
  );
}

// ============================================
// UPGRADE INLINE CARD (replaces popup - more subtle)
// ============================================

interface UpgradeInlineProps {
  creditsRemaining: number;
  plan: string;
  locale?: 'fr' | 'en';
}

export function UpgradeInline({ creditsRemaining, plan, locale = 'fr' }: UpgradeInlineProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if not free plan, or has more than 1 credit, or dismissed
  if (plan !== 'free' || creditsRemaining > 1 || isDismissed) return null;

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        console.error('Checkout error:', data.error);
        alert(`Erreur: ${data.error}`);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Erreur de connexion. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  const isBlocked = creditsRemaining === 0;

  return (
    <div className={`
      relative border transition-all
      ${isBlocked 
        ? 'bg-gray-900 border-gray-800' 
        : 'bg-gray-50 border-gray-200'
      }
    `}>
      {/* Dismiss button (only if not blocked) */}
      {!isBlocked && (
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      
      <div className="p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className={`font-mono text-2xl font-bold ${isBlocked ? 'text-white' : 'text-gray-900'}`}>
              {creditsRemaining}
            </span>
            <span className={`text-xs font-mono uppercase tracking-wider ${isBlocked ? 'text-gray-500' : 'text-gray-400'}`}>
              {t('credits.inline.creditsLeft', { count: creditsRemaining, plural: creditsRemaining > 1 ? 's' : '' })}
            </span>
          </div>
          <p className={`text-sm ${isBlocked ? 'text-gray-400' : 'text-gray-500'}`}>
            {isBlocked ? t('credits.inline.goPro') : t('credits.inline.lastCredit')}
          </p>
        </div>
        
        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={isLoading}
          className={`
            px-6 py-3 text-sm font-medium whitespace-nowrap transition-all
            ${isBlocked
              ? 'bg-white text-gray-900 hover:bg-gray-100'
              : 'bg-gray-900 text-white hover:bg-black'
            }
            disabled:opacity-50
          `}
        >
          {isLoading ? '...' : t('credits.inline.proCta')}
        </button>
      </div>
    </div>
  );
}
