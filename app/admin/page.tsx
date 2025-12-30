'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface Stats {
  users: {
    total: number;
    byPlan: {
      free: number;
      pro: number;
      premium: number;
    };
  };
  brands: {
    total: number;
  };
  generations: {
    total: number;
    last30Days: number;
  };
  signups: {
    today: number;
    last7Days: number;
  };
  deepScrapes: {
    today: number;
    last7Days: number;
  };
  costs: {
    estimatedLast30Days: number;
    breakdown: {
      geminiLast30Days: number;
      geminiTotal: number;
      firecrawlLast7Days: number;
    };
  };
  charts: {
    dailySignups: { date: string; count: number }[];
    dailyGenerations: { date: string; count: number }[];
  };
  limits: {
    capacityLimit: number;
    deepScrapeLimit: number;
    earlyBirdLimit: number;
  };
}

function StatCard({ title, value, subtitle, color = 'blue' }: {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
  };

  return (
    <div className={`rounded-xl border p-6 ${colors[color]}`}>
      <p className="text-sm opacity-70">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-xs opacity-50 mt-1">{subtitle}</p>}
    </div>
  );
}

function MiniChart({ data, label, maxValue }: {
  data: { date: string; count: number }[];
  label: string;
  maxValue?: number;
}) {
  const max = maxValue || Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
      <p className="text-sm text-white/70 mb-4">{label}</p>
      <div className="flex items-end gap-1 h-24">
        {data.slice(-14).map((d, i) => (
          <div
            key={i}
            className="flex-1 bg-blue-500/50 hover:bg-blue-500 rounded-t transition-colors cursor-pointer group relative"
            style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }}
            title={`${d.date}: ${d.count}`}
          >
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
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
  color?: 'blue' | 'green' | 'orange' | 'red';
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
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

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }

    async function fetchStats() {
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
      } catch (err) {
        setError('Failed to load dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchStats();
    }
  }, [user, isLoaded, router]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
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

  const costStatus = stats.costs.estimatedLast30Days > 1000 ? 'red' :
                     stats.costs.estimatedLast30Days > 500 ? 'orange' : 'green';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-white/50 mt-1">Palette Analytics</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/50">Last updated</p>
            <p className="text-white/70">{new Date().toLocaleString('fr-FR')}</p>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Users"
            value={stats.users.total}
            subtitle={`+${stats.signups.last7Days} last 7 days`}
            color="blue"
          />
          <StatCard
            title="Total Brands"
            value={stats.brands.total}
            color="purple"
          />
          <StatCard
            title="Generations (30d)"
            value={stats.generations.last30Days}
            subtitle={`${stats.generations.total} total`}
            color="green"
          />
          <StatCard
            title="Est. Cost (30d)"
            value={`$${stats.costs.estimatedLast30Days.toFixed(2)}`}
            subtitle="Gemini + Firecrawl"
            color={costStatus}
          />
        </div>

        {/* Users by Plan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
            <p className="text-sm text-white/70 mb-4">Today's Usage vs Limits</p>
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
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <p className="text-sm text-white/70 mb-4">Cost Breakdown (Est.)</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Gemini (30d)</span>
                <span className="text-lg font-mono text-green-400">
                  ${stats.costs.breakdown.geminiLast30Days.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Firecrawl (7d)</span>
                <span className="text-lg font-mono text-blue-400">
                  ${stats.costs.breakdown.firecrawlLast7Days.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-white/70">Gemini Total</span>
                <span className="text-sm font-mono text-white/50">
                  ${stats.costs.breakdown.geminiTotal.toFixed(2)}
                </span>
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
          />
          <MiniChart
            data={stats.charts.dailyGenerations}
            label="Daily Generations (14 days)"
          />
        </div>

        {/* Footer */}
        <div className="text-center text-white/30 text-sm">
          <p>Limits: {stats.limits.capacityLimit} signups/day | {stats.limits.deepScrapeLimit} deep scrapes/day | {stats.limits.earlyBirdLimit} early birds/day</p>
        </div>
      </div>
    </div>
  );
}
