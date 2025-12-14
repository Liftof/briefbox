'use client';

import { useState, useEffect, useCallback } from 'react';

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

// Get the last used brand from localStorage
export function getLastUsedBrandId(): number | null {
  if (typeof window === 'undefined') return null;
  const id = localStorage.getItem('palette_last_brand_id');
  return id ? parseInt(id, 10) : null;
}

// Save the last used brand to localStorage
export function setLastUsedBrandId(id: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('palette_last_brand_id', id.toString());
}
