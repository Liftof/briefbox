'use client';

import { useState, useEffect } from 'react';
import { useCredits, PLAN_NAMES } from '@/lib/useCredits';

interface CreditsWidgetProps {
  isCollapsed?: boolean;
  locale?: 'fr' | 'en';
}

export default function CreditsWidget({ isCollapsed = false, locale = 'fr' }: CreditsWidgetProps) {
  const { credits, loading } = useCredits();
  const [isHovered, setIsHovered] = useState(false);

  const handleUpgrade = async () => {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  const handleManage = async () => {
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

  // Gradient based on credits remaining
  const getGradient = () => {
    if (!credits) return 'from-gray-100 to-gray-200';
    const ratio = credits.remaining / credits.total;
    if (ratio > 0.5) return 'from-blue-50 to-blue-100';
    if (ratio > 0.2) return 'from-amber-50 to-amber-100';
    return 'from-red-50 to-red-100';
  };

  const getTextColor = () => {
    if (!credits) return 'text-gray-600';
    const ratio = credits.remaining / credits.total;
    if (ratio > 0.5) return 'text-blue-600';
    if (ratio > 0.2) return 'text-amber-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className={`bg-gray-100 rounded-lg animate-pulse ${isCollapsed ? 'w-10 h-10 mx-auto' : 'h-16'}`} />
    );
  }

  const isFree = credits?.plan === 'free';
  const isLow = credits && credits.remaining <= 1;

  return (
    <div
      onClick={isFree ? handleUpgrade : handleManage}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative cursor-pointer transition-all duration-200
        bg-gradient-to-br ${getGradient()}
        border border-gray-200 rounded-xl
        hover:shadow-md hover:scale-[1.02]
        ${isCollapsed ? 'p-2' : 'p-3'}
      `}
    >
      {/* Collapsed view */}
      {isCollapsed ? (
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
          ${credits?.plan === 'pro' ? 'bg-blue-500 text-white' :
            credits?.plan === 'premium' ? 'bg-purple-500 text-white' :
            'bg-gray-400 text-white'}
        `}>
          {credits?.remaining ?? '?'}
        </div>
      ) : (
        <>
          {/* Expanded view */}
          <div className="flex items-center gap-3">
            {/* Credits circle */}
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold
              ${credits?.plan === 'pro' ? 'bg-blue-500 text-white' :
                credits?.plan === 'premium' ? 'bg-purple-500 text-white' :
                'bg-gray-500 text-white'}
            `}>
              {credits?.remaining ?? '?'}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-900">
                  {PLAN_NAMES[credits?.plan || 'free']}
                </span>
                {isFree && (
                  <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-medium">
                    {locale === 'fr' ? 'Upgrade' : 'Upgrade'}
                  </span>
                )}
              </div>
              <div className={`text-[11px] ${getTextColor()}`}>
                {credits?.remaining ?? 0} / {credits?.total ?? 3} {locale === 'fr' ? 'crédits' : 'credits'}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                credits?.plan === 'pro' ? 'bg-blue-500' :
                credits?.plan === 'premium' ? 'bg-purple-500' :
                isLow ? 'bg-red-500' : 'bg-gray-500'
              }`}
              style={{ width: `${((credits?.remaining ?? 0) / (credits?.total ?? 3)) * 100}%` }}
            />
          </div>

          {/* Hover CTA */}
          {isHovered && isFree && (
            <div className="absolute inset-0 bg-blue-500/95 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {locale === 'fr' ? '→ Passer à Pro' : '→ Go Pro'}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================
// UPGRADE POPUP (after free generations used)
// ============================================

interface UpgradePopupProps {
  isOpen: boolean;
  onClose: () => void;
  creditsUsed: number;
  locale?: 'fr' | 'en';
}

export function UpgradePopup({ isOpen, onClose, creditsUsed, locale = 'fr' }: UpgradePopupProps) {
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
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const content = {
    fr: {
      title: creditsUsed >= 3 ? 'Vos crédits gratuits sont épuisés !' : 'Vous aimez ce que vous voyez ?',
      subtitle: creditsUsed >= 3 
        ? 'Passez à Pro pour continuer à créer des visuels incroyables.'
        : `Plus que ${3 - creditsUsed} création${3 - creditsUsed > 1 ? 's' : ''} gratuite${3 - creditsUsed > 1 ? 's' : ''} ! Passez à Pro pour générer sans limite.`,
      pro: {
        name: 'Pro',
        price: '19€/mois',
        credits: '50 visuels/mois',
        features: ['Tous les formats', 'Historique illimité', 'Support prioritaire'],
        cta: 'Passer à Pro →',
      },
      premium: {
        name: 'Premium',
        price: '49€/mois',
        credits: '150 visuels/mois',
        features: ['Tout de Pro', '3 membres', 'API access'],
        cta: 'Passer à Premium →',
      },
      later: 'Plus tard',
    },
    en: {
      title: creditsUsed >= 3 ? 'Your free credits are gone!' : 'Loving what you see?',
      subtitle: creditsUsed >= 3 
        ? 'Go Pro to keep creating amazing visuals.'
        : `Only ${3 - creditsUsed} free creation${3 - creditsUsed > 1 ? 's' : ''} left! Go Pro for unlimited generation.`,
      pro: {
        name: 'Pro',
        price: '$19/mo',
        credits: '50 visuals/mo',
        features: ['All formats', 'Unlimited history', 'Priority support'],
        cta: 'Go Pro →',
      },
      premium: {
        name: 'Premium',
        price: '$49/mo',
        credits: '150 visuals/mo',
        features: ['Everything in Pro', '3 team members', 'API access'],
        cta: 'Go Premium →',
      },
      later: 'Maybe later',
    },
  };

  const t = content[locale];
  const isBlocked = creditsUsed >= 3;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-8 text-center text-white">
          <div className="text-4xl mb-3">✨</div>
          <h2 className="text-2xl font-bold mb-2">{t.title}</h2>
          <p className="text-white/80">{t.subtitle}</p>
        </div>

        {/* Plans */}
        <div className="p-6 grid md:grid-cols-2 gap-4">
          {/* Pro */}
          <div className="border-2 border-blue-200 rounded-xl p-5 hover:border-blue-400 transition-colors bg-blue-50/50">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-lg text-gray-900">{t.pro.name}</span>
              <span className="text-blue-600 font-semibold">{t.pro.price}</span>
            </div>
            <div className="text-sm text-gray-500 mb-4">{t.pro.credits}</div>
            <ul className="space-y-2 mb-5">
              {t.pro.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-blue-500">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade('pro')}
              disabled={isLoading}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? '...' : t.pro.cta}
            </button>
          </div>

          {/* Premium */}
          <div className="border-2 border-purple-200 rounded-xl p-5 hover:border-purple-400 transition-colors bg-purple-50/50">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-lg text-gray-900">{t.premium.name}</span>
              <span className="text-purple-600 font-semibold">{t.premium.price}</span>
            </div>
            <div className="text-sm text-gray-500 mb-4">{t.premium.credits}</div>
            <ul className="space-y-2 mb-5">
              {t.premium.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-purple-500">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade('premium')}
              disabled={isLoading}
              className="w-full py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? '...' : t.premium.cta}
            </button>
          </div>
        </div>

        {/* Footer */}
        {!isBlocked && (
          <div className="px-6 pb-6 text-center">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
            >
              {t.later}
            </button>
          </div>
        )}
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
  if (!isVisible) return null;

  const messages = {
    fr: {
      2: "🎨 Super ! Plus que 2 créations gratuites.",
      1: "⚡ Dernière création gratuite ! Pensez à upgrader.",
      0: "🔒 Crédits épuisés. Passez à Pro pour continuer !",
    },
    en: {
      2: "🎨 Great! 2 free creations left.",
      1: "⚡ Last free creation! Consider upgrading.",
      0: "🔒 No credits left. Go Pro to continue!",
    },
  };

  const message = messages[locale][creditsRemaining as 0 | 1 | 2] || '';
  if (!message) return null;

  return (
    <div className={`
      fixed bottom-4 right-4 z-50
      bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg
      animate-in slide-in-from-bottom-4 fade-in duration-300
      ${creditsRemaining === 0 ? 'bg-red-600' : creditsRemaining === 1 ? 'bg-amber-600' : 'bg-gray-900'}
    `}>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
