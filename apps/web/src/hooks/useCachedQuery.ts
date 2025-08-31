import { useState, useEffect, useCallback } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number;
  key: string;
}

/**
 * @description
 * Hook for caching data in localStorage with TTL support.
 * Works with any data, not just queries.
 *
 * @receives data from:
 * - Components: data to cache and cache keys
 * - localStorage: previously cached data
 *
 * @sends data to:
 * - Components: cached data when available
 * - localStorage: updated cache entries
 *
 * @sideEffects:
 * - Reads from and writes to localStorage
 * - Manages cache expiration
 */
export function useDataCache<T>(
  data: T | undefined,
  options: CacheOptions,
  dependencies: any[] = []
) {
  const { ttl = 5 * 60 * 1000, key } = options;
  const [cachedData, setCachedData] = useState<T | undefined>();
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);

  // generate cache key
  const getCacheKey = useCallback((baseKey: string) => {
    return `cache_${baseKey}`;
  }, []);

  // load data from cache
  const loadFromCache = useCallback((): T | null => {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(getCacheKey(key));
      if (!cached) return null;

      const cacheEntry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();

      if (now > cacheEntry.expiresAt) {
        localStorage.removeItem(getCacheKey(key));
        return null;
      }

      return cacheEntry.data;
    } catch (err) {
      console.warn('Failed to load from cache:', err);
      localStorage.removeItem(getCacheKey(key));
      return null;
    }
  }, [key, getCacheKey]);

  // save data to cache
  const saveToCache = useCallback((data: T) => {
    if (typeof window === 'undefined') return;

    try {
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      };
      localStorage.setItem(getCacheKey(key), JSON.stringify(cacheEntry));
    } catch (err) {
      console.warn('Failed to save to cache:', err);
    }
  }, [key, ttl, getCacheKey]);

  // clear cache for this key
  const clearCache = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(getCacheKey(key));
  }, [key, getCacheKey]);

  // load cached data on mount
  useEffect(() => {
    const cached = loadFromCache();
    if (cached !== null) {
      setCachedData(cached);
    }
    setIsCacheLoaded(true);
  }, []);

  // save to cache when data changes
  useEffect(() => {
    if (data !== undefined && isCacheLoaded) {
      saveToCache(data);
      setCachedData(data);
    }
  }, [data, ...dependencies]);

  // manual refresh function
  const refresh = useCallback(() => {
    clearCache();
    setCachedData(undefined);
  }, [clearCache]);

  return {
    cachedData,
    isCacheLoaded,
    clearCache,
    refresh,
  };
}

/**
 * @description
 * Cache management utilities for clearing multiple caches
 *
 * @receives data from:
 * - Components: cache keys to clear
 *
 * @sends data to:
 * - localStorage: removal of cache entries
 *
 * @sideEffects:
 * - Clears localStorage cache entries
 */
export const cacheManager = {
  // clear all caches
  clearAll: () => {
    if (typeof window === 'undefined') return;
    const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
    keys.forEach(key => localStorage.removeItem(key));
  },

  // clear user-specific caches (useful on logout)
  clearUserCaches: (userId?: string) => {
    if (typeof window === 'undefined') return;
    const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));

    keys.forEach(key => {
      const cacheKey = key.replace('cache_', '');
      if (cacheKey.includes(userId || '') ||
          cacheKey.includes('user_inventory') ||
          cacheKey.includes('user_data')) {
        localStorage.removeItem(key);
      }
    });
  },

  // clear card-related caches (useful when card data changes)
  clearCardCaches: () => {
    if (typeof window === 'undefined') return;
    const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));

    keys.forEach(key => {
      const cacheKey = key.replace('cache_', '');
      if (cacheKey.includes('cards_') || cacheKey.includes('user_inventory')) {
        localStorage.removeItem(key);
      }
    });
  },

//   // get cache info for debugging
//   getCacheInfo: () => {
//     if (typeof window === 'undefined') return {};

//     const cacheInfo: Record<string, any> = {};
//     const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));

//     keys.forEach(key => {
//       try {
//         const data = JSON.parse(localStorage.getItem(key) || '{}');
//         const cacheKey = key.replace('cache_', '');
//         cacheInfo[cacheKey] = {
//           timestamp: new Date(data.timestamp).toLocaleString(),
//           expiresAt: new Date(data.expiresAt).toLocaleString(),
//           isExpired: Date.now() > data.expiresAt,
//           dataSize: JSON.stringify(data.data).length,
//         };
//       } catch (err) {
//         cacheInfo[key.replace('cache_', '')] = { error: 'Invalid cache format' };
//       }
//     });

//     return cacheInfo;
//   },
};
