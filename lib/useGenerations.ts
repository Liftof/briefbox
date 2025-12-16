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
export function useGenerations() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch generations from API
  const fetchGenerations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/generations');
      if (!res.ok) {
        // If unauthorized, fall back to localStorage
        if (res.status === 401) {
          const localData = localStorage.getItem(GENERATIONS_KEY);
          setGenerations(localData ? JSON.parse(localData) : []);
          return;
        }
        throw new Error('Failed to fetch generations');
      }
      const data = await res.json();
      setGenerations(data.generations || []);
    } catch (err: any) {
      console.error('Fetch generations error:', err);
      setError(err.message);
      // Fall back to localStorage
      const localData = localStorage.getItem(GENERATIONS_KEY);
      setGenerations(localData ? JSON.parse(localData) : []);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch folders from API
  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch('/api/folders');
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
  }, []);

  // Migrate localStorage to DB (one-time)
  const migrateToDb = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const alreadyMigrated = localStorage.getItem(MIGRATED_KEY);
    if (alreadyMigrated) return;

    const localGens = localStorage.getItem(GENERATIONS_KEY);
    const localFolders = localStorage.getItem(FOLDERS_KEY);

    if (localGens) {
      try {
        const gens = JSON.parse(localGens);
        if (gens.length > 0) {
          // Migrate generations to DB
          const res = await fetch('/api/generations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ generations: gens }),
          });

          if (res.ok) {
            console.log(`✅ Migrated ${gens.length} generations to DB`);
          }
        }
      } catch (err) {
        console.error('Migration error (generations):', err);
      }
    }

    if (localFolders) {
      try {
        const flds = JSON.parse(localFolders);
        for (const folder of flds) {
          await fetch('/api/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: folder.name, color: folder.color }),
          });
        }
        console.log(`✅ Migrated ${flds.length} folders to DB`);
      } catch (err) {
        console.error('Migration error (folders):', err);
      }
    }

    // Mark as migrated
    localStorage.setItem(MIGRATED_KEY, 'true');
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      await migrateToDb();
      await Promise.all([fetchGenerations(), fetchFolders()]);
    };
    init();

    // Listen for updates
    const handleUpdate = () => {
      fetchGenerations();
    };
    window.addEventListener('generations-updated', handleUpdate);

    return () => {
      window.removeEventListener('generations-updated', handleUpdate);
    };
  }, [fetchGenerations, fetchFolders, migrateToDb]);

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
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
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
  }, []);

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
