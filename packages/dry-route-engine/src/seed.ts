import type { RouteSegment } from "@uw-flow/shared-types";
import { PathGraph } from "./graph";

/**
 * Representative UW Seattle campus nodes and edges.
 * Coordinates are approximate real-world lat/lng values.
 */

export interface SeedNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const CAMPUS_NODES: SeedNode[] = [
  { id: "hub",          name: "HUB (Husky Union Building)",   lat: 47.6558, lng: -122.3050 },
  { id: "odegaard",     name: "Odegaard Undergraduate Library", lat: 47.6565, lng: -122.3130 },
  { id: "red_square",   name: "Red Square",                   lat: 47.6557, lng: -122.3090 },
  { id: "kane_hall",    name: "Kane Hall",                    lat: 47.6553, lng: -122.3110 },
  { id: "suzzallo",     name: "Suzzallo Library",             lat: 47.6556, lng: -122.3080 },
  { id: "uw_tower",     name: "UW Tower",                     lat: 47.6600, lng: -122.3140 },
  { id: "ima",          name: "IMA (Intramural Activities)",  lat: 47.6530, lng: -122.3010 },
  { id: "health_sci",   name: "Health Sciences Building",     lat: 47.6510, lng: -122.3070 },
  { id: "engineering",  name: "Engineering Quad",             lat: 47.6540, lng: -122.3050 },
  { id: "physics",      name: "Physics / Astronomy Building", lat: 47.6545, lng: -122.3100 },
  { id: "savery",       name: "Savery Hall",                  lat: 47.6560, lng: -122.3120 },
  { id: "link_station", name: "UW Link Light Rail Station",   lat: 47.6497, lng: -122.3035 },
  { id: "padelford",    name: "Padelford Hall",               lat: 47.6535, lng: -122.3130 },
  { id: "allen_lib",    name: "Allen Library",                lat: 47.6558, lng: -122.3095 },
];

/**
 * Edges between nodes with coverage_type annotations.
 * Each entry: [fromId, toId, segment]
 */
export const CAMPUS_EDGES: Array<[string, string, Omit<RouteSegment, "start_point" | "end_point">]> = [
  // HUB ↔ Red Square — covered walkway
  ["hub", "red_square", {
    segment_id: "hub_redsq",
    distance_meters: 120,
    is_covered: true,
    coverage_type: "walkway",
    elevation_change_meters: 0,
    has_construction: false,
  }],
  // Red Square ↔ Kane Hall — open plaza
  ["red_square", "kane_hall", {
    segment_id: "redsq_kane",
    distance_meters: 80,
    is_covered: false,
    coverage_type: "open",
    elevation_change_meters: 0,
    has_construction: false,
  }],
  // Red Square ↔ Suzzallo — covered walkway
  ["red_square", "suzzallo", {
    segment_id: "redsq_suzz",
    distance_meters: 60,
    is_covered: true,
    coverage_type: "walkway",
    elevation_change_meters: 0,
    has_construction: false,
  }],
  // Suzzallo ↔ Allen Library — building interior connection
  ["suzzallo", "allen_lib", {
    segment_id: "suzz_allen",
    distance_meters: 50,
    is_covered: true,
    coverage_type: "building_interior",
    elevation_change_meters: 0,
    has_construction: false,
  }],
  // Allen Library ↔ Odegaard — covered walkway
  ["allen_lib", "odegaard", {
    segment_id: "allen_odeg",
    distance_meters: 90,
    is_covered: true,
    coverage_type: "walkway",
    elevation_change_meters: 0,
    has_construction: false,
  }],
  // Kane Hall ↔ Savery — covered walkway
  ["kane_hall", "savery", {
    segment_id: "kane_savery",
    distance_meters: 70,
    is_covered: true,
    coverage_type: "walkway",
    elevation_change_meters: 0,
    has_construction: false,
  }],
  // Savery ↔ Odegaard — open path
  ["savery", "odegaard", {
    segment_id: "savery_odeg",
    distance_meters: 100,
    is_covered: false,
    coverage_type: "open",
    elevation_change_meters: 0,
    has_construction: false,
  }],
  // Odegaard ↔ UW Tower — overhang
  ["odegaard", "uw_tower", {
    segment_id: "odeg_tower",
    distance_meters: 200,
    is_covered: true,
    coverage_type: "overhang",
    elevation_change_meters: 5,
    has_construction: false,
  }],
  // HUB ↔ Engineering — open path
  ["hub", "engineering", {
    segment_id: "hub_eng",
    distance_meters: 150,
    is_covered: false,
    coverage_type: "open",
    elevation_change_meters: -2,
    has_construction: false,
  }],
  // Engineering ↔ Physics — covered walkway
  ["engineering", "physics", {
    segment_id: "eng_phys",
    distance_meters: 110,
    is_covered: true,
    coverage_type: "walkway",
    elevation_change_meters: 0,
    has_construction: false,
  }],
  // Physics ↔ Kane Hall — open path
  ["physics", "kane_hall", {
    segment_id: "phys_kane",
    distance_meters: 95,
    is_covered: false,
    coverage_type: "open",
    elevation_change_meters: 0,
    has_construction: false,
  }],
  // Engineering ↔ IMA — open path
  ["engineering", "ima", {
    segment_id: "eng_ima",
    distance_meters: 250,
    is_covered: false,
    coverage_type: "open",
    elevation_change_meters: -3,
    has_construction: false,
  }],
  // IMA ↔ Link Station — open path
  ["ima", "link_station", {
    segment_id: "ima_link",
    distance_meters: 300,
    is_covered: false,
    coverage_type: "open",
    elevation_change_meters: -5,
    has_construction: false,
  }],
  // Link Station ↔ Health Sciences — tunnel
  ["link_station", "health_sci", {
    segment_id: "link_health_tunnel",
    distance_meters: 180,
    is_covered: true,
    coverage_type: "tunnel",
    elevation_change_meters: 10,
    has_construction: false,
  }],
  // Health Sciences ↔ Engineering — building interior
  ["health_sci", "engineering", {
    segment_id: "health_eng",
    distance_meters: 130,
    is_covered: true,
    coverage_type: "building_interior",
    elevation_change_meters: 2,
    has_construction: false,
  }],
  // Padelford ↔ Savery — covered walkway
  ["padelford", "savery", {
    segment_id: "pad_savery",
    distance_meters: 85,
    is_covered: true,
    coverage_type: "walkway",
    elevation_change_meters: 0,
    has_construction: false,
  }],
  // Padelford ↔ Kane Hall — open path
  ["padelford", "kane_hall", {
    segment_id: "pad_kane",
    distance_meters: 140,
    is_covered: false,
    coverage_type: "open",
    elevation_change_meters: 0,
    has_construction: false,
  }],
  // HUB ↔ Suzzallo — covered walkway
  ["hub", "suzzallo", {
    segment_id: "hub_suzz",
    distance_meters: 100,
    is_covered: true,
    coverage_type: "walkway",
    elevation_change_meters: 0,
    has_construction: false,
  }],
];

/**
 * Build and return a PathGraph seeded with UW campus data.
 */
export function buildCampusGraph(rainProbability = 0): PathGraph {
  const graph = new PathGraph();

  for (const n of CAMPUS_NODES) {
    graph.addNode({ id: n.id, point: { lat: n.lat, lng: n.lng } });
  }

  const nodeMap = new Map(CAMPUS_NODES.map((n) => [n.id, n]));

  for (const [fromId, toId, segBase] of CAMPUS_EDGES) {
    const from = nodeMap.get(fromId)!;
    const to = nodeMap.get(toId)!;
    const segment: RouteSegment = {
      ...segBase,
      start_point: { lat: from.lat, lng: from.lng },
      end_point: { lat: to.lat, lng: to.lng },
    };
    graph.addEdge(fromId, toId, segment, rainProbability);
  }

  return graph;
}
