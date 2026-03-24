import Redis from "ioredis";

let _redis: Redis | null = null;

/**
 * Returns a singleton ioredis client configured from environment variables.
 *
 * Required env vars (optional, defaults shown):
 *   REDIS_HOST (default: localhost)
 *   REDIS_PORT (default: 6379)
 *   REDIS_PASSWORD (default: none)
 */
export function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      host: process.env.REDIS_HOST ?? "localhost",
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD ?? undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 3_000),
    });

    _redis.on("error", (err) => {
      console.error("[redis] Connection error:", err);
    });
  }
  return _redis;
}

/** Closes the Redis connection — call during graceful shutdown. */
export async function closeRedis(): Promise<void> {
  if (_redis) {
    await _redis.quit();
    _redis = null;
  }
}

// TTL constants (seconds)
export const TTL = {
  RAIN_FORECAST: 600,    // 10 minutes
  HEATMAP_SNAPSHOT: 120, // 2 minutes
  WAIT_TIME: 60,         // 1 minute
} as const;
