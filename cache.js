import NodeCache from 'node-cache';

// Initialize in-memory cache with default TTL of 60 seconds (Practical 9)
const cache = new NodeCache({
  stdTTL: 60,
  checkperiod: 120,
  useClones: false
});

// Track hit/miss counters and metrics (Practical 9 Supplementary Problem)
export const cacheMetrics = {
  hits: 0,
  misses: 0,
  writes: 0,
  invalidations: 0,

  recordHit() {
    this.hits += 1;
  },

  recordMiss() {
    this.misses += 1;
  },

  recordWrite() {
    this.writes += 1;
  },

  recordInvalidation() {
    this.invalidations += 1;
  },

  getStats() {
    const totalRequests = this.hits + this.misses;
    const hitRatio =
      totalRequests > 0 ? `${((this.hits / totalRequests) * 100).toFixed(2)}%` : '0%';
    const keys = cache.keys();

    return {
      hits: this.hits,
      misses: this.misses,
      writes: this.writes,
      invalidations: this.invalidations,
      totalRequests,
      hitRatio,
      activeKeysCount: keys.length,
      keys,
      nodeCacheStats: cache.getStats()
    };
  },

  reset() {
    this.hits = 0;
    this.misses = 0;
    this.writes = 0;
    this.invalidations = 0;
    cache.flushAll();
  }
};

export default cache;
