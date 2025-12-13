'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CreditsInfo {
  remaining: number;
  total: number;
  plan: 'free' | 'pro' | 'premium';
  canGenerate: boolean;
  resetAt: string | null;
  isTeamCredits: boolean;
}

export function useCredits() {
  const [credits, setCredits] = useState<CreditsInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch('/api/user/credits');
      if (!res.ok) {
        if (res.status === 401) {
          // Not logged in, use defaults
          setCredits({
            remaining: 3,
            total: 3,
            plan: 'free',
            canGenerate: true,
            resetAt: null,
            isTeamCredits: false,
          });
          return;
        }
        throw new Error('Failed to fetch credits');
      }
      const data = await res.json();
      setCredits(data.credits);
    } catch (err: any) {
      setError(err.message);
      // Default fallback
      setCredits({
        remaining: 3,
        total: 3,
        plan: 'free',
        canGenerate: true,
        resetAt: null,
        isTeamCredits: false,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Update credits after a generation
  const updateRemaining = useCallback((newRemaining: number) => {
    setCredits(prev => prev ? { ...prev, remaining: newRemaining, canGenerate: newRemaining > 0 } : prev);
  }, []);

  return {
    credits,
    loading,
    error,
    refresh: fetchCredits,
    updateRemaining,
  };
}

// Plan display names
export const PLAN_NAMES = {
  free: 'Starter',
  pro: 'Pro',
  premium: 'Premium',
} as const;

// Plan colors
export const PLAN_COLORS = {
  free: 'text-gray-600',
  pro: 'text-blue-600',
  premium: 'text-purple-600',
} as const;
