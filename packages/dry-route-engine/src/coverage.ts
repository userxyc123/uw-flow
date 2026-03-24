import type { RouteSegment } from "@uw-flow/shared-types";

/** Coverage types that count as "covered" from rain */
const COVERED_TYPES = new Set<RouteSegment["coverage_type"]>([
  "walkway",
  "building_interior",
  "tunnel",
  "overhang",
]);

/**
 * Returns true when the segment provides overhead rain protection.
 * Requirement 1.5: covered walkways, building interiors, tunnels, and overhangs.
 */
export function isCovered(segment: RouteSegment): boolean {
  return COVERED_TYPES.has(segment.coverage_type);
}

/**
 * Computes coverage_score as:
 *   (sum of distance_meters of covered segments / total route distance) * 100
 *
 * Returns 0 for an empty route.
 * Requirement 1.2: coverage_score is a percentage in [0, 100].
 */
export function computeCoverageScore(segments: RouteSegment[]): number {
  if (segments.length === 0) return 0;

  const totalDistance = segments.reduce((sum, s) => sum + s.distance_meters, 0);
  if (totalDistance === 0) return 0;

  const coveredDistance = segments
    .filter(isCovered)
    .reduce((sum, s) => sum + s.distance_meters, 0);

  const score = (coveredDistance / totalDistance) * 100;
  // Clamp to [0, 100] to guard against floating-point edge cases
  return Math.min(100, Math.max(0, score));
}
