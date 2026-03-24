// UW Flow — Shared TypeScript Interfaces and Utilities

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeoPolygon {
  points: GeoPoint[];
}

export interface RouteSegment {
  segment_id: string;
  start_point: GeoPoint;
  end_point: GeoPoint;
  distance_meters: number;
  is_covered: boolean;
  coverage_type: "walkway" | "building_interior" | "tunnel" | "overhang" | "open";
  elevation_change_meters: number;
  has_construction: boolean;
}

export interface RouteOption {
  route_id: string;
  segments: RouteSegment[];
  total_distance_meters: number;
  estimated_time_minutes: number;
  coverage_score: number; // 0–100, % of route that is covered
  staleness_warning: boolean;
}

export interface IndoorShortcut {
  building_name: string;
  time_saved_minutes: number;
}

export interface SmartRoute extends RouteOption {
  crowd_score: number; // 0–100, lower is less crowded
  indoor_shortcuts: IndoorShortcut[];
  late_warning: boolean;
  fastest: boolean;
}

export interface Venue {
  venue_id: string;
  name: string;
  location: GeoPoint;
  category: "dining" | "library" | "gym" | "advising" | "health" | "retail" | "transit";
}

export interface WaitPrediction {
  minutes_from_now: 10 | 20 | 30;
  predicted_wait_minutes: number;
  recommendation: "Go Now" | "Go Later" | null;
  optimal_arrival_time?: string; // ISO8601, present when recommendation is "Go Later"
}

export interface CheckIn {
  checkin_id: string;
  venue_id: string;
  user_id: string; // anonymized hash
  reported_wait_minutes: number;
  crowd_level: "low" | "medium" | "high";
  submitted_at: string; // ISO8601
  location_verified: boolean;
}

export interface HeatmapCell {
  cell_id: string;
  polygon: GeoPolygon;
  density_score: number; // 0–100
  label: "Quiet" | "Moderate" | "Busy";
  updated_at: string; // ISO8601
}

export interface HeatmapSnapshot {
  cells: HeatmapCell[];
  generated_at: string; // ISO8601
}

export interface UserAlertPreferences {
  user_id: string;
  wait_time_alerts_enabled: boolean;
  wait_time_threshold_minutes: number;
  rain_alerts_enabled: boolean;
  quiet_spot_alerts_enabled: boolean;
  favorite_study_spots: string[]; // venue_ids
}

export interface RainCell {
  location: GeoPoint;
  radius_meters: number; // ≤500m resolution
  precipitation_probability: number; // 0–1
  minutes_until_rain: number | null; // null if no rain predicted
}

export interface RainForecast {
  fetched_at: string; // ISO8601
  valid_until: string; // ISO8601
  is_stale: boolean;
  cells: RainCell[];
}

// Note: db/pool, db/migrate, and cache/redis are intentionally NOT re-exported here.
// Import them directly to avoid pulling ioredis/pg into test environments:
//   import { getRedis, TTL } from "@uw-flow/shared-types/cache/redis"
//   import { getPool } from "@uw-flow/shared-types/db/pool"
