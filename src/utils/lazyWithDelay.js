import { lazy } from 'react';

/**
 * Wraps dynamic import with an optional minimum delay to prevent jarring UI flicker
 * on fast networks or local dev servers.
 *
 * @param {Function} importFn - () => import('./Component')
 * @param {number} minDelayMs - Minimum delay in milliseconds (default: 300ms)
 */
export function lazyWithDelay(importFn, minDelayMs = 300) {
  return lazy(() =>
    Promise.all([
      importFn(),
      new Promise((resolve) => setTimeout(resolve, minDelayMs))
    ]).then(([moduleExports]) => moduleExports)
  );
}

export default lazyWithDelay;
