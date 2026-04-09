import type { DocId } from "./ids";
import type { Node, Segment, Arc, Circle, BlockInstance } from "./primitives";
import type { SketchConstraint } from "./constraints";

/**
 * Serializable document format
 * Each block is its own "Document" as well as the global sketch
 */
export type SketchDocument = {
    id: DocId;
    name?: string;

    nodes: Node[];
    segments: Segment[];
    arcs: Arc[];
    circles: Circle[];

    blockInstances: BlockInstance[];

    constraints: SketchConstraint[];
};
