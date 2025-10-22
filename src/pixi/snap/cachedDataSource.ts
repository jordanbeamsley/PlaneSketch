import { useNodeStore } from "@/store/nodeStore";
import type { NodeLite, SegmentLite, SnapDataSource } from "./types";
import { useSegmentStore } from "@/store/segmentStore";
import { copyVec } from "@/models/vectors";

export class CachedDataSource implements SnapDataSource {
    private nodesLite: NodeLite[] = [];
    private segmentLite: SegmentLite[] = [];
    private unsubs: Array<() => void> = [];

    // Build cached store and subscribe to data store changes
    mount() {
        // Initial build
        this.rebuildNodes();
        this.rebuildSegments();

        // Store subscriptions
        this.unsubs.push(
            useNodeStore.subscribe(
                (state) => state.byId,
                () => {
                    this.rebuildNodes();
                    this.rebuildSegments();
                }
            )
        );

        this.unsubs.push(
            useSegmentStore.subscribe(
                (state) => state.byId,
                () => {
                    this.rebuildSegments();
                }
            )
        );
    }

    unmount() {
        this.unsubs.forEach(u => u());
        this.nodesLite = [];
        this.segmentLite = [];
        this.unsubs = [];
    }

    *getNodes(): Iterable<NodeLite> {
        for (const n of this.nodesLite) yield n;
    }

    *getSegments(): Iterable<SegmentLite> {
        for (const s of this.segmentLite) yield s;
    }

    private rebuildNodes() {
        const nodes = useNodeStore.getState().byId;
        this.nodesLite = Array.from(nodes.values()).map(n => ({ id: n.id, p: copyVec(n.p) }));
    }

    private rebuildSegments() {
        const segs = useSegmentStore.getState().byId;
        const nodes = useNodeStore.getState().byId;

        const out: SegmentLite[] = [];
        for (const seg of segs.values()) {
            const a = nodes.get(seg.p1);
            const b = nodes.get(seg.p2);

            // Should never happen, but handle edge case of dangling segment
            if (!a || !b) continue;
            out.push({
                id: seg.id,
                a: copyVec(a.p),
                b: copyVec(b.p)
            });
        }

        this.segmentLite = out;
    }
}
