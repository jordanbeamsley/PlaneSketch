import type { SketchConstraint } from "@/cad/models/sketch/constraints";
import type { NodeId, SegmentId, CircleId } from "@/cad/models/sketch/ids";

export interface ConstraintSelection {
    nodes: Set<NodeId>;
    segments: Set<SegmentId>;
    circles: Set<CircleId>;
}

/**
 * Encapsulates the constraint-specific application logic for a single constraint kind.
 *
 * Given the current selection, a handler decides what concrete constraint structs to create
 * (potentially more than one, e.g. 3 nodes → 2 horizontal constraints sharing a base node).
 * Returns null when the selection is not yet sufficient to produce a valid constraint.
 */
export interface ConstraintHandler {
    tryBuild(selection: ConstraintSelection): SketchConstraint[] | null;
}
