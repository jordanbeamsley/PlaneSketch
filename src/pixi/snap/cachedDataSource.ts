import { useNodeStore } from "@/store/nodeStore";
import type { NodeLite, SegmentLite, SnapDataSource } from "./types";
import { copyVec } from "@/models/vectors";

export class CachedDataSource implements SnapDataSource {
    private nodesLite: NodeLite[] = [];
    private segmentLite: SegmentLite[] = [];
    private subs: Array<() => void> = [];

    // Build cached store and subscribe to data store changes
    mount() {
        // Initial build
        this.rebuildNodes();
        this.rebuildSegments();

        // Store subscriptions
        this.subs.push(
            useNodeStore.subscribe(
                (_state) => { this.rebuildNodes(); }
            ),
        )
    }

    umount() {
        this.subs.forEach(u => u());
        this.nodesLite = [];
        this.segmentLite = [];
        this.subs = [];
    }

    *getNodes(): Iterable<NodeLite> {
        for (const n of this.nodesLite) yield n;
    }

    *getSegments(): Iterable<SegmentLite> {
        for (const s of this.segmentLite) yield s;
    }

    private rebuildNodes() {
        const nodes = useNodeStore.getState().nodes;
        this.nodesLite = nodes.map(n => ({ id: n.id, p: copyVec(n.p) }))
    }

    private rebuildSegments() {
        // Implement when segment store available
    }
}
