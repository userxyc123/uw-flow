import type { GeoPoint, RouteSegment } from "@uw-flow/shared-types";

// Coverage weight multipliers — lower weight = more preferred by Dijkstra's
const COVERAGE_WEIGHTS: Record<RouteSegment["coverage_type"], number> = {
  tunnel: 0.1,
  building_interior: 0.2,
  walkway: 0.4,
  overhang: 0.6,
  open: 1.0,
};

export interface GraphNode {
  id: string;
  point: GeoPoint;
}

export interface GraphEdge {
  segment: RouteSegment;
  /** Dijkstra weight: base distance adjusted by coverage and rain probability */
  weight: number;
}

export class PathGraph {
  private nodes = new Map<string, GraphNode>();
  /** adjacency list: nodeId → outgoing edges */
  private adj = new Map<string, GraphEdge[]>();

  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    if (!this.adj.has(node.id)) {
      this.adj.set(node.id, []);
    }
  }

  addEdge(fromId: string, toId: string, segment: RouteSegment, rainProbability = 0): void {
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) {
      throw new Error(`Node not found: ${fromId} or ${toId}`);
    }
    const coverageMultiplier = COVERAGE_WEIGHTS[segment.coverage_type];
    // When rain probability is high, open paths become even more expensive
    const rainPenalty = segment.coverage_type === "open" ? 1 + rainProbability * 2 : 1;
    const weight = segment.distance_meters * coverageMultiplier * rainPenalty;

    const edge: GraphEdge = { segment, weight };
    this.adj.get(fromId)!.push(edge);
    // Bidirectional
    const reverseSegment: RouteSegment = {
      ...segment,
      segment_id: segment.segment_id + "_rev",
      start_point: segment.end_point,
      end_point: segment.start_point,
    };
    this.adj.get(toId)!.push({ segment: reverseSegment, weight });
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Modified Dijkstra's that minimises edge weight (lower weight = more covered).
   * Returns the ordered list of RouteSegments forming the shortest (most-covered) path,
   * or null if no path exists.
   */
  dijkstra(startId: string, endId: string): RouteSegment[] | null {
    const dist = new Map<string, number>();
    const prev = new Map<string, { nodeId: string; segment: RouteSegment } | null>();

    for (const id of this.nodes.keys()) {
      dist.set(id, Infinity);
      prev.set(id, null);
    }
    dist.set(startId, 0);

    // Simple priority queue using a sorted array (adequate for campus-scale graphs)
    const queue: Array<{ id: string; cost: number }> = [{ id: startId, cost: 0 }];

    while (queue.length > 0) {
      queue.sort((a, b) => a.cost - b.cost);
      const { id: current } = queue.shift()!;

      if (current === endId) break;

      for (const edge of this.adj.get(current) ?? []) {
        const neighbor = edge.segment.end_point === this.nodes.get(current)?.point
          ? this.findNodeByPoint(edge.segment.start_point)
          : this.findNodeByPoint(edge.segment.end_point);

        if (!neighbor) continue;

        const newDist = dist.get(current)! + edge.weight;
        if (newDist < dist.get(neighbor.id)!) {
          dist.set(neighbor.id, newDist);
          prev.set(neighbor.id, { nodeId: current, segment: edge.segment });
          queue.push({ id: neighbor.id, cost: newDist });
        }
      }
    }

    if (dist.get(endId) === Infinity) return null;

    // Reconstruct path
    const path: RouteSegment[] = [];
    let cur: string | null = endId;
    while (cur) {
      const entry: { nodeId: string; segment: RouteSegment } | null | undefined = prev.get(cur);
      if (!entry) break;
      path.unshift(entry.segment);
      cur = entry.nodeId;
    }
    return path;
  }

  private findNodeByPoint(point: GeoPoint): GraphNode | undefined {
    for (const node of this.nodes.values()) {
      if (node.point.lat === point.lat && node.point.lng === point.lng) {
        return node;
      }
    }
    return undefined;
  }

  /**
   * Find the nearest node to a given GeoPoint (Euclidean approximation).
   */
  nearestNode(point: GeoPoint): GraphNode | null {
    let best: GraphNode | null = null;
    let bestDist = Infinity;
    for (const node of this.nodes.values()) {
      const d = Math.hypot(node.point.lat - point.lat, node.point.lng - point.lng);
      if (d < bestDist) {
        bestDist = d;
        best = node;
      }
    }
    return best;
  }
}
