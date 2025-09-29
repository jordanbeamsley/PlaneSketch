import type { Vec2 } from "@/models/vectors"

export type SnapKind =
    | "none"
    | "node"
    | "segment"
    | "midpoint"
    | "axisH"
    | "axisV"
    | "perpendicular"
    | "origin"
    | "grid";

// ID and geometric only data-sources, exclude pixi information
export interface NodeLite { id: string, p: Vec2 }
export interface SegmentLite { id: string, a: Vec2, b: Vec2 }

export interface SnapDataSource {
    // Simple for now, introduce spacial indexing in the future
    getNodes(): Iterable<NodeLite>;
    getSegments(): Iterable<SegmentLite>;
}

// What snap engine returns to tools
export type SnapResult =
    | { kind: "none", p: Vec2 }
    | { kind: Exclude<SnapKind, "none">, p: Vec2, id?: string };

// For snaps that require an achor (ie. start point) such as vertical and horizontal snapping
export interface AxisAnchor {
    anchor: Vec2;
}

export interface SnapOptions {
    // General capture radius for proximity based rules (node, segment, midpoint, etc.)
    radius: number;
    // Enable/ disable rules
    enable: Partial<Record<SnapKind, boolean>>;

    // Optional per-rule tuning, use bias to nudge score
    grid?: { stepX: number, stepY: number, bias?: number }
    origin?: { x?: number, y?: number, bias?: number } // Defaults to (0,0)
    hysterisisMult?: number // Sticky factor, use > 1.0 to prefer last snap over new
    lastTarget?: { kind: Exclude<SnapKind, "none">, id?: string }
}

export interface SnapRuleContext {
    p: Vec2;            // pointer in world
    ds: SnapDataSource; // data source for snap rules
    opts: SnapOptions;  // rule switches / tuning
    axis?: AxisAnchor;
}

// What snap rules return, engine picks the best option
export interface SnapCandidate {
    kind: Exclude<SnapKind, "none">;
    p: Vec2;
    // Compare with squared distance, avoid square roots
    dist2: number;
    // Optionally include id of snapping target (e.g NodeID, SegmentID)
    id?: string;
    // Priority tie-breaker, used when dist2's are similar (default to 0)
    priority?: number;
}

export interface SnapRule {
    // Return 0 or more candidates, don't mutate state
    evaluate(ctx: SnapRuleContext): SnapCandidate[];
    // Return name of SnapKind or family of SnapKinds, useful for debugging
    name: string;
}
