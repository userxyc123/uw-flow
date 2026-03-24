import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import type { RouteOption, GeoPoint } from "@uw-flow/shared-types";
import { buildCampusGraph } from "./seed";
import { computeCoverageScore } from "./coverage";
import { RainService } from "./rain";

const rainService = new RainService();
// NOTE: startRefreshLoop() is called from index.ts (server entry point only, not here)

export { rainService };

const router = Router();

/** In-memory store of computed routes keyed by route_id */
const routeStore = new Map<string, RouteOption>();

/**
 * Compute multiple route options between two points.
 * Returns routes sorted by coverage_score descending (highest coverage first).
 * Requirement 1.1, 1.4
 */
export function computeDryRoutes(
  origin: GeoPoint,
  destination: GeoPoint,
  rainProbability = 0,
  stalenessWarning = false
): RouteOption[] {
  const graph = buildCampusGraph(rainProbability);

  const originNode = graph.nearestNode(origin);
  const destNode = graph.nearestNode(destination);

  if (!originNode || !destNode) return [];
  if (originNode.id === destNode.id) {
    // Same location — return a zero-distance route
    const route: RouteOption = {
      route_id: uuidv4(),
      segments: [],
      total_distance_meters: 0,
      estimated_time_minutes: 0,
      coverage_score: 100,
      staleness_warning: stalenessWarning,
    };
    routeStore.set(route.route_id, route);
    return [route];
  }

  // Primary route: coverage-optimised (low rain probability weight)
  const primarySegments = graph.dijkstra(originNode.id, destNode.id);

  // Alternate route: distance-optimised (high rain probability = open paths penalised more)
  const altGraph = buildCampusGraph(0); // no rain penalty → shortest physical distance
  const altSegments = altGraph.dijkstra(originNode.id, destNode.id);

  const candidates: RouteOption[] = [];

  if (primarySegments) {
    const totalDist = primarySegments.reduce((s, seg) => s + seg.distance_meters, 0);
    const route: RouteOption = {
      route_id: uuidv4(),
      segments: primarySegments,
      total_distance_meters: totalDist,
      estimated_time_minutes: totalDist / 80, // ~80 m/min walking speed
      coverage_score: computeCoverageScore(primarySegments),
      staleness_warning: stalenessWarning,
    };
    candidates.push(route);
    routeStore.set(route.route_id, route);
  }

  if (altSegments) {
    const altTotalDist = altSegments.reduce((s, seg) => s + seg.distance_meters, 0);
    const altRoute: RouteOption = {
      route_id: uuidv4(),
      segments: altSegments,
      total_distance_meters: altTotalDist,
      estimated_time_minutes: altTotalDist / 80,
      coverage_score: computeCoverageScore(altSegments),
      staleness_warning: stalenessWarning,
    };
    // Only add if it's a genuinely different route
    const primaryIds = candidates[0]?.segments.map((s) => s.segment_id).join(",") ?? "";
    const altIds = altSegments.map((s) => s.segment_id).join(",");
    if (altIds !== primaryIds) {
      candidates.push(altRoute);
      routeStore.set(altRoute.route_id, altRoute);
    }
  }

  // Sort by coverage_score descending — highest coverage first (Requirement 1.4)
  candidates.sort((a, b) => b.coverage_score - a.coverage_score);

  return candidates;
}

/**
 * GET /routes/dry?origin_lat=&origin_lng=&dest_lat=&dest_lng=
 * Returns RouteOption[] sorted by coverage_score descending.
 */
router.get("/dry", async (req: Request, res: Response) => {
  const { origin_lat, origin_lng, dest_lat, dest_lng } = req.query;

  const originLat = parseFloat(origin_lat as string);
  const originLng = parseFloat(origin_lng as string);
  const destLat = parseFloat(dest_lat as string);
  const destLng = parseFloat(dest_lng as string);

  if ([originLat, originLng, destLat, destLng].some(isNaN)) {
    res.status(400).json({ error: "origin_lat, origin_lng, dest_lat, dest_lng are required numeric parameters" });
    return;
  }

  const origin: GeoPoint = { lat: originLat, lng: originLng };
  const destination: GeoPoint = { lat: destLat, lng: destLng };

  const { forecast, isStale } = await rainService.getCurrentForecast();
  const rainProbability = forecast
    ? rainService.getRainProbabilityAt(origin, forecast.cells)
    : 0;

  const routes = computeDryRoutes(origin, destination, rainProbability, isStale);

  // Attach fetched_at to response if we have a forecast
  const responsePayload = routes.map((r) => ({
    ...r,
    ...(forecast ? { fetched_at: forecast.fetched_at } : {}),
  }));

  res.json(responsePayload);
});

/**
 * GET /routes/dry/coverage-score?route_id=
 * Returns { coverage_score, staleness_warning } for a previously computed route.
 */
router.get("/dry/coverage-score", (req: Request, res: Response) => {
  const { route_id } = req.query;

  if (!route_id || typeof route_id !== "string") {
    res.status(400).json({ error: "route_id query parameter is required" });
    return;
  }

  const route = routeStore.get(route_id);
  if (!route) {
    res.status(404).json({ error: "Route not found" });
    return;
  }

  res.json({
    coverage_score: route.coverage_score,
    staleness_warning: route.staleness_warning,
  });
});

export { router as routesRouter };
