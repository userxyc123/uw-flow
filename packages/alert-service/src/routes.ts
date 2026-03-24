import { Router, Request, Response } from "express";
import type { UserAlertPreferences } from "@uw-flow/shared-types";
import { savePreferences, getPreferences, getDefaultPreferences } from "./preferences";

export const router = Router();

// POST /alerts/preferences
router.post("/alerts/preferences", (req: Request, res: Response) => {
  const prefs = req.body as UserAlertPreferences;
  if (!prefs?.user_id) {
    res.status(400).json({ error: "user_id is required" });
    return;
  }
  savePreferences(prefs);
  res.json({ saved: true });
});

// GET /alerts/preferences?user_id=
router.get("/alerts/preferences", (req: Request, res: Response) => {
  const userId = req.query["user_id"] as string;
  if (!userId) {
    res.status(400).json({ error: "user_id query parameter is required" });
    return;
  }
  const prefs = getPreferences(userId) ?? getDefaultPreferences(userId);
  res.json(prefs);
});
