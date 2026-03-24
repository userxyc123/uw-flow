import type { RainForecast, RainCell, GeoPoint } from "@uw-flow/shared-types";
import { getRedis, TTL } from "../../shared-types/src/cache/redis";

const RAIN_CACHE_KEY = "rain:forecast:uw";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/** Haversine distance in meters between two GeoPoints */
function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aVal =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
}

export class RainService {
  private rainApiUrl: string;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(rainApiUrl?: string) {
    this.rainApiUrl = rainApiUrl ?? process.env.RAIN_API_URL ?? "";
  }

  /**
   * Fetches a fresh forecast from Rain_API and stores it in Redis.
   * Returns the fetched forecast, or null on failure.
   */
  async fetchAndCache(): Promise<RainForecast | null> {
    if (!this.rainApiUrl) {
      console.warn("[rain] RAIN_API_URL not configured");
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);
      let response: Response;
      try {
        response = await fetch(this.rainApiUrl, { signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        throw new Error(`Rain_API responded with status ${response.status}`);
      }

      const data = (await response.json()) as Omit<RainForecast, "fetched_at" | "is_stale">;

      const forecast: RainForecast = {
        ...data,
        fetched_at: new Date().toISOString(),
        is_stale: false,
      };

      const redis = getRedis();
      await redis.set(RAIN_CACHE_KEY, JSON.stringify(forecast), "EX", TTL.RAIN_FORECAST);

      return forecast;
    } catch (err) {
      console.error("[rain] fetchAndCache failed:", err);
      return null;
    }
  }

  /**
   * Returns the cached RainForecast from Redis, or null if none exists.
   */
  async getCachedForecast(): Promise<RainForecast | null> {
    try {
      const redis = getRedis();
      const raw = await redis.get(RAIN_CACHE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as RainForecast;
    } catch (err) {
      console.error("[rain] getCachedForecast failed:", err);
      return null;
    }
  }

  /**
   * Tries a live fetch first; falls back to cache on failure.
   * Returns { forecast, isStale } where isStale=true means data is from cache or unavailable.
   */
  async getCurrentForecast(): Promise<{ forecast: RainForecast | null; isStale: boolean }> {
    const live = await this.fetchAndCache();
    if (live) {
      return { forecast: live, isStale: false };
    }

    // Fall back to cache
    const cached = await this.getCachedForecast();
    if (cached) {
      return { forecast: { ...cached, is_stale: true }, isStale: true };
    }

    // Cold start — no data at all
    return { forecast: null, isStale: true };
  }

  /**
   * Starts a setInterval that calls fetchAndCache() every 5 minutes.
   * Returns the interval handle so callers can clear it if needed.
   */
  startRefreshLoop(): ReturnType<typeof setInterval> {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.refreshTimer = setInterval(() => {
      this.fetchAndCache().catch((err) =>
        console.error("[rain] refresh loop error:", err)
      );
    }, REFRESH_INTERVAL_MS);
    return this.refreshTimer;
  }

  /**
   * Returns the maximum precipitation_probability from all RainCells
   * whose center is within radius_meters of the given point.
   * Returns 0 if no cells cover the point.
   */
  getRainProbabilityAt(point: GeoPoint, cells: RainCell[]): number {
    let max = 0;
    for (const cell of cells) {
      const dist = haversineMeters(point, cell.location);
      if (dist <= cell.radius_meters) {
        if (cell.precipitation_probability > max) {
          max = cell.precipitation_probability;
        }
      }
    }
    return max;
  }

  /**
   * Returns the minimum minutes_until_rain from all RainCells covering the point,
   * or null if no cells cover the point or none predict rain.
   */
  getMinutesUntilRainAt(point: GeoPoint, cells: RainCell[]): number | null {
    let min: number | null = null;
    for (const cell of cells) {
      const dist = haversineMeters(point, cell.location);
      if (dist <= cell.radius_meters && cell.minutes_until_rain !== null) {
        if (min === null || cell.minutes_until_rain < min) {
          min = cell.minutes_until_rain;
        }
      }
    }
    return min;
  }
}
