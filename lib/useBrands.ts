'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

export interface BrandSummary {
  id: number;
  name: string;
  url: string;
  logo: string | null;
  tagline: string | null;
  colors: string[] | null;
  createdAt: string;
  updatedAt: string | null;
}

// Get user-specific localStorage key
const getLastBrandKey = (userId?: string) => {
  return userId ? `palette_last_brand_id_${userId}` : 'palette_last_brand_id';
};

// Legacy key (before userId namespacing)
const LEGACY_LAST_BRAND_KEY = 'palette_last_brand_id';

export function useBrands() {
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/brands');
      const data = await res.json();

      if (data.success) {
        setBrands(data.brands || []);
      } else {
        setError(data.error || 'Failed to load brands');
      }
    } catch (err) {
      console.error('Failed to fetch brands:', err);
      setError('Failed to load brands');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const refresh = useCallback(() => {
    fetchBrands();
  }, [fetchBrands]);

  return { brands, loading, error, refresh };
}

// Get the last used brand from localStorage (namespaced by userId)
export function getLastUsedBrandId(userId?: string): number | null {
  if (typeof window === 'undefined') return null;

  const key = getLastBrandKey(userId);
  let id = localStorage.getItem(key);

  // Migrate from legacy key if user-specific key doesn't exist
  if (!id && userId) {
    const legacyId = localStorage.getItem(LEGACY_LAST_BRAND_KEY);
    if (legacyId) {
      console.log('🔄 Migrating lastUsedBrandId to user-specific storage');
      localStorage.setItem(key, legacyId);
      // Clear legacy key to prevent cross-user contamination
      localStorage.removeItem(LEGACY_LAST_BRAND_KEY);
      id = legacyId;
    }
  }

  return id ? parseInt(id, 10) : null;
}

// Save the last used brand to localStorage (namespaced by userId)
export function setLastUsedBrandId(id: number, userId?: string) {
  if (typeof window === 'undefined') return;
  const key = getLastBrandKey(userId);
  localStorage.setItem(key, id.toString());

  // Clean up legacy key if it exists
  if (userId && localStorage.getItem(LEGACY_LAST_BRAND_KEY)) {
    localStorage.removeItem(LEGACY_LAST_BRAND_KEY);
  }
}

// Clear the last used brand (when 403 Forbidden or brand deleted)
export function clearLastUsedBrandId(userId?: string) {
  if (typeof window === 'undefined') return;
  const key = getLastBrandKey(userId);
  localStorage.removeItem(key);

  // Also clear legacy key to be safe
  if (userId) {
    localStorage.removeItem(LEGACY_LAST_BRAND_KEY);
  }
}
