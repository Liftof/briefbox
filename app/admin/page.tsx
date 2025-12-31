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
  limits: {
    capacityLimit: number;
    deepScrapeLimit: number;
    earlyBirdLimit: number;
    signupsTodayFromCounter: number;
    deepScrapesTodayFromCounter: number;
    earlyBirdsTotal: number;
    deepScrapesAllTime: number;
    lightScrapesAllTime: number;
    resetIn: { hours: number; minutes: number; ms: number };
  };
  userList: {
    email: string;
    name: string | null;
    plan: string;
    isEarlyBird: boolean | null;
    createdAt: string | null;
  }[];
  pricing: Record<string, any>;
}

// Pricing for revenue calculation
const PRICING = {
  pro: 19,
  premium: 49,
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
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-secondary/50">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl">{error}</p>
          <button onClick={() => router.push('/')} className="mt-4 text-secondary/50 hover:text-secondary underline">
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
  const projectedCosts = stats.costs.totals.projectedMonth;

  // Profit
  const profit = mrr - projectedCosts;
  const isProfit = profit >= 0;

  return (
    <div className="min-h-screen bg-page p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
            <p className="text-secondary/50 text-sm mt-1">Vue d'ensemble Palette</p>
          </div>
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="text-sm text-secondary/50 hover:text-secondary disabled:opacity-50 flex items-center gap-2 px-4 py-2 bg-white border border-stroke rounded-epopian hover:shadow-sm transition-all"
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
        </div>

        {/* Main Metrics - 4 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

          {/* 1. Users */}
          <div className="bg-white border border-stroke rounded-epopian p-8 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
              <span className="text-secondary/60 text-sm font-medium">Utilisateurs</span>
              <span className="text-xs text-secondary/40 bg-page px-2 py-1 rounded-full">+{stats.signups.last7Days} cette semaine</span>
            </div>
            <div className="text-5xl font-semibold text-primary mb-6">{stats.users.total}</div>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-stroke"></div>
                <span className="text-secondary/60">{stats.users.byPlan.free} gratuits</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent"></div>
                <span className="text-secondary/60">{payingCustomers} payants</span>
              </div>
            </div>
          </div>

          {/* 2. Revenue */}
          <div className="bg-white border border-stroke rounded-epopian p-8 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
              <span className="text-secondary/60 text-sm font-medium">Revenus mensuels</span>
              <span className="text-xs text-secondary/40 bg-page px-2 py-1 rounded-full">{conversionRate.toFixed(1)}% conversion</span>
            </div>
            <div className="text-5xl font-semibold text-primary mb-6">€{mrr}</div>
            <div className="flex gap-6 text-sm text-secondary/60">
              <span>{stats.users.byPlan.pro} Pro × €{PRICING.pro}</span>
              <span>{stats.users.byPlan.premium} Premium × €{PRICING.premium}</span>
            </div>
          </div>

          {/* 3. Costs */}
          <div className="bg-white border border-stroke rounded-epopian p-8 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
              <span className="text-secondary/60 text-sm font-medium">Coûts mensuels</span>
              <span className="text-xs text-secondary/40 bg-page px-2 py-1 rounded-full">projeté</span>
            </div>
            <div className="text-5xl font-semibold text-primary mb-6">${projectedCosts.toFixed(0)}</div>
            <div className="space-y-2 text-sm text-secondary/60">
              <div className="flex justify-between">
                <span>Gemini</span>
                <span className="font-mono">${stats.costs.gemini.thisMonth.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Firecrawl + LLM</span>
                <span className="font-mono">${(stats.costs.firecrawl.thisMonth + stats.costs.openrouter.estimated).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Infra</span>
                <span className="font-mono">${stats.costs.fixed.vercelPro.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 4. Profit/Loss */}
          <div className={`border rounded-epopian p-8 shadow-sm hover:shadow-md transition-all ${isProfit ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <span className={`text-sm font-medium ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                {isProfit ? 'Bénéfice' : 'Perte'} estimé
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${isProfit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                MRR − Coûts
              </span>
            </div>
            <div className={`text-5xl font-semibold mb-6 ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
              {isProfit ? '+' : ''}€{profit.toFixed(0)}
            </div>
            <div className={`text-sm ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {isProfit
                ? `Marge: ${mrr > 0 ? ((profit / mrr) * 100).toFixed(0) : 0}%`
                : `Il te faut ${Math.ceil(Math.abs(profit) / PRICING.pro)} abonnés Pro de plus`
              }
            </div>
          </div>
        </div>

        {/* Activity Today */}
        <div className="bg-white border border-stroke rounded-epopian p-8 shadow-sm mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            <span className="text-secondary/60 text-sm font-medium">Aujourd'hui</span>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-semibold text-primary">{stats.signups.today}</div>
              <div className="text-sm text-secondary/50 mt-1">inscriptions</div>
            </div>
            <div>
              <div className="text-4xl font-semibold text-primary">{stats.generations.today}</div>
              <div className="text-sm text-secondary/50 mt-1">images générées</div>
            </div>
            <div>
              <div className="text-4xl font-semibold text-primary">${stats.costs.totals.today.toFixed(2)}</div>
              <div className="text-sm text-secondary/50 mt-1">dépensés</div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white border border-stroke rounded-epopian p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-secondary/60 text-sm font-medium">Inscriptions (14j)</span>
              </div>
              <span className="text-xs text-secondary/40 font-mono">
                Total: {stats.charts.dailySignups.slice(-14).reduce((sum, d) => sum + d.count, 0)}
              </span>
            </div>
            <div className="flex items-end gap-1 h-24">
              {stats.charts.dailySignups.slice(-14).map((d, i) => {
                const max = Math.max(...stats.charts.dailySignups.slice(-14).map(x => x.count), 1);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <span className="text-[10px] text-secondary/40 mb-1">{d.count || ''}</span>
                    <div
                      className="w-full bg-accent/20 hover:bg-accent/40 rounded-t transition-colors cursor-pointer"
                      style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? '4px' : '2px' }}
                      title={`${d.date}: ${d.count}`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-secondary/30">
              <span>{stats.charts.dailySignups.slice(-14)[0]?.date.slice(5) || ''}</span>
              <span>{stats.charts.dailySignups.slice(-14).slice(-1)[0]?.date.slice(5) || ''}</span>
            </div>
          </div>
          <div className="bg-white border border-stroke rounded-epopian p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-secondary/60 text-sm font-medium">Générations (14j)</span>
              </div>
              <span className="text-xs text-secondary/40 font-mono">
                Total: {stats.charts.dailyGenerations.slice(-14).reduce((sum, d) => sum + d.count, 0)}
              </span>
            </div>
            <div className="flex items-end gap-1 h-24">
              {stats.charts.dailyGenerations.slice(-14).map((d, i) => {
                const max = Math.max(...stats.charts.dailyGenerations.slice(-14).map(x => x.count), 1);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <span className="text-[10px] text-secondary/40 mb-1">{d.count || ''}</span>
                    <div
                      className="w-full bg-green-100 hover:bg-green-200 rounded-t transition-colors cursor-pointer"
                      style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? '4px' : '2px' }}
                      title={`${d.date}: ${d.count}`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-secondary/30">
              <span>{stats.charts.dailyGenerations.slice(-14)[0]?.date.slice(5) || ''}</span>
              <span>{stats.charts.dailyGenerations.slice(-14).slice(-1)[0]?.date.slice(5) || ''}</span>
            </div>
          </div>
        </div>

        {/* Limits Status */}
        <div className="bg-white border border-stroke rounded-epopian p-8 shadow-sm mb-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-secondary/30 rounded-full"></div>
              <span className="text-secondary/60 text-sm font-medium">Limites quotidiennes</span>
            </div>
            <span className="text-xs text-secondary/40 bg-page px-3 py-1 rounded-full font-mono">
              Reset dans {stats.limits.resetIn.hours}h {stats.limits.resetIn.minutes}m
            </span>
          </div>
          <div className="space-y-4">
            {/* Signups */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-secondary/60">Inscriptions</span>
                <span className="text-secondary/40 font-mono">{stats.limits.signupsTodayFromCounter} / {stats.limits.capacityLimit}</span>
              </div>
              <div className="h-2 bg-page rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${Math.min((stats.limits.signupsTodayFromCounter / stats.limits.capacityLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
            {/* Early Birds */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-secondary/60">Early Birds (2 crédits)</span>
                <span className="text-secondary/40 font-mono">{stats.limits.earlyBirdsTotal} total</span>
              </div>
              <div className="text-xs text-secondary/40">Les 30 premiers inscrits/jour reçoivent 2 crédits au lieu de 1</div>
            </div>
            {/* Deep Scrapes */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-secondary/60">Deep Scrapes (aujourd&apos;hui)</span>
                <span className="text-secondary/40 font-mono">{stats.limits.deepScrapesTodayFromCounter} / {stats.limits.deepScrapeLimit}</span>
              </div>
              <div className="h-2 bg-page rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min((stats.limits.deepScrapesTodayFromCounter / stats.limits.deepScrapeLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
            {/* Scrape Breakdown */}
            <div className="pt-2 border-t border-stroke">
              <div className="flex justify-between text-sm">
                <span className="text-secondary/60">Scrapes totaux</span>
                <div className="flex gap-4 text-secondary/40 font-mono text-xs">
                  <span>{stats.limits.deepScrapesAllTime} deep</span>
                  <span>{stats.limits.lightScrapesAllTime} light</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="bg-white border border-stroke rounded-epopian p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="text-secondary/60 text-sm font-medium">Utilisateurs récents</span>
            </div>
            <span className="text-xs text-secondary/40">{stats.userList.length} affichés</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-secondary/40 border-b border-stroke">
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Nom</th>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Early Bird</th>
                  <th className="pb-3 font-medium">Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                {stats.userList.map((u, i) => (
                  <tr key={i} className="border-b border-stroke/50 hover:bg-page/50">
                    <td className="py-3 text-secondary font-mono text-xs">{u.email}</td>
                    <td className="py-3 text-secondary/60">{u.name || '-'}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        u.plan === 'premium' ? 'bg-purple-100 text-purple-700' :
                        u.plan === 'pro' ? 'bg-accent/10 text-accent' :
                        'bg-page text-secondary/50'
                      }`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="py-3">
                      {u.isEarlyBird && <span className="text-xs text-green-600">Oui</span>}
                    </td>
                    <td className="py-3 text-secondary/40 text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-secondary/30 text-xs">
          Coût max/jour: ~${(stats.limits.capacityLimit * 1.1 * stats.costs.gemini.perImage).toFixed(0)} •
          Coût max/mois: ~${(stats.limits.capacityLimit * 1.1 * stats.costs.gemini.perImage * 30).toFixed(0)}
        </div>
      </div>
    </div>
  );
}
