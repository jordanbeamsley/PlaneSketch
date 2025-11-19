import type { Vec2 } from "@/models/vectors"
import type { Viewport } from "../camera/viewportService";

export type SnapKind =
    | "none"
    | "node"
    | "segment"
    | "midpoint"
    | "axisH"
    | "axisV"
    | "perpendicular"
    | "origin"
    | "grid"
    | "circle";

/** Maps what secondary snaps can co-exist with primary */
export type ResidualPolicy = Record<SnapKind, ReadonlySet<SnapKind>>;

// ID and geometric only data-sources, exclude pixi information
export interface NodeLite { id: string, p: Vec2 }
export interface SegmentLite { id: string, a: Vec2, b: Vec2 }
export interface CircleLite { id: string, centre: Vec2, rad: number }

export interface SnapDataSource {
    // Introduce spacial indexing in the future
    getNodes(): Iterable<NodeLite>;
    getSegments(): Iterable<SegmentLite>;
    getCircles(): Iterable<CircleLite>;
}

interface SnapResultNone {
    kind: "none"
    p: Vec2
}

interface SnapResultValid {
    kind: Exclude<SnapKind, "none">;
    p: Vec2;
    primary: Omit<SnapCandidate, "dist2">;
    residual?: Omit<SnapCandidate, "dist2">;
}

/** What snap engine returns to tools */
export type SnapResult = SnapResultNone | SnapResultValid;

/** For snaps that require an achor (ie. start point) such as vertical and horizontal snapping */
export interface AxisAnchor {
    anchor: Vec2;
}

export interface SnapOptions {
    /** General capture radius for proximity based rules (node, segment, midpoint, etc.) */
    radius: number;
    /** Enable/ disable rules */
    enable: Partial<Record<SnapKind, boolean>>;

    /** Sticky factor, use > 1.0 to prefer last snap over new */
    hysterisisMult?: number
    lastTarget?: { kind: Exclude<SnapKind, "none">, id?: string }

    /** Optionally set the minimum segment distance */
    segmentMin?: number
}

export interface SnapRuleContext {
    p: Vec2;            // pointer in world
    ds: SnapDataSource; // data source for snap rules
    viewport: Viewport;
    opts: SnapOptions;  // rule switches / tuning
    axis?: AxisAnchor;
}

// What snap rules return, engine picks the best option
export interface SnapCandidate {
    kind: Exclude<SnapKind, "none">;
    p: Vec2;
    /** Compare with squared distance, avoid square roots */
    dist2: number;
    /** Optionally include id of snapping target (e.g NodeID, SegmentID) */
    id?: string;
    /** Priority tie-breaker, used when dist2's are similar (default to 0) */
    priority?: number;
}

export interface SnapRule {
    /** 
     * Given the current pointer context, propose 0..N snap candidates 
     * Internally works in screen space, but returns world space position
     */
    evaluate(ctx: SnapRuleContext): SnapCandidate[];
    /** 
     * Check whether rule passes at an exact point
     * Used when combining primary snap with a residual
     * We don't need to check if snap rule is enabled, as we won't get the primary candidate if its not
     */
    validateAt?(p: Vec2, ctx: SnapRuleContext): boolean;
    /** Return name of SnapKind, useful for debugging */
    name: string;
}
