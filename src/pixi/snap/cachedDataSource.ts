import { useNodeStore } from "@/store/nodeStore";
import type { CircleLite, NodeLite, SegmentLite, SnapDataSource } from "./types";
import { useSegmentStore } from "@/store/segmentStore";
import { copyVec } from "@/models/vectors";
import { useCircleStore } from "@/store/circleStore";

export class CachedDataSource implements SnapDataSource {
    private nodesLite: NodeLite[] = [];
    private segmentLite: SegmentLite[] = [];
    private circleLite: CircleLite[] = [];
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

        this.unsubs.push(
            useCircleStore.subscribe(
                (state) => state.byId,
                () => {
                    this.rebuildCircles();
                }
            )
        )
    }

    unmount() {
        this.unsubs.forEach(u => u());
        this.nodesLite = [];
        this.segmentLite = [];
        this.circleLite = [];
        this.unsubs = [];
    }

    *getNodes(): Iterable<NodeLite> {
        for (const n of this.nodesLite) yield n;
    }

    *getSegments(): Iterable<SegmentLite> {
        for (const s of this.segmentLite) yield s;
    }

    *getCircles(): Iterable<CircleLite> {
        for (const c of this.circleLite) yield c;
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

    private rebuildCircles() {
        const circles = useCircleStore.getState().byId;
        const nodes = useNodeStore.getState().byId;

        const out: CircleLite[] = [];
        for (const c of circles.values()) {
            const center = nodes.get(c.center);

            // Should never happen, but handle edge case of dangling entity
            if (!center) continue;
            out.push({
                id: c.id,
                centre: copyVec(center.p),
                rad: c.radius
            })
        }

        this.circleLite = out;
    }
}
