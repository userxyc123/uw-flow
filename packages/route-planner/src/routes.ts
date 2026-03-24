import { Router, Request, Response } from "express";
import { planRoutes } from "./planner";
import type { GeoPoint } from "@uw-flow/shared-types";

export const router = Router();

/**
 * GET /routes/smart
 * Query params: origin_lat, origin_lng, dest_lat, dest_lng, class_start_time (ISO8601, optional)
 * Body (optional JSON): { route_candidates, crowd_scores }
 *
 * In production the gateway would fetch route_candidates from DryRoute_Engine
 * and crowd_scores from Heatmap_Service. For the MVP we accept them in the body
 * so the service is independently testable.
 */
router.post("/routes/smart", (req: Request, res: Response) => {
  const { origin, destination, classStartTime, routeCandidates, crowdScores } = req.body as {
    origin: GeoPoint;
    destination: GeoPoint;
    classStartTime?: string;
    routeCandidates: Parameters<typeof planRoutes>[0]["routeCandidates"];
    crowdScores?: Record<string, number>;
  };

  if (!origin || !destination || !Array.isArray(routeCandidates)) {
    res.status(400).json({ error: "origin, destination, and routeCandidates are required" });
    return;
  }

  const routes = planRoutes({ origin, destination, classStartTime, routeCandidates, crowdScores });
  res.json(routes);
});
