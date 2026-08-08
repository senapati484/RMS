/**
 * Simple in-memory cache with TTL support
 * Useful for caching frequently accessed data to reduce database load
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
  createdAt: number
}

class SimpleCache {
  private cache: Map<string, CacheEntry<unknown>>
  private defaultTTL: number // milliseconds

  constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map()
    this.defaultTTL = defaultTTL

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000)
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, {
      data,
      expiresAt,
      createdAt: Date.now(),
    })
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Get or set pattern - useful for memoization
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fn()
    this.set(key, data, ttl)
    return data
  }

  /**
   * Invalidate multiple keys by pattern
   */
  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern)
    let count = 0
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        count++
      }
    }
    
    return count
  }
}

// Create a singleton instance
export const cache = new SimpleCache()

/**
 * Cache key generators for common patterns
 */
export const CacheKeys = {
  product: (id: string) => `product:${id}`,
  products: (params: string) => `products:${params}`,
  productCount: (filter: string) => `product-count:${filter}`,
  order: (id: string) => `order:${id}`,
  userOrders: (userId: string, params: string) => `user-orders:${userId}:${params}`,
  dashboard: (userId: string) => `dashboard:${userId}`,
  user: (id: string) => `user:${id}`,
  settings: () => `settings:global`,
}

/**
 * Cache TTL constants
 */
export const CacheTTL = {
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000, // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
}

/**
 * React hook for cache (if using React)
 */
export function useCache() {
  return {
    get: <T>(key: string) => cache.get<T>(key),
    set: <T>(key: string, data: T, ttl?: number) => cache.set(key, data, ttl),
    has: (key: string) => cache.has(key),
    delete: (key: string) => cache.delete(key),
    clear: () => cache.clear(),
    getOrSet: <T>(key: string, fn: () => Promise<T>, ttl?: number) => 
      cache.getOrSet(key, fn, ttl),
  }
}