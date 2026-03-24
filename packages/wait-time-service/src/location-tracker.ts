// In-memory map: userId -> venueId -> last verified location timestamp
const lastVerifiedMap = new Map<string, Map<string, Date>>();

const VERIFICATION_TTL_MS = 45 * 60 * 1000; // 45 minutes

export function getLastVerifiedAt(userId: string, venueId: string): Date | null {
  return lastVerifiedMap.get(userId)?.get(venueId) ?? null;
}

export function setLastVerifiedAt(userId: string, venueId: string, at: Date = new Date()): void {
  if (!lastVerifiedMap.has(userId)) {
    lastVerifiedMap.set(userId, new Map());
  }
  lastVerifiedMap.get(userId)!.set(venueId, at);
}

export function needsLocationConfirmation(userId: string, venueId: string, now: Date = new Date()): boolean {
  const last = getLastVerifiedAt(userId, venueId);
  if (last === null) return true;
  return now.getTime() - last.getTime() > VERIFICATION_TTL_MS;
}

/** Reset state (for testing) */
export function resetLocationTracker(): void {
  lastVerifiedMap.clear();
}
