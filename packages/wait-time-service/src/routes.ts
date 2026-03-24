import { Router, Request, Response } from "express";
import { randomBytes } from "crypto";
import type { CheckIn } from "@uw-flow/shared-types";

function generateId(): string {
  return randomBytes(16).toString("hex");
}
import { SUPPORTED_VENUES, getVenueById } from "./venues";
import {
  ingestCheckin,
  getCurrentWaitMinutes,
  getCheckinCount,
  isUnverified,
} from "./aggregator";
import { generatePredictions } from "./predictor";
import {
  needsLocationConfirmation,
  setLastVerifiedAt,
} from "./location-tracker";

export const router = Router();

// GET /venues
router.get("/venues", (_req: Request, res: Response) => {
  res.json(SUPPORTED_VENUES);
});

// GET /venues/:id/wait-time
router.get("/venues/:id/wait-time", (req: Request, res: Response) => {
  const venue = getVenueById(req.params.id);
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  const now = new Date();
  const current_minutes = getCurrentWaitMinutes(venue.venue_id, now);
  const predictions = generatePredictions(venue.venue_id, current_minutes, now);
  const unverified = isUnverified(venue.venue_id, now);
  const checkin_count = getCheckinCount(venue.venue_id, now);

  res.json({ current_minutes, predictions, unverified, checkin_count });
});

// POST /venues/:id/checkins
router.post("/venues/:id/checkins", (req: Request, res: Response) => {
  const venue = getVenueById(req.params.id);
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  const { reported_wait_minutes, crowd_level, user_id } = req.body as {
    reported_wait_minutes: number;
    crowd_level: "low" | "medium" | "high";
    user_id?: string;
  };

  if (typeof reported_wait_minutes !== "number" || !crowd_level) {
    res.status(400).json({ error: "reported_wait_minutes and crowd_level are required" });
    return;
  }

  const userId = user_id ?? "anonymous";
  const confirm = req.query["confirm"] === "true";
  const now = new Date();

  // Task 4.11: location verification
  if (!confirm && needsLocationConfirmation(userId, venue.venue_id, now)) {
    res.json({ accepted: false, location_confirmation_required: true });
    return;
  }

  // Mark location as verified
  setLastVerifiedAt(userId, venue.venue_id, now);

  const checkin: CheckIn = {
    checkin_id: generateId(),
    venue_id: venue.venue_id,
    user_id: userId,
    reported_wait_minutes,
    crowd_level,
    submitted_at: now.toISOString(),
    location_verified: true,
  };

  ingestCheckin(checkin);

  res.json({ accepted: true });
});
