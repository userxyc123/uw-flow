import type { HeatmapCell, GeoPolygon } from "@uw-flow/shared-types";

// UW campus heatmap grid — 12 cells covering key areas
// Each cell is a rough bounding box polygon around a campus zone

interface GridCellDef {
  cell_id: string;
  label_hint: string; // human-readable zone name
  study_eligible: boolean;
  polygon: GeoPolygon;
}

function box(minLat: number, minLng: number, maxLat: number, maxLng: number): GeoPolygon {
  return {
    points: [
      { lat: minLat, lng: minLng },
      { lat: maxLat, lng: minLng },
      { lat: maxLat, lng: maxLng },
      { lat: minLat, lng: maxLng },
      { lat: minLat, lng: minLng }, // close polygon
    ],
  };
}

export const GRID_CELLS: GridCellDef[] = [
  { cell_id: "hub-area",        label_hint: "HUB Area",           study_eligible: false, polygon: box(47.6550, -122.3060, 47.6570, -122.3040) },
  { cell_id: "red-square",      label_hint: "Red Square",         study_eligible: false, polygon: box(47.6555, -122.3080, 47.6575, -122.3060) },
  { cell_id: "suzzallo-area",   label_hint: "Suzzallo / Allen",   study_eligible: true,  polygon: box(47.6545, -122.3050, 47.6565, -122.3030) },
  { cell_id: "quad-area",       label_hint: "The Quad",           study_eligible: true,  polygon: box(47.6560, -122.3100, 47.6580, -122.3070) },
  { cell_id: "engineering-area",label_hint: "Engineering Quad",   study_eligible: true,  polygon: box(47.6530, -122.3020, 47.6555, -122.3000) },
  { cell_id: "ima-area",        label_hint: "IMA / Gym",          study_eligible: false, polygon: box(47.6515, -122.3015, 47.6535, -122.2995) },
  { cell_id: "local-point-area",label_hint: "Local Point / Lander",study_eligible: false, polygon: box(47.6520, -122.3135, 47.6545, -122.3110) },
  { cell_id: "health-sciences", label_hint: "Health Sciences",    study_eligible: true,  polygon: box(47.6490, -122.3070, 47.6520, -122.3040) },
  { cell_id: "light-rail-area", label_hint: "Light Rail Station", study_eligible: false, polygon: box(47.6480, -122.3055, 47.6505, -122.3025) },
  { cell_id: "paccar-area",     label_hint: "Paccar / Foster",    study_eligible: true,  polygon: box(47.6540, -122.3095, 47.6560, -122.3070) },
  { cell_id: "odegaard-area",   label_hint: "Odegaard Library",   study_eligible: true,  polygon: box(47.6565, -122.3055, 47.6580, -122.3035) },
  { cell_id: "burke-area",      label_hint: "Burke Museum / NE",  study_eligible: false, polygon: box(47.6575, -122.3120, 47.6595, -122.3090) },
];

export function getCellById(cellId: string): GridCellDef | undefined {
  return GRID_CELLS.find((c) => c.cell_id === cellId);
}

// In-memory density state per cell
interface CellState {
  density_score: number; // 0–100
  checkin_count: number;
  last_updated: Date;
}

const cellState = new Map<string, CellState>();

function getState(cellId: string): CellState {
  if (!cellState.has(cellId)) {
    cellState.set(cellId, { density_score: 20, checkin_count: 0, last_updated: new Date() });
  }
  return cellState.get(cellId)!;
}

function scoreToLabel(score: number): "Quiet" | "Moderate" | "Busy" {
  if (score < 35) return "Quiet";
  if (score < 70) return "Moderate";
  return "Busy";
}

/** Update density for a cell based on a new check-in signal */
export function recordCellActivity(cellId: string, activityLevel: number): void {
  const state = getState(cellId);
  // Exponential moving average — blend new signal with existing score
  state.density_score = Math.min(100, Math.max(0, Math.round(0.7 * state.density_score + 0.3 * activityLevel)));
  state.checkin_count += 1;
  state.last_updated = new Date();
}

/** Decay all cell scores toward baseline over time (called on refresh cycle) */
export function decayCellScores(): void {
  const now = Date.now();
  for (const [cellId, state] of cellState.entries()) {
    const minutesSinceUpdate = (now - state.last_updated.getTime()) / 60_000;
    if (minutesSinceUpdate > 5) {
      // Decay 5 points per 5-minute interval toward baseline of 20
      const baseline = 20;
      const decayAmount = Math.floor(minutesSinceUpdate / 5) * 5;
      if (state.density_score > baseline) {
        state.density_score = Math.max(baseline, state.density_score - decayAmount);
      }
    }
    void cellId; // suppress unused warning
  }
}

/** Build a HeatmapCell snapshot for a given grid cell */
export function buildHeatmapCell(cellDef: GridCellDef, now: Date = new Date()): HeatmapCell {
  const state = getState(cellDef.cell_id);
  return {
    cell_id: cellDef.cell_id,
    polygon: cellDef.polygon,
    density_score: state.density_score,
    label: scoreToLabel(state.density_score),
    updated_at: now.toISOString(),
  };
}

/** Get all cells as HeatmapCell array */
export function getAllCells(now: Date = new Date()): HeatmapCell[] {
  return GRID_CELLS.map((def) => buildHeatmapCell(def, now));
}

/** Get study-eligible cells sorted by density_score ascending (quietest first) */
export function getQuietStudySpots(count = 3): HeatmapCell[] {
  const studyCells = GRID_CELLS.filter((c) => c.study_eligible);
  return studyCells
    .map((def) => buildHeatmapCell(def))
    .sort((a, b) => a.density_score - b.density_score)
    .slice(0, count);
}

/** Reset state (for testing) */
export function resetGrid(): void {
  cellState.clear();
}
