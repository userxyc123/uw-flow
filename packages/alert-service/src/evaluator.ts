import type { UserAlertPreferences } from "@uw-flow/shared-types";
import { getPreferences, getDefaultPreferences } from "./preferences";

export interface AlertEvent {
  type: "wait_time" | "rain" | "quiet_spot";
  user_id: string;
  message: string;
  venue_id?: string;
  idempotency_key: string;
}

// Sliding window rate limiter: user_id -> timestamps of sent notifications
const notificationLog = new Map<string, number[]>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(userId: string, now: number = Date.now()): boolean {
  const log = notificationLog.get(userId) ?? [];
  const recent = log.filter((t) => now - t < RATE_WINDOW_MS);
  notificationLog.set(userId, recent);
  return recent.length >= RATE_LIMIT;
}

function recordNotification(userId: string, now: number = Date.now()): void {
  const log = notificationLog.get(userId) ?? [];
  log.push(now);
  notificationLog.set(userId, log);
}

export function resetEvaluator(): void {
  notificationLog.clear();
}

// ── Alert generation helpers ──────────────────────────────────────────────────

export interface WaitTimeCondition {
  venue_id: string;
  venue_name: string;
  current_wait_minutes: number;
}

export interface RainCondition {
  minutes_until_rain: number;
  coverage_route_available: boolean;
}

export interface QuietSpotCondition {
  venue_id: string;
  venue_name: string;
  previous_density: number;
  current_density: number;
}

/**
 * Evaluate all alert conditions for a user and return alerts to dispatch.
 * Respects per-type opt-out flags and the 10/hour rate cap.
 */
export function evaluateAlerts(
  userId: string,
  conditions: {
    waitTime?: WaitTimeCondition;
    rain?: RainCondition;
    quietSpot?: QuietSpotCondition;
  },
  now: number = Date.now()
): AlertEvent[] {
  const prefs: UserAlertPreferences = getPreferences(userId) ?? getDefaultPreferences(userId);
  const alerts: AlertEvent[] = [];

  // Wait time alert (Requirement 5.1)
  if (
    prefs.wait_time_alerts_enabled &&
    conditions.waitTime &&
    conditions.waitTime.current_wait_minutes <= prefs.wait_time_threshold_minutes
  ) {
    alerts.push({
      type: "wait_time",
      user_id: userId,
      message: `The line at ${conditions.waitTime.venue_name} just dropped to ${conditions.waitTime.current_wait_minutes} minutes.`,
      venue_id: conditions.waitTime.venue_id,
      idempotency_key: `wait_time:${userId}:${conditions.waitTime.venue_id}:${Math.floor(now / 60_000)}`,
    });
  }

  // Rain proximity alert (Requirement 5.2)
  if (prefs.rain_alerts_enabled && conditions.rain) {
    const { minutes_until_rain } = conditions.rain;
    alerts.push({
      type: "rain",
      user_id: userId,
      message: `Rain starting in ${minutes_until_rain} minutes — take the covered route to your next class.`,
      idempotency_key: `rain:${userId}:${Math.floor(now / (5 * 60_000))}`, // dedupe per 5-min window
    });
  }

  // Quiet spot alert (Requirement 5.3)
  if (
    prefs.quiet_spot_alerts_enabled &&
    conditions.quietSpot &&
    prefs.favorite_study_spots.includes(conditions.quietSpot.venue_id) &&
    conditions.quietSpot.current_density < conditions.quietSpot.previous_density - 20
  ) {
    alerts.push({
      type: "quiet_spot",
      user_id: userId,
      message: `${conditions.quietSpot.venue_name} is unusually quiet right now.`,
      venue_id: conditions.quietSpot.venue_id,
      idempotency_key: `quiet_spot:${userId}:${conditions.quietSpot.venue_id}:${Math.floor(now / (10 * 60_000))}`,
    });
  }

  // Apply rate cap — only return alerts that fit within the window (Requirement 5.6)
  const allowed: AlertEvent[] = [];
  for (const alert of alerts) {
    if (!isRateLimited(userId, now)) {
      allowed.push(alert);
      recordNotification(userId, now);
    }
  }

  return allowed;
}
