import type { AlertEvent } from "./evaluator";

// Idempotency store: tracks already-dispatched keys to prevent duplicates
const dispatched = new Set<string>();

export interface DispatchResult {
  success: boolean;
  idempotency_key: string;
  attempts: number;
}

/**
 * Dispatch a push notification with up to 3 retries and exponential backoff.
 * Uses idempotency_key to prevent duplicate sends.
 */
export async function dispatchAlert(
  alert: AlertEvent,
  pushFn: (alert: AlertEvent) => Promise<void> = defaultPushFn,
  maxRetries = 3
): Promise<DispatchResult> {
  // Idempotency check
  if (dispatched.has(alert.idempotency_key)) {
    return { success: true, idempotency_key: alert.idempotency_key, attempts: 0 };
  }

  let attempts = 0;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    attempts = attempt;
    try {
      await pushFn(alert);
      dispatched.add(alert.idempotency_key);
      return { success: true, idempotency_key: alert.idempotency_key, attempts };
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        // Exponential backoff: 100ms, 200ms, 400ms
        await sleep(100 * Math.pow(2, attempt - 1));
      }
    }
  }

  console.error(`[dispatcher] Failed to dispatch alert after ${maxRetries} attempts:`, lastError);
  return { success: false, idempotency_key: alert.idempotency_key, attempts };
}

/** Dispatch multiple alerts, returning results for each */
export async function dispatchAlerts(
  alerts: AlertEvent[],
  pushFn?: (alert: AlertEvent) => Promise<void>
): Promise<DispatchResult[]> {
  return Promise.all(alerts.map((a) => dispatchAlert(a, pushFn)));
}

/** Default no-op push function — replace with real provider integration */
async function defaultPushFn(alert: AlertEvent): Promise<void> {
  // In production: call FCM / APNs / Expo push API here
  console.log(`[push] ${alert.type} → user:${alert.user_id} — ${alert.message}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Reset idempotency store (for testing) */
export function resetDispatcher(): void {
  dispatched.clear();
}
