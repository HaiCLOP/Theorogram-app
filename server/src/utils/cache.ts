/**
 * Simple in-memory cache for server-side data
 * Reduces database queries for frequently accessed data
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

class MemoryCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private defaultTTL: number = 60 * 1000; // 60 seconds default

    /**
     * Get item from cache
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set item in cache with optional TTL
     */
    set<T>(key: string, data: T, ttlMs?: number): void {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + (ttlMs || this.defaultTTL),
        });
    }

    /**
     * Delete item from cache
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all items matching a pattern
     */
    invalidatePattern(pattern: string): void {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear entire cache
     */
    clear(): void {
        this.cache.clear();
    }
}

// Export singleton instance
export const cache = new MemoryCache();

// Cache keys
export const CACHE_KEYS = {
    THEORIES_LIST: 'theories:list',
    THEORY: (id: string) => `theory:${id}`,
    THEORY_STATS: (id: string) => `theory:stats:${id}`,
    USER_PROFILE: (username: string) => `user:${username}`,
    USER_THEORIES: (username: string) => `user:theories:${username}`,
};
