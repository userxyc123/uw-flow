import type { CheckIn } from "@uw-flow/shared-types";

const WINDOW_MS = 30 * 60 * 1000; // 30-minute rolling window

interface AggregatorState {
  checkins: CheckIn[];
  last_checkin_at: Date | null;
}

// In-memory store: venue_id -> state
const store = new Map<string, AggregatorState>();

function getState(venueId: string): AggregatorState {
  if (!store.has(venueId)) {
    store.set(venueId, { checkins: [], last_checkin_at: null });
  }
  return store.get(venueId)!;
}

/** Prune check-ins older than the rolling window */
function pruneWindow(state: AggregatorState, now: Date): void {
  const cutoff = now.getTime() - WINDOW_MS;
  state.checkins = state.checkins.filter(
    (c) => new Date(c.submitted_at).getTime() >= cutoff
  );
}

/** Add a check-in to the aggregator */
export function ingestCheckin(checkin: CheckIn): void {
  const state = getState(checkin.venue_id);
  const now = new Date(checkin.submitted_at);
  pruneWindow(state, now);
  state.checkins.push(checkin);
  if (
    state.last_checkin_at === null ||
    now > state.last_checkin_at
  ) {
    state.last_checkin_at = now;
  }
}

/** Compute current wait time estimate (average of window check-ins, or 0) */
export function getCurrentWaitMinutes(venueId: string, now: Date = new Date()): number {
  const state = getState(venueId);
  pruneWindow(state, now);
  if (state.checkins.length === 0) return 0;
  const total = state.checkins.reduce((sum, c) => sum + c.reported_wait_minutes, 0);
  return Math.round(total / state.checkins.length);
}

/** Number of check-ins in the active window */
export function getCheckinCount(venueId: string, now: Date = new Date()): number {
  const state = getState(venueId);
  pruneWindow(state, now);
  return state.checkins.length;
}

/** Whether the venue is unverified (no check-in in last 30 minutes) */
export function isUnverified(venueId: string, now: Date = new Date()): boolean {
  const state = getState(venueId);
  if (state.last_checkin_at === null) return true;
  return now.getTime() - state.last_checkin_at.getTime() > WINDOW_MS;
}

/** Get last check-in time for a venue */
export function getLastCheckinAt(venueId: string): Date | null {
  return getState(venueId).last_checkin_at;
}

/** Reset state (for testing) */
export function resetAggregator(): void {
  store.clear();
}
