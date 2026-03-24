import type { HeatmapSnapshot } from "@uw-flow/shared-types";
import { getAllCells, getQuietStudySpots, decayCellScores, GRID_CELLS, getCellById, buildHeatmapCell } from "./grid";

let _latestSnapshot: HeatmapSnapshot | null = null;
let _refreshTimer: ReturnType<typeof setInterval> | null = null;

/** Build and cache a fresh snapshot */
export function refreshSnapshot(): HeatmapSnapshot {
  decayCellScores();
  const snapshot: HeatmapSnapshot = {
    cells: getAllCells(),
    generated_at: new Date().toISOString(),
  };
  _latestSnapshot = snapshot;
  return snapshot;
}

/** Get the latest snapshot (or generate one if none exists) */
export function getCurrentSnapshot(): HeatmapSnapshot {
  if (!_latestSnapshot) return refreshSnapshot();
  return _latestSnapshot;
}

/** Start the ≤2-minute refresh cycle */
export function startRefreshCycle(intervalMs = 2 * 60 * 1000): ReturnType<typeof setInterval> {
  if (_refreshTimer) clearInterval(_refreshTimer);
  _refreshTimer = setInterval(() => refreshSnapshot(), intervalMs);
  return _refreshTimer;
}

/** Stop the refresh cycle */
export function stopRefreshCycle(): void {
  if (_refreshTimer) {
    clearInterval(_refreshTimer);
    _refreshTimer = null;
  }
}

export { GRID_CELLS, getCellById, buildHeatmapCell, getQuietStudySpots, getAllCells };
