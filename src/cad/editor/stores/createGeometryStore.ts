import type { SketchDocument } from "@/cad/models/sketch/document";
import type { ArcId, BlockInstId, CircleId, NodeId, SegmentId } from "@/cad/models/sketch/ids"
import type { Arc, BlockInstance, Circle, Node, Segment } from "@/cad/models/sketch/primitives"
import { createStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GeometryState = {
    nodes: Map<NodeId, Node>;
    segments: Map<SegmentId, Segment>;
    circles: Map<CircleId, Circle>;
    arcs: Map<ArcId, Arc>;
    blockInstances: Map<BlockInstId, BlockInstance>;
};

export type GeometryActions = {
    clear(): void;

    addNode(n: Node): void;
    addSegment(s: Segment): void;
    addCircle(c: Circle): void;
    addArc(a: Arc): void;
    addBlockInstance(b: BlockInstance): void;

    addMany(doc: SketchDocument): void;

    removeNode(id: NodeId): void;
    removeSegment(id: SegmentId): void;
    removeCircle(id: CircleId): void;
    removeArc(id: ArcId): void;
    removeBlockInstance(id: BlockInstId): void;

    removeMany(nids: Set<NodeId>, sids: Set<SegmentId>, cids: Set<CircleId>): void;

    /** serialization */
    toDocument(docId: string, name?: string, constraints?: unknown[]): SketchDocument;
};

export type GeometryStore = ReturnType<typeof createGeometryStore>;

/** Factory for a sessions scope geometry store
 *
 * Each EditorSession gets its own instance
 * */
export function createGeometryStore(initial?: Partial<GeometryState>) {
    return createStore<GeometryState & GeometryActions>()(
        subscribeWithSelector(
            (set, get) => ({
                nodes: initial?.nodes ?? new Map(),
                segments: initial?.segments ?? new Map(),
                circles: initial?.circles ?? new Map(),
                arcs: initial?.arcs ?? new Map(),
                blockInstances: initial?.blockInstances ?? new Map(),

                clear: () => set({
                    nodes: new Map(),
                    segments: new Map(),
                    circles: new Map(),
                    arcs: new Map(),
                    blockInstances: new Map()
                }),

                addNode: (e) => set((s) => {
                    const nodes = new Map(s.nodes);
                    nodes.set(e.id, e);
                    return { nodes };
                }),

                addSegment: (e) => set((s) => {
                    const segments = new Map(s.segments);
                    segments.set(e.id, e);
                    return { segments };
                }),

                addCircle: (e) => set((s) => {
                    const circles = new Map(s.circles);
                    circles.set(e.id, e);
                    return { circles };
                }),

                addArc: (e) => set((s) => {
                    const arcs = new Map(s.arcs);
                    arcs.set(e.id, e);
                    return { arcs };
                }),

                addBlockInstance: (e) => set((s) => {
                    const blockInstances = new Map(s.blockInstances);
                    blockInstances.set(e.id, e);
                    return { blockInstances };
                }),

                addMany: (doc) => {
                    const state = get();
                    const nodes = new Map(state.nodes);
                    const segments = new Map(state.segments);
                    const arcs = new Map(state.arcs);
                    const circles = new Map(state.circles);
                    const blockInstances = new Map(state.blockInstances);

                    for (const n of doc.nodes) nodes.set(n.id, n);
                    for (const s of doc.segments) segments.set(s.id, s);
                    for (const a of doc.arcs) arcs.set(a.id, a);
                    for (const c of doc.circles) circles.set(c.id, c);
                    for (const b of doc.blockInstances) blockInstances.set(b.id, b);

                    set({ nodes: nodes, segments: segments, arcs: arcs, circles: circles, blockInstances: blockInstances });
                },

                removeNode: (id) => set((s) => {
                    const nodes = new Map(s.nodes);
                    nodes.delete(id);
                    return { nodes };
                }),

                removeSegment: (id) => set((s) => {
                    const segments = new Map(s.segments);
                    segments.delete(id);
                    return { segments };
                }),

                removeCircle: (id) => set((s) => {
                    const circles = new Map(s.circles);
                    circles.delete(id);
                    return { circles };
                }),

                removeArc: (id) => set((s) => {
                    const arcs = new Map(s.arcs);
                    arcs.delete(id);
                    return { arcs };
                }),

                removeBlockInstance: (id) => set((s) => {
                    const blockInstances = new Map(s.blockInstances);
                    blockInstances.delete(id);
                    return { blockInstances };
                }),

                removeMany: (nids, sids, cids) => {
                    const state = get();
                    const nodes = new Map(state.nodes);
                    const segments = new Map(state.segments);
                    const circles = new Map(state.circles);

                    for (const n of nids) nodes.delete(n);
                    for (const s of sids) segments.delete(s);
                    for (const c of cids) circles.delete(c);

                    set({ nodes: nodes, segments: segments, circles: circles });
                },

                toDocument: (docId, name, constraints = []) => {
                    const s = get();
                    return {
                        id: docId,
                        name,
                        nodes: Array.from(s.nodes.values()),
                        segments: Array.from(s.segments.values()),
                        arcs: Array.from(s.arcs.values()),
                        circles: Array.from(s.circles.values()),
                        blockInstances: Array.from(s.blockInstances.values()),
                        constraints,
                    };
                },
            })
        )
    );
}
