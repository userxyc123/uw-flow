import type {
  GeoPoint,
  GeoPolygon,
  RouteSegment,
  RouteOption,
  IndoorShortcut,
  SmartRoute,
  Venue,
  WaitPrediction,
  CheckIn,
  HeatmapCell,
  HeatmapSnapshot,
  UserAlertPreferences,
  RainCell,
  RainForecast,
} from "./index";

describe("shared-types — interface shape validation", () => {
  it("GeoPoint has lat and lng", () => {
    const p: GeoPoint = { lat: 47.6553, lng: -122.3035 };
    expect(p.lat).toBe(47.6553);
    expect(p.lng).toBe(-122.3035);
  });

  it("GeoPolygon has points array", () => {
    const poly: GeoPolygon = {
      points: [
        { lat: 47.655, lng: -122.303 },
        { lat: 47.656, lng: -122.304 },
      ],
    };
    expect(poly.points).toHaveLength(2);
  });

  it("RouteSegment has all required fields", () => {
    const seg: RouteSegment = {
      segment_id: "seg-1",
      start_point: { lat: 47.655, lng: -122.303 },
      end_point: { lat: 47.656, lng: -122.304 },
      distance_meters: 120,
      is_covered: true,
      coverage_type: "walkway",
      elevation_change_meters: 2,
      has_construction: false,
    };
    expect(seg.is_covered).toBe(true);
    expect(seg.coverage_type).toBe("walkway");
  });

  it("RouteOption has coverage_score and staleness_warning", () => {
    const route: RouteOption = {
      route_id: "r-1",
      segments: [],
      total_distance_meters: 500,
      estimated_time_minutes: 6,
      coverage_score: 85,
      staleness_warning: false,
    };
    expect(route.coverage_score).toBe(85);
    expect(route.staleness_warning).toBe(false);
  });

  it("SmartRoute extends RouteOption with crowd_score and late_warning", () => {
    const shortcut: IndoorShortcut = { building_name: "HUB", time_saved_minutes: 2 };
    const smart: SmartRoute = {
      route_id: "sr-1",
      segments: [],
      total_distance_meters: 400,
      estimated_time_minutes: 5,
      coverage_score: 90,
      staleness_warning: false,
      crowd_score: 30,
      indoor_shortcuts: [shortcut],
      late_warning: false,
      fastest: true,
    };
    expect(smart.crowd_score).toBe(30);
    expect(smart.indoor_shortcuts[0].building_name).toBe("HUB");
  });

  it("Venue has all category values", () => {
    const categories: Venue["category"][] = [
      "dining", "library", "gym", "advising", "health", "retail", "transit",
    ];
    expect(categories).toHaveLength(7);
  });

  it("WaitPrediction minutes_from_now is 10 | 20 | 30", () => {
    const pred: WaitPrediction = {
      minutes_from_now: 10,
      predicted_wait_minutes: 8,
      recommendation: "Go Now",
    };
    expect([10, 20, 30]).toContain(pred.minutes_from_now);
  });

  it("CheckIn has crowd_level low | medium | high", () => {
    const ci: CheckIn = {
      checkin_id: "ci-1",
      venue_id: "v-1",
      user_id: "u-hash",
      reported_wait_minutes: 5,
      crowd_level: "low",
      submitted_at: new Date().toISOString(),
      location_verified: true,
    };
    expect(["low", "medium", "high"]).toContain(ci.crowd_level);
  });

  it("HeatmapCell has density_score and label", () => {
    const cell: HeatmapCell = {
      cell_id: "c-1",
      polygon: { points: [] },
      density_score: 42,
      label: "Moderate",
      updated_at: new Date().toISOString(),
    };
    expect(cell.density_score).toBe(42);
    expect(["Quiet", "Moderate", "Busy"]).toContain(cell.label);
  });

  it("HeatmapSnapshot has cells array and generated_at", () => {
    const snap: HeatmapSnapshot = {
      cells: [],
      generated_at: new Date().toISOString(),
    };
    expect(Array.isArray(snap.cells)).toBe(true);
  });

  it("UserAlertPreferences has all fields", () => {
    const prefs: UserAlertPreferences = {
      user_id: "u-1",
      wait_time_alerts_enabled: true,
      wait_time_threshold_minutes: 10,
      rain_alerts_enabled: true,
      quiet_spot_alerts_enabled: false,
      favorite_study_spots: ["v-lib"],
    };
    expect(prefs.favorite_study_spots).toContain("v-lib");
  });

  it("RainForecast has cells with radius_meters", () => {
    const cell: RainCell = {
      location: { lat: 47.655, lng: -122.303 },
      radius_meters: 500,
      precipitation_probability: 0.8,
      minutes_until_rain: 5,
    };
    const forecast: RainForecast = {
      fetched_at: new Date().toISOString(),
      valid_until: new Date().toISOString(),
      is_stale: false,
      cells: [cell],
    };
    expect(forecast.cells[0].radius_meters).toBeLessThanOrEqual(500);
  });
});
