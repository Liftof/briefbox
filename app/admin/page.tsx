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
    gemini: {
      today: number;
      last7Days: number;
      thisMonth: number;
      allTime: number;
      perImage: number;
    };
    firecrawl: {
      today: number;
      last7Days: number;
      thisMonth: number;
      perDeepScrape: number;
    };
    openrouter: { estimated: number; perAnalysis: number };
    fixed: { vercelPro: number; upstash: number; resend: number; clerk: number };
    totals: {
      today: number;
      last7Days: number;
      thisMonth: number;
      allTime: number;
      projectedMonth: number;
    };
  };
  charts: {
    dailySignups: { date: string; count: number }[];
    dailyGenerations: { date: string; count: number }[];
  };
  limits: { capacityLimit: number; deepScrapeLimit: number; earlyBirdLimit: number };
  pricing: Record<string, any>;
}

function StatCard({ title, value, subtitle, color = 'blue', small = false }: {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
  small?: boolean;
}) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    gray: 'bg-white/5 border-white/10 text-white/70',
  };

  return (
    <div className={`rounded-xl border p-${small ? '4' : '6'} ${colors[color]}`}>
      <p className="text-sm opacity-70">{title}</p>
      <p className={`${small ? 'text-2xl' : 'text-3xl'} font-bold mt-1`}>{value}</p>
      {subtitle && <p className="text-xs opacity-50 mt-1">{subtitle}</p>}
    </div>
  );
}

function MiniChart({ data, label, maxValue, color = 'blue' }: {
  data: { date: string; count: number }[];
  label: string;
  maxValue?: number;
  color?: 'blue' | 'green' | 'purple';
}) {
  const max = maxValue || Math.max(...data.map(d => d.count), 1);
  const colors = {
    blue: 'bg-blue-500/50 hover:bg-blue-500',
    green: 'bg-green-500/50 hover:bg-green-500',
    purple: 'bg-purple-500/50 hover:bg-purple-500',
  };

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
      <p className="text-sm text-white/70 mb-4">{label}</p>
      <div className="flex items-end gap-1 h-24">
        {data.slice(-14).map((d, i) => (
          <div
            key={i}
            className={`flex-1 ${colors[color]} rounded-t transition-colors cursor-pointer group relative`}
            style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }}
          >
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
              {d.date}: {d.count}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-white/30 mt-2">
        <span>{data[data.length - 14]?.date?.slice(5) || ''}</span>
        <span>{data[data.length - 1]?.date?.slice(5) || ''}</span>
      </div>
    </div>
  );
}

function ProgressBar({ value, max, label, color = 'blue' }: {
  value: number;
  max: number;
  label: string;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-white/70">{label}</span>
        <span className="text-white/50">{value} / {max}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color]} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function CostRow({ label, value, subtext }: { label: string; value: number; subtext?: string }) {
  return (
    <div className="flex justify-between items-center py-2">
      <div>
        <span className="text-white/70">{label}</span>
        {subtext && <span className="text-white/30 text-xs ml-2">({subtext})</span>}
      </div>
      <span className={`font-mono ${value > 0 ? 'text-green-400' : 'text-white/30'}`}>
        ${value.toFixed(2)}
      </span>
    </div>
  );
}

function RefreshButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-lg transition-colors"
    >
      <svg
        className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {loading ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) {
        if (res.status === 403) {
          setError('Access denied. Admin only.');
          return;
        }
        throw new Error('Failed to fetch stats');
      }
      const data = await res.json();
      setStats(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard');
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
    if (user) {
      fetchStats();
    }
  }, [user, isLoaded, router, fetchStats]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-white/50 hover:text-white underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const costStatus = stats.costs.totals.thisMonth > 500 ? 'red' :
                     stats.costs.totals.thisMonth > 200 ? 'orange' : 'green';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-white/50 mt-1">Palette Analytics</p>
          </div>
          <div className="flex items-center gap-4">
            <RefreshButton onClick={() => fetchStats(true)} loading={refreshing} />
            <div className="text-right text-sm">
              <p className="text-white/50">Last updated</p>
              <p className="text-white/70">{lastUpdated?.toLocaleString('fr-FR')}</p>
            </div>
          </div>
        </div>

        {/* Main Stats - 5 columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard
            title="Total Users"
            value={stats.users.total}
            subtitle={`+${stats.signups.last7Days} (7d)`}
            color="blue"
          />
          <StatCard
            title="Total Brands"
            value={stats.brands.total}
            color="purple"
          />
          <StatCard
            title="Generations"
            value={stats.generations.thisMonth}
            subtitle={`${stats.generations.total} total`}
            color="green"
          />
          <StatCard
            title="Today"
            value={stats.generations.today}
            subtitle={`${stats.signups.today} signups`}
            color="gray"
          />
          <StatCard
            title="Cost (Month)"
            value={`$${stats.costs.totals.thisMonth.toFixed(0)}`}
            subtitle={`~$${stats.costs.totals.projectedMonth.toFixed(0)} projected`}
            color={costStatus}
          />
        </div>

        {/* Second Row - Users, Limits, Quick Costs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Users by Plan */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <p className="text-sm text-white/70 mb-4">Users by Plan</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Free</span>
                <span className="text-2xl font-bold text-blue-400">{stats.users.byPlan.free}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Pro</span>
                <span className="text-2xl font-bold text-green-400">{stats.users.byPlan.pro}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Premium</span>
                <span className="text-2xl font-bold text-purple-400">{stats.users.byPlan.premium}</span>
              </div>
            </div>
          </div>

          {/* Today's Limits */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <p className="text-sm text-white/70 mb-4">Today vs Limits</p>
            <ProgressBar
              value={stats.signups.today}
              max={stats.limits.capacityLimit}
              label="Signups"
              color={stats.signups.today > 250 ? 'orange' : 'blue'}
            />
            <ProgressBar
              value={stats.deepScrapes.today}
              max={stats.limits.deepScrapeLimit}
              label="Deep Scrapes"
              color={stats.deepScrapes.today > 120 ? 'orange' : 'green'}
            />
            <ProgressBar
              value={stats.generations.today}
              max={330}
              label="Generations"
              color={stats.generations.today > 300 ? 'orange' : 'purple'}
            />
          </div>

          {/* Cost Summary */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6 md:col-span-2">
            <p className="text-sm text-white/70 mb-4">Cost Summary</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-white/50">Today</p>
                <p className="text-2xl font-bold text-green-400">${stats.costs.totals.today.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Last 7 Days</p>
                <p className="text-2xl font-bold text-blue-400">${stats.costs.totals.last7Days.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">This Month</p>
                <p className={`text-2xl font-bold ${costStatus === 'red' ? 'text-red-400' : costStatus === 'orange' ? 'text-orange-400' : 'text-green-400'}`}>
                  ${stats.costs.totals.thisMonth.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Cost Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Variable Costs */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <p className="text-sm text-white/70 mb-4">Variable Costs (This Month)</p>
            <div className="divide-y divide-white/5">
              <CostRow
                label="Gemini (Images)"
                value={stats.costs.gemini.thisMonth}
                subtext={`${stats.generations.thisMonth} × $${stats.costs.gemini.perImage}`}
              />
              <CostRow
                label="Firecrawl (Scrapes)"
                value={stats.costs.firecrawl.thisMonth}
                subtext={`${stats.deepScrapes.total} deep scrapes`}
              />
              <CostRow
                label="OpenRouter (LLM)"
                value={stats.costs.openrouter.estimated}
                subtext="estimated"
              />
              <CostRow
                label="Resend (Emails)"
                value={stats.costs.fixed.resend}
                subtext={stats.costs.fixed.resend > 0 ? 'over 3K free' : 'free tier'}
              />
              <CostRow
                label="Clerk (Auth)"
                value={stats.costs.fixed.clerk}
                subtext={stats.costs.fixed.clerk > 0 ? 'over 10K MAU' : 'free tier'}
              />
            </div>
          </div>

          {/* Fixed Costs & Totals */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <p className="text-sm text-white/70 mb-4">Fixed Costs & Totals</p>
            <div className="divide-y divide-white/5">
              <CostRow
                label="Vercel Pro"
                value={stats.costs.fixed.vercelPro}
                subtext="monthly"
              />
              <CostRow
                label="Upstash Redis"
                value={stats.costs.fixed.upstash}
                subtext="free tier"
              />
              <div className="py-3 border-t border-white/10 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Total This Month</span>
                  <span className="text-2xl font-bold text-white">
                    ${stats.costs.totals.thisMonth.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-white/50">Projected (full month)</span>
                  <span className="text-lg font-mono text-white/70">
                    ${stats.costs.totals.projectedMonth.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-white/50">All Time (Gemini only)</span>
                  <span className="text-lg font-mono text-white/50">
                    ${stats.costs.totals.allTime.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <MiniChart
            data={stats.charts.dailySignups}
            label="Daily Signups (14 days)"
            maxValue={stats.limits.capacityLimit}
            color="blue"
          />
          <MiniChart
            data={stats.charts.dailyGenerations}
            label="Daily Generations (14 days)"
            color="green"
          />
        </div>

        {/* Pricing Reference */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
          <p className="text-sm text-white/70 mb-4">Pricing Reference</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-white/50">Gemini per image</p>
              <p className="text-white font-mono">${stats.pricing.gemini.perImage}</p>
            </div>
            <div>
              <p className="text-white/50">Firecrawl per deep scrape</p>
              <p className="text-white font-mono">${stats.pricing.firecrawl.perDeepScrape}</p>
            </div>
            <div>
              <p className="text-white/50">Max signups/day</p>
              <p className="text-white font-mono">{stats.limits.capacityLimit}</p>
            </div>
            <div>
              <p className="text-white/50">Max deep scrapes/day</p>
              <p className="text-white font-mono">{stats.limits.deepScrapeLimit}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-white/30 text-sm">
          <p>Max daily: {stats.limits.capacityLimit} signups × 1.1 credits = ~{Math.round(stats.limits.capacityLimit * 1.1)} images = ~${(stats.limits.capacityLimit * 1.1 * stats.pricing.gemini.perImage).toFixed(0)}/day max</p>
        </div>
      </div>
    </div>
  );
}
