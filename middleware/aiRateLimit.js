/**
 * Practical 13 Supplementary: AI Request Rate Limiter
 * Enforces per-user / per-client cooldown to avoid excessive API usage and quota burn.
 */
const cooldowns = new Map();
const COOLDOWN_MS = 10000; // 10-second cooldown per client

export const aiRateLimiter = (req, res, next) => {
  // Identify user by JWT ID or remote IP
  const identifier = req.user?.id || req.ip || 'client';
  const now = Date.now();
  const lastRequest = cooldowns.get(identifier);

  if (lastRequest && (now - lastRequest) < COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((COOLDOWN_MS - (now - lastRequest)) / 1000);
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit active. Please wait ${remainingSeconds}s before requesting another AI suggestion.`,
      remainingSeconds,
      rateLimited: true
    });
  }

  cooldowns.set(identifier, now);
  next();
};

export const resetAiRateLimit = () => {
  cooldowns.clear();
};
