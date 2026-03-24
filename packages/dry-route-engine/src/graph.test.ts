import { PathGraph } from "./graph";
import { computeCoverageScore, isCovered } from "./coverage";
import { buildCampusGraph, CAMPUS_NODES } from "./seed";
import { computeDryRoutes } from "./routes";
import type { RouteSegment, GeoPoint } from "@uw-flow/shared-types";

// Helper to build a minimal two-node graph
function makeSegment(overrides: Partial<RouteSegment> = {}): RouteSegment {
  return {
    segment_id: "seg1",
    start_point: { lat: 0, lng: 0 },
    end_point: { lat: 0, lng: 1 },
    distance_meters: 100,
    is_covered: true,
    coverage_type: "walkway",
    elevation_change_meters: 0,
    has_construction: false,
    ...overrides,
  };
}

describe("PathGraph", () => {
  it("finds a path between two connected nodes", () => {
    const graph = new PathGraph();
    graph.addNode({ id: "a", point: { lat: 0, lng: 0 } });
    graph.addNode({ id: "b", point: { lat: 0, lng: 1 } });
    const seg = makeSegment();
    graph.addEdge("a", "b", seg);
    const path = graph.dijkstra("a", "b");
    expect(path).not.toBeNull();
    expect(path!.length).toBe(1);
  });

  it("returns null when no path exists", () => {
    const graph = new PathGraph();
    graph.addNode({ id: "a", point: { lat: 0, lng: 0 } });
    graph.addNode({ id: "b", point: { lat: 0, lng: 1 } });
    // No edge added
    const path = graph.dijkstra("a", "b");
    expect(path).toBeNull();
  });

  it("prefers covered paths over open paths", () => {
    const graph = new PathGraph();
    graph.addNode({ id: "start", point: { lat: 0, lng: 0 } });
    graph.addNode({ id: "mid_covered", point: { lat: 0, lng: 0.5 } });
    graph.addNode({ id: "mid_open", point: { lat: 0.5, lng: 0 } });
    graph.addNode({ id: "end", point: { lat: 1, lng: 1 } });

    // Covered path: start → mid_covered → end (total weight lower)
    graph.addEdge("start", "mid_covered", makeSegment({
      segment_id: "s1",
      start_point: { lat: 0, lng: 0 },
      end_point: { lat: 0, lng: 0.5 },
      distance_meters: 100,
      coverage_type: "tunnel",
    }));
    graph.addEdge("mid_covered", "end", makeSegment({
      segment_id: "s2",
      start_point: { lat: 0, lng: 0.5 },
      end_point: { lat: 1, lng: 1 },
      distance_meters: 100,
      coverage_type: "building_interior",
    }));

    // Open path: start → mid_open → end (total weight higher)
    graph.addEdge("start", "mid_open", makeSegment({
      segment_id: "s3",
      start_point: { lat: 0, lng: 0 },
      end_point: { lat: 0.5, lng: 0 },
      distance_meters: 100,
      coverage_type: "open",
    }));
    graph.addEdge("mid_open", "end", makeSegment({
      segment_id: "s4",
      start_point: { lat: 0.5, lng: 0 },
      end_point: { lat: 1, lng: 1 },
      distance_meters: 100,
      coverage_type: "open",
    }));

    const path = graph.dijkstra("start", "end");
    expect(path).not.toBeNull();
    // All segments should be covered types
    const hasOpen = path!.some((s) => s.coverage_type === "open");
    expect(hasOpen).toBe(false);
  });

  it("nearestNode returns the closest node", () => {
    const graph = new PathGraph();
    graph.addNode({ id: "a", point: { lat: 47.0, lng: -122.0 } });
    graph.addNode({ id: "b", point: { lat: 47.5, lng: -122.5 } });
    const nearest = graph.nearestNode({ lat: 47.1, lng: -122.1 });
    expect(nearest?.id).toBe("a");
  });
});

describe("computeCoverageScore", () => {
  it("returns 100 for all-covered route", () => {
    const segs = [
      makeSegment({ distance_meters: 100, coverage_type: "walkway" }),
      makeSegment({ segment_id: "s2", distance_meters: 50, coverage_type: "tunnel" }),
    ];
    expect(computeCoverageScore(segs)).toBe(100);
  });

  it("returns 0 for all-open route", () => {
    const segs = [makeSegment({ coverage_type: "open", is_covered: false })];
    expect(computeCoverageScore(segs)).toBe(0);
  });

  it("returns 50 for half-covered route", () => {
    const segs = [
      makeSegment({ segment_id: "s1", distance_meters: 100, coverage_type: "walkway" }),
      makeSegment({ segment_id: "s2", distance_meters: 100, coverage_type: "open", is_covered: false }),
    ];
    expect(computeCoverageScore(segs)).toBe(50);
  });

  it("returns 0 for empty route", () => {
    expect(computeCoverageScore([])).toBe(0);
  });

  it("always returns a value in [0, 100]", () => {
    const segs = [makeSegment({ distance_meters: 0 })];
    const score = computeCoverageScore(segs);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("isCovered", () => {
  it.each(["walkway", "building_interior", "tunnel", "overhang"] as const)(
    "returns true for coverage_type=%s",
    (type) => {
      expect(isCovered(makeSegment({ coverage_type: type }))).toBe(true);
    }
  );

  it("returns false for open", () => {
    expect(isCovered(makeSegment({ coverage_type: "open" }))).toBe(false);
  });
});

describe("buildCampusGraph", () => {
  it("contains all seed nodes", () => {
    const graph = buildCampusGraph();
    for (const node of CAMPUS_NODES) {
      expect(graph.getNode(node.id)).toBeDefined();
    }
  });

  it("can find a path from HUB to Odegaard", () => {
    const graph = buildCampusGraph();
    const path = graph.dijkstra("hub", "odegaard");
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);
  });
});

describe("computeDryRoutes", () => {
  const hub = CAMPUS_NODES.find((n) => n.id === "hub")!;
  const odegaard = CAMPUS_NODES.find((n) => n.id === "odegaard")!;

  const origin: GeoPoint = { lat: hub.lat, lng: hub.lng };
  const destination: GeoPoint = { lat: odegaard.lat, lng: odegaard.lng };

  it("returns at least one route", () => {
    const routes = computeDryRoutes(origin, destination);
    expect(routes.length).toBeGreaterThan(0);
  });

  it("first route has highest coverage_score (Requirement 1.4)", () => {
    const routes = computeDryRoutes(origin, destination);
    for (const route of routes) {
      expect(routes[0].coverage_score).toBeGreaterThanOrEqual(route.coverage_score);
    }
  });

  it("all coverage_scores are in [0, 100] (Requirement 1.2)", () => {
    const routes = computeDryRoutes(origin, destination);
    for (const route of routes) {
      expect(route.coverage_score).toBeGreaterThanOrEqual(0);
      expect(route.coverage_score).toBeLessThanOrEqual(100);
    }
  });

  it("each route has a unique route_id", () => {
    const routes = computeDryRoutes(origin, destination);
    const ids = routes.map((r) => r.route_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("staleness_warning is propagated", () => {
    const routes = computeDryRoutes(origin, destination, 0, true);
    for (const route of routes) {
      expect(route.staleness_warning).toBe(true);
    }
  });
});
