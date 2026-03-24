import type { SmartRoute, RouteSegment, GeoPoint, IndoorShortcut } from "@uw-flow/shared-types";

// ── Construction zone registry (static seed, expandable) ─────────────────────

interface ConstructionZone {
  zone_id: string;
  affected_segment_ids: string[];
  active_until: Date;
}

const CONSTRUCTION_ZONES: ConstructionZone[] = [
  // Example: add real zones here as needed
  // { zone_id: "cz-001", affected_segment_ids: ["seg-xyz"], active_until: new Date("2026-06-01") },
];

function isUnderConstruction(segmentId: string): boolean {
  const now = new Date();
  return CONSTRUCTION_ZONES.some(
    (z) => z.active_until > now && z.affected_segment_ids.includes(segmentId)
  );
}

// ── Indoor shortcut registry ──────────────────────────────────────────────────

interface ShortcutDef {
  building_name: string;
  segment_ids: string[]; // segments that use this shortcut
  time_saved_minutes: number;
}

const INDOOR_SHORTCUTS: ShortcutDef[] = [
  { building_name: "Suzzallo Library",    segment_ids: ["suzzallo-through"],    time_saved_minutes: 2 },
  { building_name: "HUB",                 segment_ids: ["hub-through"],         time_saved_minutes: 1 },
  { building_name: "Odegaard Library",    segment_ids: ["odegaard-through"],    time_saved_minutes: 2 },
  { building_name: "Health Sciences",     segment_ids: ["health-sci-through"],  time_saved_minutes: 3 },
];

function getIndoorShortcuts(segments: RouteSegment[]): IndoorShortcut[] {
  const segIds = new Set(segments.map((s) => s.segment_id));
  return INDOOR_SHORTCUTS
    .filter((sc) => sc.segment_ids.some((id) => segIds.has(id)))
    .map((sc) => ({ building_name: sc.building_name, time_saved_minutes: sc.time_saved_minutes }));
}

// ── Scoring ───────────────────────────────────────────────────────────────────

export interface ScoringInputs {
  coverageScore: number;   // 0–100 from DryRoute_Engine
  crowdScore: number;      // 0–100 from Heatmap_Service (lower = less crowded)
  elevationPenalty: number; // 0–100 (higher = more hilly)
}

/**
 * Compute a composite smart score for a route.
 * Lower is better (we sort ascending and then flip for ranking).
 */
function computeCompositeScore(inputs: ScoringInputs): number {
  // Weights: coverage matters most, then crowd, then elevation
  const coveragePenalty = 100 - inputs.coverageScore; // invert: lower penalty = more covered
  return 0.5 * coveragePenalty + 0.35 * inputs.crowdScore + 0.15 * inputs.elevationPenalty;
}

// ── Main planner ──────────────────────────────────────────────────────────────

export interface PlannerRequest {
  origin: GeoPoint;
  destination: GeoPoint;
  /** ISO8601 string for when the class starts */
  classStartTime?: string;
  /** Pre-computed route candidates from DryRoute_Engine */
  routeCandidates: Array<{
    route_id: string;
    segments: RouteSegment[];
    total_distance_meters: number;
    estimated_time_minutes: number;
    coverage_score: number;
    staleness_warning: boolean;
  }>;
  /** Crowd score per route (from Heatmap_Service), keyed by route_id */
  crowdScores?: Record<string, number>;
}

export function computeSmartRoutes(
  _origin: GeoPoint,
  _destination: GeoPoint,
  _classStartTime: string
): SmartRoute[] {
  return [];
}

export function planRoutes(req: PlannerRequest): SmartRoute[] {
  const { routeCandidates, crowdScores = {}, classStartTime } = req;

  const timeToClassMinutes = classStartTime
    ? (new Date(classStartTime).getTime() - Date.now()) / 60_000
    : null;

  const results: SmartRoute[] = routeCandidates
    .map((candidate) => {
      // Filter out construction segments (Requirement 3.5)
      const cleanSegments = candidate.segments.filter(
        (seg) => !seg.has_construction && !isUnderConstruction(seg.segment_id)
      );

      // If all segments were removed due to construction, skip this route
      if (candidate.segments.length > 0 && cleanSegments.length === 0) return null;

      const crowdScore = crowdScores[candidate.route_id] ?? 30; // default moderate
      const elevationPenalty = computeElevationPenalty(cleanSegments);

      const compositeScore = computeCompositeScore({
        coverageScore: candidate.coverage_score,
        crowdScore,
        elevationPenalty,
      });

      const indoor_shortcuts = getIndoorShortcuts(cleanSegments);

      // Late warning (Requirement 3.3)
      const late_warning =
        timeToClassMinutes !== null &&
        candidate.estimated_time_minutes > timeToClassMinutes;

      const smart: SmartRoute = {
        route_id: candidate.route_id,
        segments: cleanSegments,
        total_distance_meters: cleanSegments.reduce((s, seg) => s + seg.distance_meters, 0),
        estimated_time_minutes: candidate.estimated_time_minutes,
        coverage_score: candidate.coverage_score,
        staleness_warning: candidate.staleness_warning,
        crowd_score: crowdScore,
        indoor_shortcuts,
        late_warning,
        fastest: false, // set below
      };

      return { smart, compositeScore };
    })
    .filter((r): r is { smart: SmartRoute; compositeScore: number } => r !== null)
    .sort((a, b) => a.compositeScore - b.compositeScore)
    .map((r) => r.smart);

  // Mark the fastest route (lowest estimated_time_minutes)
  if (results.length > 0) {
    const fastestIdx = results.reduce(
      (minIdx, r, idx) =>
        r.estimated_time_minutes < results[minIdx].estimated_time_minutes ? idx : minIdx,
      0
    );
    results[fastestIdx].fastest = true;

    // If late warning is active, promote fastest to front (Requirement 3.3)
    if (results[fastestIdx].late_warning && fastestIdx !== 0) {
      const [fastest] = results.splice(fastestIdx, 1);
      results.unshift(fastest);
    }
  }

  return results;
}

function computeElevationPenalty(segments: RouteSegment[]): number {
  if (segments.length === 0) return 0;
  const totalElevationGain = segments.reduce(
    (sum, seg) => sum + Math.max(0, seg.elevation_change_meters),
    0
  );
  // Normalize: 20m gain = score of 100
  return Math.min(100, (totalElevationGain / 20) * 100);
}
