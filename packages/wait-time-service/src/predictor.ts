import type { WaitPrediction } from "@uw-flow/shared-types";

// Historical baseline wait times per venue, day-of-week (0=Sun..6=Sat), hour-of-day
// Values represent typical wait minutes for that slot
type DayHourMap = Record<number, Record<number, number>>;

const HISTORICAL_BASELINES: Record<string, DayHourMap> = {
  "hub-food-court": buildBaseline([0, 0, 0, 0, 0, 15, 20, 25, 30, 20, 15, 25, 35, 30, 20, 15, 10, 10, 10, 10, 5, 5, 0, 0]),
  "starbucks-hub": buildBaseline([0, 0, 0, 0, 0, 5, 10, 15, 20, 15, 10, 10, 15, 10, 10, 10, 8, 5, 5, 5, 5, 0, 0, 0]),
  "local-point": buildBaseline([0, 0, 0, 0, 0, 5, 10, 15, 20, 15, 10, 20, 30, 25, 15, 10, 10, 10, 5, 5, 0, 0, 0, 0]),
  "district-market": buildBaseline([0, 0, 0, 0, 0, 5, 8, 10, 12, 10, 8, 15, 20, 15, 10, 8, 8, 8, 5, 5, 0, 0, 0, 0]),
  "uw-gym-equipment": buildBaseline([0, 0, 0, 0, 0, 5, 10, 15, 10, 8, 8, 10, 15, 20, 20, 25, 30, 25, 20, 15, 10, 5, 0, 0]),
  "ima": buildBaseline([0, 0, 0, 0, 0, 5, 10, 15, 10, 8, 8, 10, 15, 20, 20, 25, 30, 25, 20, 15, 10, 5, 0, 0]),
  "uw-libraries": buildBaseline([0, 0, 0, 0, 0, 0, 5, 10, 15, 20, 20, 20, 15, 20, 25, 25, 20, 15, 10, 10, 5, 5, 0, 0]),
  "advising-offices": buildBaseline([0, 0, 0, 0, 0, 0, 0, 5, 15, 25, 30, 25, 20, 25, 30, 25, 20, 10, 5, 0, 0, 0, 0, 0]),
  "hall-health": buildBaseline([0, 0, 0, 0, 0, 0, 0, 5, 15, 20, 25, 20, 15, 20, 25, 20, 15, 10, 5, 0, 0, 0, 0, 0]),
  "uw-bookstore": buildBaseline([0, 0, 0, 0, 0, 0, 0, 5, 10, 15, 20, 20, 15, 15, 20, 20, 15, 10, 5, 0, 0, 0, 0, 0]),
  "link-light-rail": buildBaseline([5, 5, 5, 5, 5, 5, 10, 15, 10, 8, 8, 8, 10, 8, 8, 10, 15, 20, 15, 10, 8, 8, 5, 5]),
};

/** Build a day->hour->minutes map using the same hourly pattern for all days */
function buildBaseline(hourlyPattern: number[]): DayHourMap {
  const map: DayHourMap = {};
  for (let day = 0; day < 7; day++) {
    map[day] = {};
    for (let hour = 0; hour < 24; hour++) {
      map[day][hour] = hourlyPattern[hour] ?? 0;
    }
  }
  return map;
}

/** Get historical baseline for a venue at a given time */
function getHistoricalBaseline(venueId: string, at: Date): number {
  const baseline = HISTORICAL_BASELINES[venueId];
  if (!baseline) return 5; // default fallback
  const day = at.getDay();
  const hour = at.getHours();
  return baseline[day]?.[hour] ?? 5;
}

/**
 * Predict wait time at a future offset.
 * Blends current observed wait with historical baseline at the future time.
 */
function predictAt(
  venueId: string,
  currentWait: number,
  minutesFromNow: number,
  now: Date
): number {
  const futureTime = new Date(now.getTime() + minutesFromNow * 60 * 1000);
  const historical = getHistoricalBaseline(venueId, futureTime);

  // Blend: weight current observation more heavily for near-term, historical for far-term
  const weight = minutesFromNow <= 10 ? 0.7 : minutesFromNow <= 20 ? 0.5 : 0.3;
  const predicted = Math.round(weight * currentWait + (1 - weight) * historical);
  return Math.max(0, predicted);
}

/**
 * Generate the three predictions (+10, +20, +30 minutes) for a venue.
 */
export function generatePredictions(
  venueId: string,
  currentWait: number,
  now: Date = new Date()
): WaitPrediction[] {
  const horizons: Array<10 | 20 | 30> = [10, 20, 30];

  return horizons.map((minutesFromNow) => {
    const predicted = predictAt(venueId, currentWait, minutesFromNow, now);
    const futureTime = new Date(now.getTime() + minutesFromNow * 60 * 1000);

    let recommendation: "Go Now" | "Go Later" | null = null;
    let optimal_arrival_time: string | undefined;

    if (predicted < currentWait) {
      recommendation = "Go Later";
      optimal_arrival_time = futureTime.toISOString();
    } else if (predicted > currentWait) {
      recommendation = "Go Now";
    }
    // equal → null

    const prediction: WaitPrediction = {
      minutes_from_now: minutesFromNow,
      predicted_wait_minutes: predicted,
      recommendation,
    };
    if (optimal_arrival_time !== undefined) {
      prediction.optimal_arrival_time = optimal_arrival_time;
    }
    return prediction;
  });
}
