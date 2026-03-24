import type { UserAlertPreferences } from "@uw-flow/shared-types";

// In-memory store: user_id -> preferences
const store = new Map<string, UserAlertPreferences>();

export function savePreferences(prefs: UserAlertPreferences): void {
  store.set(prefs.user_id, { ...prefs });
}

export function getPreferences(userId: string): UserAlertPreferences | null {
  return store.get(userId) ?? null;
}

export function getDefaultPreferences(userId: string): UserAlertPreferences {
  return {
    user_id: userId,
    wait_time_alerts_enabled: true,
    wait_time_threshold_minutes: 10,
    rain_alerts_enabled: true,
    quiet_spot_alerts_enabled: true,
    favorite_study_spots: [],
  };
}

/** Reset (for testing) */
export function resetPreferences(): void {
  store.clear();
}
