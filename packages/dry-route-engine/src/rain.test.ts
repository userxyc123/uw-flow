import { RainService } from "./rain";
import type { RainForecast, RainCell, GeoPoint } from "@uw-flow/shared-types";

// ── Mock ioredis ──────────────────────────────────────────────────────────────
const mockRedisGet = jest.fn<Promise<string | null>, [string]>();
const mockRedisSet = jest.fn<Promise<"OK">, [string, string, string, number]>();

jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    get: mockRedisGet,
    set: mockRedisSet,
    on: jest.fn(),
    quit: jest.fn(),
  }));
});

// ── Mock global fetch ─────────────────────────────────────────────────────────
const mockFetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>();
global.fetch = mockFetch as typeof global.fetch;

// ── Helpers ───────────────────────────────────────────────────────────────────
const UW_CENTER: GeoPoint = { lat: 47.6553, lng: -122.3035 };

function makeForecast(overrides: Partial<RainForecast> = {}): RainForecast {
  return {
    fetched_at: new Date().toISOString(),
    valid_until: new Date(Date.now() + 600_000).toISOString(),
    is_stale: false,
    cells: [],
    ...overrides,
  };
}

function makeCell(
  location: GeoPoint,
  radius_meters: number,
  precipitation_probability: number,
  minutes_until_rain: number | null = null
): RainCell {
  return { location, radius_meters, precipitation_probability, minutes_until_rain };
}

function makeJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe("RainService.fetchAndCache", () => {
  it("caches the forecast in Redis on successful fetch", async () => {
    const forecast = makeForecast({ cells: [] });
    mockFetch.mockResolvedValueOnce(makeJsonResponse(forecast));
    mockRedisSet.mockResolvedValueOnce("OK");

    const svc = new RainService("http://rain-api.test");
    const result = await svc.fetchAndCache();

    expect(result).not.toBeNull();
    expect(result?.is_stale).toBe(false);
    expect(mockRedisSet).toHaveBeenCalledTimes(1);
    const [key, , ex, ttl] = mockRedisSet.mock.calls[0];
    expect(key).toBe("rain:forecast:uw");
    expect(ex).toBe("EX");
    expect(ttl).toBe(600);
  });

  it("returns null and does not cache on HTTP error", async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({}, 503));

    const svc = new RainService("http://rain-api.test");
    const result = await svc.fetchAndCache();

    expect(result).toBeNull();
    expect(mockRedisSet).not.toHaveBeenCalled();
  });

  it("returns null and does not cache on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network failure"));

    const svc = new RainService("http://rain-api.test");
    const result = await svc.fetchAndCache();

    expect(result).toBeNull();
    expect(mockRedisSet).not.toHaveBeenCalled();
  });
});

describe("RainService.getCurrentForecast — fallback to cache on HTTP error", () => {
  it("returns cached forecast with isStale=true when live fetch fails", async () => {
    const cached = makeForecast({ is_stale: false });

    // Live fetch fails
    mockFetch.mockResolvedValueOnce(makeJsonResponse({}, 500));
    // Cache has data
    mockRedisGet.mockResolvedValueOnce(JSON.stringify(cached));

    const svc = new RainService("http://rain-api.test");
    const { forecast, isStale } = await svc.getCurrentForecast();

    expect(isStale).toBe(true);
    expect(forecast).not.toBeNull();
    expect(forecast?.is_stale).toBe(true);
  });
});

describe("RainService.getCurrentForecast — cold start", () => {
  it("returns null forecast with isStale=true when no cache exists", async () => {
    // Live fetch fails
    mockFetch.mockResolvedValueOnce(makeJsonResponse({}, 503));
    // No cache
    mockRedisGet.mockResolvedValueOnce(null);

    const svc = new RainService("http://rain-api.test");
    const { forecast, isStale } = await svc.getCurrentForecast();

    expect(forecast).toBeNull();
    expect(isStale).toBe(true);
  });
});

describe("RainService.getRainProbabilityAt", () => {
  it("returns max precipitation_probability for a point within a cell's radius", () => {
    const svc = new RainService();
    const cells: RainCell[] = [
      makeCell(UW_CENTER, 500, 0.3),
      // Slightly offset — still within 500 m
      makeCell({ lat: UW_CENTER.lat + 0.001, lng: UW_CENTER.lng }, 500, 0.8),
      // Far away — outside radius
      makeCell({ lat: 47.7, lng: -122.4 }, 100, 0.99),
    ];

    const prob = svc.getRainProbabilityAt(UW_CENTER, cells);
    expect(prob).toBeCloseTo(0.8, 5);
  });

  it("returns 0 when no cells cover the point", () => {
    const svc = new RainService();
    const cells: RainCell[] = [
      makeCell({ lat: 47.7, lng: -122.4 }, 10, 0.9),
    ];
    expect(svc.getRainProbabilityAt(UW_CENTER, cells)).toBe(0);
  });

  it("returns 0 for empty cell list", () => {
    const svc = new RainService();
    expect(svc.getRainProbabilityAt(UW_CENTER, [])).toBe(0);
  });
});

describe("RainService.getMinutesUntilRainAt", () => {
  it("returns minimum minutes_until_rain from covering cells", () => {
    const svc = new RainService();
    const cells: RainCell[] = [
      makeCell(UW_CENTER, 500, 0.5, 15),
      makeCell({ lat: UW_CENTER.lat + 0.001, lng: UW_CENTER.lng }, 500, 0.5, 5),
    ];
    expect(svc.getMinutesUntilRainAt(UW_CENTER, cells)).toBe(5);
  });

  it("returns null when no cells cover the point", () => {
    const svc = new RainService();
    const cells: RainCell[] = [
      makeCell({ lat: 47.7, lng: -122.4 }, 10, 0.9, 3),
    ];
    expect(svc.getMinutesUntilRainAt(UW_CENTER, cells)).toBeNull();
  });

  it("returns null when covering cells have no rain predicted", () => {
    const svc = new RainService();
    const cells: RainCell[] = [
      makeCell(UW_CENTER, 500, 0.1, null),
    ];
    expect(svc.getMinutesUntilRainAt(UW_CENTER, cells)).toBeNull();
  });
});
