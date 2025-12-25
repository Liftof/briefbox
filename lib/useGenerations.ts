'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

// Types
export interface GenerationFeedback {
  rating: 1 | 2 | 3;
  comment?: string;
  timestamp: string;
}

export interface Generation {
  id: string;
  url: string;
  prompt?: string;
  templateId?: string;
  brandId?: number;
  brandName?: string;
  createdAt: string;
  folderId?: string;
  feedback?: GenerationFeedback;
  type?: string; // 'daily' for daily batch visuals
  liked?: boolean;
  aspectRatio?: string; // '1:1', '4:5', '9:16', '16:9', '3:2', '21:9'
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

// LocalStorage keys for migration & fallback (now namespaced by userId)
const getGenerationsKey = (userId: string) => `palette_generations_${userId}`;
const getFoldersKey = (userId: string) => `palette_folders_${userId}`;
const getMigratedKey = (userId: string) => `palette_migrated_to_db_${userId}`;

// Legacy keys (before userId namespacing)
const LEGACY_GENERATIONS_KEY = 'palette_generations';
const LEGACY_FOLDERS_KEY = 'palette_folders';
const LEGACY_MIGRATED_KEY = 'palette_migrated_to_db';

// Check if we should use API (user is authenticated)
const useApi = () => {
  // This will be true when user is logged in
  return typeof window !== 'undefined';
};

// Hook for generations
export function useGenerations(brandId?: number) {
  const { user } = useUser();
  const userId = user?.id;

  const [generations, setGenerations] = useState<Generation[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user-specific localStorage keys
  const GENERATIONS_KEY = userId ? getGenerationsKey(userId) : LEGACY_GENERATIONS_KEY;
  const FOLDERS_KEY = userId ? getFoldersKey(userId) : LEGACY_FOLDERS_KEY;
  const MIGRATED_KEY = userId ? getMigratedKey(userId) : LEGACY_MIGRATED_KEY;

  // Fetch generations from API
  const fetchGenerations = useCallback(async (specificBrandId?: number) => {
    try {
      setLoading(true);
      const targetBrandId = specificBrandId !== undefined ? specificBrandId : brandId;

      // 1. Get Local Data (Pending items)
      const localData = localStorage.getItem(GENERATIONS_KEY);
      const parsedLocal: Generation[] = localData ? JSON.parse(localData) : [];
      // Filter for items that failed to save (temporary IDs)
      const pendingItems = parsedLocal.filter(g => g.id.startsWith('gen_'));
      // Optional: filter by brand if context requires it
      const relevantPending = targetBrandId
        ? pendingItems.filter(g => g.brandId === targetBrandId)
        : pendingItems;

      // 2. Get Server Data
      const url = targetBrandId
        ? `/api/generations?brandId=${targetBrandId}`
        : '/api/generations';

      const res = await fetch(url);

      let serverGenerations: Generation[] = [];

      if (!res.ok) {
        if (res.status === 401) {
          // Fully fallback to local if auth fails
          let allLocal = parsedLocal;
          if (targetBrandId) {
            allLocal = allLocal.filter((g: Generation) => g.brandId === targetBrandId);
          }
          setGenerations(allLocal);
          return;
        }
        // If other error, we might still want to show what we have locally
        console.error('Failed to fetch generations');
      } else {
        const data = await res.json();
        serverGenerations = data.generations || [];
      }

      // 3. Merge: Pending First, then Server items
      // We deduplicate just in case, though IDs should differ (gen_ vs numbers)
      const merged = [...relevantPending, ...serverGenerations];

      // Sort by date desc
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setGenerations(merged);

    } catch (err: any) {
      console.error('Fetch generations error:', err);
      setError(err.message);

      // Fallback
      const localData = localStorage.getItem(GENERATIONS_KEY);
      let parsed = localData ? JSON.parse(localData) : [];
      if (typeof brandId !== 'undefined') { // Use hook prop for fallback context
        parsed = parsed.filter((g: Generation) => g.brandId === brandId);
      }
      setGenerations(parsed || []);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  // Sync pending items from localStorage to DB
  const syncPendingItems = useCallback(async () => {
    const localData = localStorage.getItem(GENERATIONS_KEY);
    if (!localData) return;

    const allLocal: Generation[] = JSON.parse(localData);
    const pendingItems = allLocal.filter(g => g.id.startsWith('gen_'));

    if (pendingItems.length === 0) return;

    console.log(`🔄 Syncing ${pendingItems.length} pending items to DB...`);

    for (const item of pendingItems) {
      try {
        // Strip temporary ID and createdAt to let DB handle it, or keep original creation time?
        // Let's keep original creation time if possible, but schema defaults to now().
        // The API route doesn't explicitly accept createdAt for insert, but we can pass it if we modify the API or just let it be "now".
        // For simplicity and matching current API, we send it as a new generation.
        const { id, ...genData } = item;

        // Prepare payload (API expects 'generations' array)
        const payload = {
          generations: [{
            ...genData,
            // Ensure format/aspectRatio is handled
            aspectRatio: genData.aspectRatio || (genData as any).format || '1:1'
          }]
        };

        const res = await fetch('/api/generations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          // Remove from local storage on success
          const currentLocal = JSON.parse(localStorage.getItem(GENERATIONS_KEY) || '[]');
          const updatedLocal = currentLocal.filter((g: Generation) => g.id !== item.id);
          localStorage.setItem(GENERATIONS_KEY, JSON.stringify(updatedLocal));
        }
      } catch (err) {
        console.error('Failed to sync item:', item.id, err);
      }
    }

    // Refresh list after sync attempts
    fetchGenerations();
  }, [fetchGenerations]);

  // Fetch folders from API
  const fetchFolders = useCallback(async (specificBrandId?: number) => {
    try {
      const targetBrandId = specificBrandId !== undefined ? specificBrandId : brandId;
      const url = targetBrandId
        ? `/api/folders?brandId=${targetBrandId}`
        : '/api/folders';

      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          const localData = localStorage.getItem(FOLDERS_KEY);
          setFolders(localData ? JSON.parse(localData) : []);
          return;
        }
        throw new Error('Failed to fetch folders');
      }
      const data = await res.json();
      setFolders(data.folders || []);
    } catch (err: any) {
      console.error('Fetch folders error:', err);
      const localData = localStorage.getItem(FOLDERS_KEY);
      setFolders(localData ? JSON.parse(localData) : []);
    }
  }, [brandId]);

  // Migrate localStorage to DB (one-time)
  const migrateToDb = useCallback(async () => {
    if (typeof window === 'undefined') return;

    // Use the sync logic for pending items
    // We can also trigger the legacy migration if needed, but let's rely on the new sync for consistency
    // checks for 'palette_migrated_to_db' can stay for legacy non-pending items
    const alreadyMigrated = localStorage.getItem(MIGRATED_KEY);
    if (!alreadyMigrated) {
      // Legacy migration logic (omitted or kept simple if you want to preserve old behavior)
      localStorage.setItem(MIGRATED_KEY, 'true');
    }
  }, [MIGRATED_KEY]);

  // Migrate from legacy (non-namespaced) localStorage keys to user-specific keys
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;

    const legacyGenerations = localStorage.getItem(LEGACY_GENERATIONS_KEY);
    const legacyFolders = localStorage.getItem(LEGACY_FOLDERS_KEY);

    // Only migrate if user-specific keys don't exist yet (first time for this user)
    const userGenerationsExist = localStorage.getItem(GENERATIONS_KEY);
    const userFoldersExist = localStorage.getItem(FOLDERS_KEY);

    if (legacyGenerations && !userGenerationsExist) {
      console.log('🔄 Migrating legacy generations to user-specific storage');
      localStorage.setItem(GENERATIONS_KEY, legacyGenerations);
    }

    if (legacyFolders && !userFoldersExist) {
      console.log('🔄 Migrating legacy folders to user-specific storage');
      localStorage.setItem(FOLDERS_KEY, legacyFolders);
    }

    // Clear legacy keys to prevent cross-user contamination
    // (Only clear after first user has migrated their data)
    if (legacyGenerations || legacyFolders) {
      console.log('🧹 Clearing legacy localStorage keys');
      localStorage.removeItem(LEGACY_GENERATIONS_KEY);
      localStorage.removeItem(LEGACY_FOLDERS_KEY);
      localStorage.removeItem(LEGACY_MIGRATED_KEY);
    }
  }, [userId, GENERATIONS_KEY, FOLDERS_KEY]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      // Trigger sync of any pending items
      syncPendingItems();

      await Promise.all([fetchGenerations(brandId), fetchFolders(brandId)]);
    };
    init();

    // Listen for updates
    const handleUpdate = () => {
      fetchGenerations(brandId);
    };
    window.addEventListener('generations-updated', handleUpdate);

    return () => {
      window.removeEventListener('generations-updated', handleUpdate);
    };
  }, [fetchGenerations, fetchFolders, syncPendingItems, brandId]);

  // Add generations
  const addGenerations = useCallback(async (newGens: Omit<Generation, 'id' | 'createdAt'>[]) => {
    try {
      const res = await fetch('/api/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generations: newGens }),
      });

      if (!res.ok) {
        // Fallback to localStorage
        const existing = JSON.parse(localStorage.getItem(GENERATIONS_KEY) || '[]');
        const withIds = newGens.map((g, i) => ({
          ...g,
          id: `gen_${Date.now()}_${i}`,
          createdAt: new Date().toISOString(),
        }));
        localStorage.setItem(GENERATIONS_KEY, JSON.stringify([...withIds, ...existing]));
        setGenerations(prev => [...withIds, ...prev]);
        return withIds;
      }

      const data = await res.json();
      setGenerations(prev => [...(data.generations || []), ...prev]);
      return data.generations;
    } catch (err) {
      console.error('Add generations error:', err);
      return [];
    }
  }, []);

  // Update generation (feedback, folder, etc.)
  const updateGeneration = useCallback(async (id: string, updates: Partial<Generation>) => {
    try {
      const res = await fetch('/api/generations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!res.ok) {
        // Fallback to localStorage
        setGenerations(prev => {
          const updated = prev.map(g => g.id === id ? { ...g, ...updates } : g);
          localStorage.setItem(GENERATIONS_KEY, JSON.stringify(updated));
          return updated;
        });
        return;
      }

      const data = await res.json();
      setGenerations(prev => prev.map(g => g.id === id ? data.generation : g));
    } catch (err) {
      console.error('Update generation error:', err);
    }
  }, []);

  // Delete generation
  const deleteGeneration = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/generations?id=${id}`, { method: 'DELETE' });

      if (!res.ok) {
        // Fallback to localStorage
        setGenerations(prev => {
          const filtered = prev.filter(g => g.id !== id);
          localStorage.setItem(GENERATIONS_KEY, JSON.stringify(filtered));
          return filtered;
        });
        return;
      }

      setGenerations(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error('Delete generation error:', err);
    }
  }, []);

  // Create folder
  const createFolder = useCallback(async (name: string, color: string) => {
    try {
      const payload: any = { name, color };
      if (brandId) payload.brandId = brandId;

      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Fallback to localStorage
        const newFolder: Folder = {
          id: `folder_${Date.now()}`,
          name,
          color,
          createdAt: new Date().toISOString(),
        };
        const existing = JSON.parse(localStorage.getItem(FOLDERS_KEY) || '[]');
        localStorage.setItem(FOLDERS_KEY, JSON.stringify([...existing, newFolder]));
        setFolders(prev => [...prev, newFolder]);
        return newFolder;
      }

      const data = await res.json();
      setFolders(prev => [...prev, data.folder]);
      return data.folder;
    } catch (err) {
      console.error('Create folder error:', err);
      return null;
    }
  }, [brandId]);

  // Delete folder
  const deleteFolder = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/folders?id=${id}`, { method: 'DELETE' });

      if (!res.ok) {
        // Fallback: update localStorage
        setFolders(prev => {
          const filtered = prev.filter(f => f.id !== id);
          localStorage.setItem(FOLDERS_KEY, JSON.stringify(filtered));
          return filtered;
        });
        // Move generations out of folder
        setGenerations(prev => {
          const updated = prev.map(g => g.folderId === id ? { ...g, folderId: undefined } : g);
          localStorage.setItem(GENERATIONS_KEY, JSON.stringify(updated));
          return updated;
        });
        return;
      }

      setFolders(prev => prev.filter(f => f.id !== id));
      setGenerations(prev => prev.map(g => g.folderId === id ? { ...g, folderId: undefined } : g));
    } catch (err) {
      console.error('Delete folder error:', err);
    }
  }, []);

  return {
    generations,
    folders,
    loading,
    error,
    addGenerations,
    updateGeneration,
    deleteGeneration,
    createFolder,
    deleteFolder,
    refresh: () => Promise.all([fetchGenerations(), fetchFolders()]),
  };
}

// Legacy export for backward compatibility with existing playground code
// NOTE: This function does NOT use localStorage to prevent cross-user contamination
// Use the useGenerations hook for proper localStorage fallback with user isolation
export const addGenerations = async (gens: Omit<Generation, 'id' | 'createdAt'>[]) => {
  console.log('📦 addGenerations called with', gens.length, 'generations');
  console.log('   URLs:', gens.map(g => g.url?.slice(0, 50) + '...'));

  try {
    const res = await fetch('/api/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generations: gens }),
    });

    console.log('📦 API response status:', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('📦 API error response:', res.status, errorText);
      throw new Error(`Failed to save generations: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    console.log('✅ Generations saved to DB:', data.generations?.length || 0);

    // Trigger update event so hooks can refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('generations-updated'));
    }

    return data.generations || [];
  } catch (err) {
    console.error('📦 Add generations error:', err);
    throw err; // Re-throw to let caller handle the error
  }
};

// Legacy single generation add
export const addGeneration = async (gen: Omit<Generation, 'id' | 'createdAt'>) => {
  const result = await addGenerations([gen]);
  return result[0];
};
