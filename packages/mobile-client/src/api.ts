import type {
  RouteOption,
  SmartRoute,
  Venue,
  WaitPrediction,
  HeatmapSnapshot,
  HeatmapCell,
  UserAlertPreferences,
} from "@uw-flow/shared-types";

const BASE_URL = "http://localhost:3000/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

// ── DryRoute ──────────────────────────────────────────────────────────────────
export function getDryRoutes(oLat: number, oLng: number, dLat: number, dLng: number) {
  return get<RouteOption[]>(
    `/routes/dry?origin_lat=${oLat}&origin_lng=${oLng}&dest_lat=${dLat}&dest_lng=${dLng}`
  );
}

// ── Smart Routes ──────────────────────────────────────────────────────────────
export function getSmartRoutes(body: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  classStartTime?: string;
  routeCandidates: RouteOption[];
  crowdScores?: Record<string, number>;
}) {
  return post<SmartRoute[]>("/routes/smart", body);
}

// ── Venues & Wait Times ──────────────────────────────────────────────────────
export function getVenues() {
  return get<Venue[]>("/venues");
}

export function getWaitTime(venueId: string) {
  return get<{
    current_minutes: number;
    predictions: WaitPrediction[];
    unverified: boolean;
    checkin_count: number;
  }>(`/venues/${venueId}/wait-time`);
}

export function submitCheckin(
  venueId: string,
  body: { reported_wait_minutes: number; crowd_level: string; user_id?: string },
  confirm = false
) {
  return post<{ accepted: boolean; location_confirmation_required?: boolean }>(
    `/venues/${venueId}/checkins${confirm ? "?confirm=true" : ""}`,
    body
  );
}

// ── Heatmap ───────────────────────────────────────────────────────────────────
export function getHeatmap() {
  return get<HeatmapSnapshot>("/heatmap");
}

export function getQuietSpots() {
  return get<HeatmapCell[]>("/heatmap/quiet-spots");
}

export function getHeatmapCell(cellId: string) {
  return get<HeatmapCell>(`/heatmap/area/${cellId}`);
}

// ── Alerts ────────────────────────────────────────────────────────────────────
export function getAlertPreferences(userId: string) {
  return get<UserAlertPreferences>(`/alerts/preferences?user_id=${userId}`);
}

export function saveAlertPreferences(prefs: UserAlertPreferences) {
  return post<{ saved: boolean }>("/alerts/preferences", prefs);
}
