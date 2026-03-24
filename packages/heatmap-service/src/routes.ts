import { Router, Request, Response } from "express";
import { getCurrentSnapshot, refreshSnapshot, getCellById, buildHeatmapCell, getQuietStudySpots } from "./heatmap";

export const router = Router();

// GET /heatmap — full snapshot
router.get("/heatmap", (_req: Request, res: Response) => {
  res.json(getCurrentSnapshot());
});

// GET /heatmap/quiet-spots — top 3 quietest study-eligible cells
router.get("/heatmap/quiet-spots", (_req: Request, res: Response) => {
  res.json(getQuietStudySpots(3));
});

// GET /heatmap/area/:cell_id — single cell detail
router.get("/heatmap/area/:cell_id", (req: Request, res: Response) => {
  const def = getCellById(req.params.cell_id);
  if (!def) {
    res.status(404).json({ error: "Cell not found" });
    return;
  }
  res.json(buildHeatmapCell(def));
});

// POST /heatmap/refresh — manual trigger (useful for testing/admin)
router.post("/heatmap/refresh", (_req: Request, res: Response) => {
  res.json(refreshSnapshot());
});
