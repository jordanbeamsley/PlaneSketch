import type { idsByKind } from "@/cad/editor/stores/createSelectionStore";
import type { SketchConstraint } from "@/cad/models/sketch/constraints";

/**
 * Encapsulates the constraint-specific logic for a single constraint kind.
 *
 * Given the current selection, a handler decides what concrete constraint structs to create
 * (potentially more than one, e.g. 3 nodes -> 2 horizontal constraints sharing a base node).
 */
export interface ConstraintHandler {
    build(selection: idsByKind): SketchConstraint[] | null;
}
