'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface Stats {
  timestamp: string;
  users: {
    total: number;
    byPlan: { free: number; pro: number; premium: number };
  };
  brands: { total: number };
  generations: {
    total: number;
    thisMonth: number;
    last7Days: number;
    today: number;
  };
  signups: { today: number; last7Days: number; thisMonth: number };
  deepScrapes: { today: number; last7Days: number; total: number };
  costs: {
    gemini: { today: number; last7Days: number; thisMonth: number; allTime: number; perImage: number };
    firecrawl: { today: number; last7Days: number; thisMonth: number; perDeepScrape: number };
    openrouter: { estimated: number; perAnalysis: number };
    fixed: { vercelPro: number; upstash: number; resend: number; clerk: number };
    totals: { today: number; last7Days: number; thisMonth: number; allTime: number; projectedMonth: number };
  };
  charts: {
    dailySignups: { date: string; count: number }[];
    dailyGenerations: { date: string; count: number }[];
  };
  limits: { capacityLimit: number; deepScrapeLimit: number; earlyBirdLimit: number };
  pricing: Record<string, any>;
}

// Pricing for revenue calculation
const PRICING = {
  pro: 19,      // €/month
  premium: 49,  // €/month
};

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) {
        if (res.status === 403) {
          setError('Accès refusé');
          return;
        }
        throw new Error('Failed to fetch stats');
      }
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError('Erreur de chargement');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }
    if (user) fetchStats();
  }, [user, isLoaded, router, fetchStats]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl">{error}</p>
          <button onClick={() => router.push('/')} className="mt-4 text-gray-500 hover:text-gray-700 underline">
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Calculate revenue
  const mrr = (stats.users.byPlan.pro * PRICING.pro) + (stats.users.byPlan.premium * PRICING.premium);
  const payingCustomers = stats.users.byPlan.pro + stats.users.byPlan.premium;
  const conversionRate = stats.users.total > 0 ? (payingCustomers / stats.users.total * 100) : 0;

  // Costs
  const monthlyCosts = stats.costs.totals.thisMonth;
  const projectedCosts = stats.costs.totals.projectedMonth;

  // Profit
  const profit = mrr - projectedCosts;
  const isProfit = profit >= 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Vue d'ensemble Palette</p>
          </div>
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
        </div>

        {/* Main Metrics - The 4 questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

          {/* 1. Users */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 text-sm font-medium">Utilisateurs</span>
              <span className="text-xs text-gray-400">+{stats.signups.last7Days} cette semaine</span>
            </div>
            <div className="text-4xl font-semibold text-gray-900 mb-4">{stats.users.total}</div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                <span className="text-gray-600">{stats.users.byPlan.free} gratuits</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">{payingCustomers} payants</span>
              </div>
            </div>
          </div>

          {/* 2. Revenue */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 text-sm font-medium">Revenus mensuels</span>
              <span className="text-xs text-gray-400">{conversionRate.toFixed(1)}% conversion</span>
            </div>
            <div className="text-4xl font-semibold text-gray-900 mb-4">€{mrr}</div>
            <div className="flex gap-4 text-sm">
              <div className="text-gray-600">{stats.users.byPlan.pro} Pro × €{PRICING.pro}</div>
              <div className="text-gray-600">{stats.users.byPlan.premium} Premium × €{PRICING.premium}</div>
            </div>
          </div>

          {/* 3. Costs */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 text-sm font-medium">Coûts mensuels</span>
              <span className="text-xs text-gray-400">projeté fin de mois</span>
            </div>
            <div className="text-4xl font-semibold text-gray-900 mb-4">${projectedCosts.toFixed(0)}</div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Gemini (images)</span>
                <span className="font-mono">${stats.costs.gemini.thisMonth.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Firecrawl + OpenRouter</span>
                <span className="font-mono">${(stats.costs.firecrawl.thisMonth + stats.costs.openrouter.estimated).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Infra (Vercel, etc)</span>
                <span className="font-mono">${stats.costs.fixed.vercelPro.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 4. Profit/Loss */}
          <div className={`rounded-2xl p-6 shadow-sm border ${isProfit ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-medium ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                {isProfit ? 'Bénéfice' : 'Perte'} estimé
              </span>
              <span className={`text-xs ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                MRR - Coûts
              </span>
            </div>
            <div className={`text-4xl font-semibold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
              {isProfit ? '+' : ''}€{profit.toFixed(0)}
            </div>
            <div className={`mt-4 text-sm ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {isProfit
                ? `Marge: ${mrr > 0 ? ((profit / mrr) * 100).toFixed(0) : 0}%`
                : `Il te faut ${Math.ceil(Math.abs(profit) / PRICING.pro)} abonnés Pro de plus`
              }
            </div>
          </div>
        </div>

        {/* Activity Today */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-10">
          <h2 className="text-gray-500 text-sm font-medium mb-4">Aujourd'hui</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-semibold text-gray-900">{stats.signups.today}</div>
              <div className="text-sm text-gray-500">inscriptions</div>
            </div>
            <div>
              <div className="text-3xl font-semibold text-gray-900">{stats.generations.today}</div>
              <div className="text-sm text-gray-500">images générées</div>
            </div>
            <div>
              <div className="text-3xl font-semibold text-gray-900">${stats.costs.totals.today.toFixed(2)}</div>
              <div className="text-sm text-gray-500">dépensés</div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-gray-500 text-sm font-medium mb-4">Inscriptions (14j)</h2>
            <div className="flex items-end gap-1 h-20">
              {stats.charts.dailySignups.slice(-14).map((d, i) => {
                const max = Math.max(...stats.charts.dailySignups.slice(-14).map(x => x.count), 1);
                return (
                  <div
                    key={i}
                    className="flex-1 bg-blue-100 hover:bg-blue-200 rounded-t transition-colors"
                    style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }}
                    title={`${d.date}: ${d.count}`}
                  />
                );
              })}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-gray-500 text-sm font-medium mb-4">Générations (14j)</h2>
            <div className="flex items-end gap-1 h-20">
              {stats.charts.dailyGenerations.slice(-14).map((d, i) => {
                const max = Math.max(...stats.charts.dailyGenerations.slice(-14).map(x => x.count), 1);
                return (
                  <div
                    key={i}
                    className="flex-1 bg-green-100 hover:bg-green-200 rounded-t transition-colors"
                    style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }}
                    title={`${d.date}: ${d.count}`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Limits Status */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-gray-500 text-sm font-medium mb-4">Limites quotidiennes</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Inscriptions</span>
                <span className="text-gray-400">{stats.signups.today} / {stats.limits.capacityLimit}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min((stats.signups.today / stats.limits.capacityLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Deep scrapes</span>
                <span className="text-gray-400">{stats.deepScrapes.today} / {stats.limits.deepScrapeLimit}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min((stats.deepScrapes.today / stats.limits.deepScrapeLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400 text-xs">
          Coût max/jour: ~${(stats.limits.capacityLimit * 1.1 * stats.costs.gemini.perImage).toFixed(0)} •
          Coût max/mois: ~${(stats.limits.capacityLimit * 1.1 * stats.costs.gemini.perImage * 30).toFixed(0)}
        </div>
      </div>
    </div>
  );
}
