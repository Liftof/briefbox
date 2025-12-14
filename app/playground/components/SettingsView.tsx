'use client';

import { useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useCredits } from '@/lib/useCredits';

interface SettingsViewProps {
  locale: 'fr' | 'en';
}

export default function SettingsView({ locale }: SettingsViewProps) {
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
        alert(`Erreur: ${data.error}`);
      }
    } catch (err) {
      alert('Erreur de connexion');
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
        alert(`Erreur: ${data.error}`);
      }
    } catch (err) {
      alert('Erreur de connexion');
    } finally {
      setIsManaging(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Starter',
      price: locale === 'fr' ? 'Gratuit' : 'Free',
      credits: '1-2',
      features: [
        locale === 'fr' ? '1 visuel offert' : '1 free visual',
        locale === 'fr' ? 'Export 2K' : '2K export',
        locale === 'fr' ? '1 marque' : '1 brand',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '19€/mo',
      credits: '50',
      popular: true,
      features: [
        locale === 'fr' ? '50 visuels/mois' : '50 visuals/mo',
        locale === 'fr' ? 'Export 4K' : '4K export',
        locale === 'fr' ? '5 marques' : '5 brands',
        locale === 'fr' ? '1 visuel auto/jour' : '1 auto visual/day',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '49€/mo',
      credits: '200',
      features: [
        locale === 'fr' ? '200 visuels/mois' : '200 visuals/mo',
        locale === 'fr' ? 'Export 4K' : '4K export',
        locale === 'fr' ? 'Marques illimitées' : 'Unlimited brands',
        locale === 'fr' ? '1 visuel auto/jour' : '1 auto visual/day',
        locale === 'fr' ? 'Support prioritaire' : 'Priority support',
      ],
    },
  ];

  const currentPlan = credits?.plan || 'free';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          {locale === 'fr' ? 'Réglages' : 'Settings'}
        </h1>
        <p className="text-gray-500">
          {locale === 'fr' ? 'Gérez votre compte et votre abonnement' : 'Manage your account and subscription'}
        </p>
      </div>

      {/* Profile Section */}
      <section className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-mono uppercase tracking-wider text-gray-400 mb-4">
          {locale === 'fr' ? 'Profil' : 'Profile'}
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
            {locale === 'fr' ? 'Déconnexion' : 'Sign out'}
          </button>
        </div>
      </section>

      {/* Subscription Section */}
      <section className="bg-white border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono uppercase tracking-wider text-gray-400">
            {locale === 'fr' ? 'Abonnement' : 'Subscription'}
          </h2>
          {currentPlan !== 'free' && (
            <button
              onClick={handleManageBilling}
              disabled={isManaging}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              {isManaging 
                ? (locale === 'fr' ? 'Chargement...' : 'Loading...') 
                : (locale === 'fr' ? 'Gérer la facturation' : 'Manage billing')
              }
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
                  {locale === 'fr' ? 'Actif' : 'Active'}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {loading ? '...' : `${credits?.remaining ?? 0} ${locale === 'fr' ? 'crédits restants' : 'credits remaining'}`}
            </div>
          </div>
          {currentPlan === 'free' && (
            <span className="text-xs text-gray-400">
              {locale === 'fr' ? 'Passez à Pro pour plus de visuels' : 'Upgrade to Pro for more visuals'}
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
                    {locale === 'fr' ? 'POPULAIRE' : 'POPULAR'}
                  </div>
                )}
                
                {isCurrent && (
                  <div className="absolute -top-2.5 left-4 bg-gray-900 text-white text-[10px] font-medium px-2 py-0.5">
                    {locale === 'fr' ? 'ACTUEL' : 'CURRENT'}
                  </div>
                )}

                <div className="mb-4">
                  <div className="font-semibold text-gray-900">{plan.name}</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{plan.price}</div>
                  <div className="text-xs text-gray-500">{plan.credits} {locale === 'fr' ? 'crédits' : 'credits'}</div>
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
                    {isUpgrading 
                      ? (locale === 'fr' ? 'Chargement...' : 'Loading...') 
                      : (locale === 'fr' ? 'Choisir ce plan' : 'Choose this plan')
                    }
                  </button>
                )}

                {canSwitch && (
                  <button
                    onClick={handleManageBilling}
                    disabled={isManaging}
                    className="w-full py-2.5 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {locale === 'fr' ? 'Changer de plan' : 'Switch plan'}
                  </button>
                )}

                {isCurrent && (
                  <div className="w-full py-2.5 text-sm font-medium text-center text-gray-400">
                    {locale === 'fr' ? 'Plan actuel' : 'Current plan'}
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
          {locale === 'fr' ? 'Préférences' : 'Preferences'}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <div className="font-medium text-gray-900">
                {locale === 'fr' ? 'Langue de l\'interface' : 'Interface language'}
              </div>
              <div className="text-sm text-gray-500">
                {locale === 'fr' ? 'Français' : 'English'}
              </div>
            </div>
            <span className="text-xs text-gray-400">
              {locale === 'fr' ? 'Automatique (navigateur)' : 'Automatic (browser)'}
            </span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <div className="font-medium text-gray-900">
                {locale === 'fr' ? 'Notifications email' : 'Email notifications'}
              </div>
              <div className="text-sm text-gray-500">
                {locale === 'fr' ? 'Recevez des updates sur vos visuels' : 'Get updates about your visuals'}
              </div>
            </div>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
              {locale === 'fr' ? 'Bientôt' : 'Soon'}
            </span>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-white border border-red-200 p-6">
        <h2 className="text-sm font-mono uppercase tracking-wider text-red-400 mb-4">
          {locale === 'fr' ? 'Zone dangereuse' : 'Danger zone'}
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">
              {locale === 'fr' ? 'Supprimer mon compte' : 'Delete my account'}
            </div>
            <div className="text-sm text-gray-500">
              {locale === 'fr' 
                ? 'Supprime définitivement votre compte et toutes vos données' 
                : 'Permanently delete your account and all data'
              }
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm(locale === 'fr' 
                ? 'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.' 
                : 'Are you sure you want to delete your account? This action cannot be undone.'
              )) {
                // TODO: Implement account deletion
                alert(locale === 'fr' ? 'Contactez support@usepalette.app' : 'Contact support@usepalette.app');
              }
            }}
            className="px-4 py-2 text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
          >
            {locale === 'fr' ? 'Supprimer' : 'Delete'}
          </button>
        </div>
      </section>
    </div>
  );
}
