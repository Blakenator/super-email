/**
 * useEmailCache hook
 *
 * Generic stale-while-revalidate hook backed by EncryptedCache.
 * Shows cached data immediately, then refreshes from the network in the background.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { EncryptedCache } from '../services/emailCache';

interface UseEmailCacheResult<T> {
  data: T | null;
  isLoading: boolean;
  isStale: boolean;
  error: string | null;
  refresh: () => void;
}

export function useEmailCache<T>(
  cacheKey: string | null,
  cache: EncryptedCache<T>,
  fetcher: () => Promise<T>,
): UseEmailCacheResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const cacheRef = useRef(cache);
  cacheRef.current = cache;

  const load = useCallback(async (key: string) => {
    setError(null);

    // 1. Try cache first for instant display
    try {
      const cached = await cacheRef.current.get(key);
      if (cached) {
        setData(cached);
        setIsStale(true);
        setIsLoading(false);
      }
    } catch {
      // Cache miss — continue to network
    }

    // 2. Fetch fresh data in the background
    try {
      const fresh = await fetcherRef.current();
      setData(fresh);
      setIsStale(false);
      setIsLoading(false);
      setError(null);

      // Update cache with fresh data
      cacheRef.current.set(key, fresh).catch(err =>
        console.error('[useEmailCache] Failed to update cache:', err),
      );
    } catch (err: any) {
      // Network failed — if we had cached data, keep showing it
      setIsLoading(false);
      if (!data) {
        setError(err.message || 'Failed to load');
      }
    }
  }, []);

  useEffect(() => {
    if (!cacheKey) return;
    setIsLoading(true);
    load(cacheKey);
  }, [cacheKey, load]);

  const refresh = useCallback(() => {
    if (!cacheKey) return;
    setIsLoading(true);
    setIsStale(false);
    load(cacheKey);
  }, [cacheKey, load]);

  return { data, isLoading, isStale, error, refresh };
}
