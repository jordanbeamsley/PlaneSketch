import type { SketchDocument } from "@/cad/models/sketch/document";

export function createEmptyDocument(): SketchDocument {
    return {
        id: crypto.randomUUID(),
        nodes: [],
        segments: [],
        circles: [],
        arcs: [],
        blockInstances: [],
        constraints: [],
    };
}
