import type { NodeId, SegmentId } from "@/models/geometry";
import { useSegmentStore } from "@/store/segmentStore";

/** Maintain incident edge lists for each node so tools and renderers can query topology */
export class GraphIndex {
    /** Map of segments incident on each node */
    private incSegs = new Map<NodeId, Set<SegmentId>>();
    /** Unsub callbacks to call on unmount */
    private unsubs: Array<() => void> = [];

    mount() {
        this.rebuildAll();
        this.unsubs.push(
            useSegmentStore.subscribe(
                (state) => state.byId,
                (state, prevState) => {
                    // Removals
                    for (const [sid, prevSeg] of prevState) {
                        if (!state.has(sid)) {
                            this.removeSegRef(sid, prevSeg.p1);
                            this.removeSegRef(sid, prevSeg.p2);
                        }
                    }
                    // Additions and end point changes
                    for (const [sid, currSeg] of state) {
                        const prevSeg = prevState.get(sid);
                        if (!prevSeg) {
                            this.addSegRef(sid, currSeg.p1);
                            this.addSegRef(sid, currSeg.p2);
                        } else {
                            if (prevSeg.p1 !== currSeg.p1) { this.removeSegRef(sid, prevSeg.p1); this.addSegRef(sid, currSeg.p1); }
                            if (prevSeg.p2 !== currSeg.p2) { this.removeSegRef(sid, prevSeg.p2); this.addSegRef(sid, currSeg.p2); }
                        }
                    }
                }
            )
        )
    }

    unmount() {
        this.unsubs.forEach(u => u());
        this.unsubs = [];
        this.incSegs.clear();
    }

    /** Get count of incident segments on node */
    getDegree(nid: NodeId): number {
        return this.incSegs.get(nid)?.size ?? 0;
    }

    /** Get readonly view of incident segments on node */
    getIncidentSegments(nid: NodeId): ReadonlySet<SegmentId> {
        return this.incSegs.get(nid) ?? new Set();
    }

    private rebuildAll() {
        this.incSegs.clear();
        const segs = useSegmentStore.getState().byId;
        for (const [sid, seg] of segs) {
            this.addSegRef(sid, seg.p1);
            this.addSegRef(sid, seg.p2);
        }
    }

    private addSegRef(sid: SegmentId, nid: NodeId) {
        // Get a reference to segment set (incident segments) already existing on node
        let set = this.incSegs.get(nid);
        // If no incident segments exist, create new set
        if (!set) { set = new Set(); this.incSegs.set(nid, set); }
        // Add the new segment to the set
        set.add(sid);
    }

    private removeSegRef(sid: SegmentId, nid: NodeId) {
        // Get a reference to segment set (incident segments) for the node
        const set = this.incSegs.get(nid);
        // If no set returned, then nothing to delete
        if (!set) return;
        // Otherwise delete the segment from the set
        set.delete(sid);
        // Finally, if no incident segments left on node, delete it from global incident map 
        if (set.size === 0) this.incSegs.delete(nid);
    }
}
