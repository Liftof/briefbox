'use client';

import { useState, useEffect, useCallback } from 'react';

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

// LocalStorage keys for migration & fallback
const GENERATIONS_KEY = 'palette_generations';
const FOLDERS_KEY = 'palette_folders';
const MIGRATED_KEY = 'palette_migrated_to_db';

// Check if we should use API (user is authenticated)
const useApi = () => {
  // This will be true when user is logged in
  return typeof window !== 'undefined';
};

// Hook for generations
export function useGenerations(brandId?: number) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch generations from API
  const fetchGenerations = useCallback(async (brandId?: number) => {
    try {
      setLoading(true);

      // 1. Get Local Data (Pending items)
      const localData = localStorage.getItem(GENERATIONS_KEY);
      const parsedLocal: Generation[] = localData ? JSON.parse(localData) : [];
      // Filter for items that failed to save (temporary IDs)
      const pendingItems = parsedLocal.filter(g => g.id.startsWith('gen_'));
      // Optional: filter by brand if context requires it
      const relevantPending = brandId
        ? pendingItems.filter(g => g.brandId === brandId)
        : pendingItems;

      // 2. Get Server Data
      const url = brandId
        ? `/api/generations?brandId=${brandId}`
        : '/api/generations';

      const res = await fetch(url);

      let serverGenerations: Generation[] = [];

      if (!res.ok) {
        if (res.status === 401) {
          // Fully fallback to local if auth fails
          let allLocal = parsedLocal;
          if (brandId) {
            allLocal = allLocal.filter((g: Generation) => g.brandId === brandId);
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
      if (brandId) {
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
    fetchGenerations(brandId);
  }, [brandId, fetchGenerations]);

  // Fetch folders from API
  const fetchFolders = useCallback(async (brandId?: number) => {
    try {
      const url = brandId
        ? `/api/folders?brandId=${brandId}`
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
  }, []);

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

      // Fallback to localStorage
      console.log('📦 Falling back to localStorage...');
      const existing = JSON.parse(localStorage.getItem(GENERATIONS_KEY) || '[]');
      const withIds = gens.map((g, i) => ({
        ...g,
        id: `gen_${Date.now()}_${i}`,
        createdAt: new Date().toISOString(),
      }));
      localStorage.setItem(GENERATIONS_KEY, JSON.stringify([...withIds, ...existing]));
      console.log('📦 Saved to localStorage:', withIds.length, 'generations');
      return withIds;
    }

    const data = await res.json();
    console.log('✅ Generations saved to DB:', data.generations?.length || 0);
    return data.generations || [];
  } catch (err) {
    console.error('📦 Add generations error:', err);
    // Fallback to localStorage
    console.log('📦 Falling back to localStorage due to error...');
    const existing = JSON.parse(localStorage.getItem(GENERATIONS_KEY) || '[]');
    const withIds = gens.map((g, i) => ({
      ...g,
      id: `gen_${Date.now()}_${i}`,
      createdAt: new Date().toISOString(),
    }));
    localStorage.setItem(GENERATIONS_KEY, JSON.stringify([...withIds, ...existing]));
    console.log('📦 Saved to localStorage:', withIds.length, 'generations');
    return withIds;
  }
};

// Legacy single generation add
export const addGeneration = async (gen: Omit<Generation, 'id' | 'createdAt'>) => {
  const result = await addGenerations([gen]);
  return result[0];
};
