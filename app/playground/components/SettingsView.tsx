'use client';

import { useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useCredits } from '@/lib/useCredits';
import { useTranslation } from '@/lib/i18n';

interface SettingsViewProps {}

export default function SettingsView({}: SettingsViewProps) {
  const { t } = useTranslation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { credits, loading } = useCredits();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  const handleUpgrade = async (plan: 'pro' | 'premium') => {
    setIsUpgrading(true);
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
        alert(t('settings.errorGeneric', { error: data.error }));
      }
    } catch (err) {
      alert(t('settings.errorConnection'));
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsManaging(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(t('settings.errorGeneric', { error: data.error }));
      }
    } catch (err) {
      alert(t('settings.errorConnection'));
    } finally {
      setIsManaging(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Starter',
      price: t('settings.plans.free'),
      credits: '1-2',
      features: [
        t('settings.plans.freeFeatures.visual'),
        t('settings.plans.freeFeatures.export'),
        t('settings.plans.freeFeatures.brands'),
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '19€/mo',
      credits: '50',
      popular: true,
      features: [
        t('settings.plans.proFeatures.visuals'),
        t('settings.plans.proFeatures.export'),
        t('settings.plans.proFeatures.brands'),
        t('settings.plans.proFeatures.auto'),
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '49€/mo',
      credits: '200',
      features: [
        t('settings.plans.premiumFeatures.visuals'),
        t('settings.plans.premiumFeatures.export'),
        t('settings.plans.premiumFeatures.brands'),
        t('settings.plans.premiumFeatures.auto'),
        t('settings.plans.premiumFeatures.support'),
      ],
    },
  ];

  const currentPlan = credits?.plan || 'free';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          {t('settings.title')}
        </h1>
        <p className="text-gray-500">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Profile Section */}
      <section className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-mono uppercase tracking-wider text-gray-400 mb-4">
          {t('settings.profile')}
        </h2>

        <div className="flex items-center gap-4">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="" className="w-16 h-16 rounded-full" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl text-gray-400">
                {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}

          <div className="flex-1">
            <div className="font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-sm text-gray-500">
              {user?.emailAddresses?.[0]?.emailAddress}
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            {t('settings.signOut')}
          </button>
        </div>
      </section>

      {/* Subscription Section */}
      <section className="bg-white border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono uppercase tracking-wider text-gray-400">
            {t('settings.subscription')}
          </h2>
          {currentPlan !== 'free' && (
            <button
              onClick={handleManageBilling}
              disabled={isManaging}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              {isManaging ? t('common.loading') : t('settings.manageBilling')}
            </button>
          )}
        </div>

        {/* Current Plan Banner */}
        <div className="bg-gray-50 border border-gray-200 p-4 mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 capitalize">{currentPlan}</span>
              {currentPlan !== 'free' && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  {t('settings.active')}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {loading ? '...' : `${credits?.remaining ?? 0} ${t('common.creditsRemaining')}`}
            </div>
          </div>
          {currentPlan === 'free' && (
            <span className="text-xs text-gray-400">
              {t('settings.upgradeToProMore')}
            </span>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const canUpgrade = plan.id !== 'free' && currentPlan === 'free';
            const canSwitch = plan.id !== 'free' && plan.id !== currentPlan && currentPlan !== 'free';

            return (
              <div
                key={plan.id}
                className={`border p-5 relative ${
                  isCurrent 
                    ? 'border-gray-900 bg-gray-50' 
                    : plan.popular 
                      ? 'border-blue-200 bg-blue-50/30' 
                      : 'border-gray-200'
                }`}
              >
                {plan.popular && !isCurrent && (
                  <div className="absolute -top-2.5 left-4 bg-blue-600 text-white text-[10px] font-medium px-2 py-0.5">
                    {t('settings.popular')}
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-2.5 left-4 bg-gray-900 text-white text-[10px] font-medium px-2 py-0.5">
                    {t('settings.current')}
                  </div>
                )}

                <div className="mb-4">
                  <div className="font-semibold text-gray-900">{plan.name}</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{plan.price}</div>
                  <div className="text-xs text-gray-500">{plan.credits} {t('common.credits')}</div>
                </div>

                <ul className="space-y-2 mb-5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {canUpgrade && (
                  <button
                    onClick={() => handleUpgrade(plan.id as 'pro' | 'premium')}
                    disabled={isUpgrading}
                    className={`w-full py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                      plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isUpgrading ? t('common.loading') : t('settings.choosePlan')}
                  </button>
                )}

                {canSwitch && (
                  <button
                    onClick={handleManageBilling}
                    disabled={isManaging}
                    className="w-full py-2.5 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {t('settings.switchPlan')}
                  </button>
                )}

                {isCurrent && (
                  <div className="w-full py-2.5 text-sm font-medium text-center text-gray-400">
                    {t('settings.currentPlan')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Preferences Section */}
      <section className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-mono uppercase tracking-wider text-gray-400 mb-4">
          {t('settings.preferences')}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <div className="font-medium text-gray-900">
                {t('settings.interfaceLanguage')}
              </div>
              <div className="text-sm text-gray-500">
                {t('settings.french')}
              </div>
            </div>
            <span className="text-xs text-gray-400">
              {t('settings.automatic')}
            </span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <div className="font-medium text-gray-900">
                {t('settings.emailNotifications')}
              </div>
              <div className="text-sm text-gray-500">
                {t('settings.getUpdates')}
              </div>
            </div>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
              {t('settings.soon')}
            </span>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-white border border-red-200 p-6">
        <h2 className="text-sm font-mono uppercase tracking-wider text-red-400 mb-4">
          {t('settings.dangerZone')}
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">
              {t('settings.deleteAccount')}
            </div>
            <div className="text-sm text-gray-500">
              {t('settings.deleteAccountWarning')}
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm(t('settings.deleteConfirm'))) {
                // TODO: Implement account deletion
                alert(t('settings.contactSupport'));
              }
            }}
            className="px-4 py-2 text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
          >
            {t('settings.deleteButton')}
          </button>
        </div>
      </section>
    </div>
  );
}
