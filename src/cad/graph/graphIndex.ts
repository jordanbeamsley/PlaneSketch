import type { CircleId, NodeId, SegmentId } from "../models/sketch/ids";
import type { GeometryStore } from "../editor/stores/createGeometryStore";

/** 
 * Maintains incident edge lists for each node so tools and renderers can query topology 
 *
 * */
export class GraphIndex {
    /** Geometry data */
    private geometry: GeometryStore;

    /** Map of segments incident on each node */
    private incSegs = new Map<NodeId, Set<SegmentId>>();
    /** Map of circles incident on each node */
    private incCircs = new Map<NodeId, Set<CircleId>>();
    /** Unsub callbacks to call on unmount */
    private subs: Array<() => void> = [];

    constructor(geometry: GeometryStore) {
        this.geometry = geometry;
        this.rebuildAll();

        this.subs.push(
            geometry.subscribe(
                (state) => state.segments,
                (state, prevState) => {
                    // Removals
                    for (const [sid, prevSeg] of prevState) {
                        if (!state.has(sid)) {
                            this.removeEntityRef<SegmentId>(this.incSegs, sid, prevSeg.p1);
                            this.removeEntityRef<SegmentId>(this.incSegs, sid, prevSeg.p2);
                        }
                    }
                    // Additions and end point changes
                    for (const [sid, currSeg] of state) {
                        const prevSeg = prevState.get(sid);
                        if (!prevSeg) {
                            this.addEntityRef<SegmentId>(this.incSegs, sid, currSeg.p1);
                            this.addEntityRef<SegmentId>(this.incSegs, sid, currSeg.p2);
                        } else {
                            if (prevSeg.p1 !== currSeg.p1) {
                                this.removeEntityRef<SegmentId>(this.incSegs, sid, prevSeg.p1);
                                this.addEntityRef<SegmentId>(this.incSegs, sid, currSeg.p1);
                            }
                            if (prevSeg.p2 !== currSeg.p2) {
                                this.removeEntityRef<SegmentId>(this.incSegs, sid, prevSeg.p2);
                                this.addEntityRef<SegmentId>(this.incSegs, sid, currSeg.p2);
                            }
                        }
                    }
                }
            )
        );
    }

    dispose() {
        this.subs.forEach(u => u());
        this.subs = [];
        this.incSegs.clear();
        this.incCircs.clear();
    }

    /** Get count of incident segments on node */
    getSegDegree(nid: NodeId): number {
        return this.incSegs.get(nid)?.size ?? 0;
    }

    /** Get readonly view of incident segments on node */
    getIncidentSegments(nid: NodeId): ReadonlySet<SegmentId> {
        return this.incSegs.get(nid) ?? new Set();
    }

    /** Get readonly view of incident circles on node */
    getIncidentCircles(nid: CircleId): ReadonlySet<CircleId> {
        return this.incCircs.get(nid) ?? new Set();
    }

    /** Get readonly view of all incident entities */
    getAllIncidents(nid: NodeId) {
        return {
            incSids: this.getIncidentSegments(nid),
            incCids: this.getIncidentCircles(nid)
        }
    }

    private rebuildAll() {
        this.incSegs.clear();
        this.incCircs.clear();
        for (const [sid, seg] of this.geometry.getState().segments) {
            this.addEntityRef<SegmentId>(this.incSegs, sid, seg.p1);
            this.addEntityRef<SegmentId>(this.incSegs, sid, seg.p2);
        }
        for (const [cid, circle] of this.geometry.getState().circles) {
            this.addEntityRef<CircleId>(this.incCircs, cid, circle.centre);
        }
    }

    private addEntityRef<E>(incMap: Map<NodeId, Set<E>>, entityId: E, nid: NodeId) {
        // Get a reference to the entity set (incident entities of type E) already existing on node
        let set = incMap.get(nid);
        // If no incident entities exist, create new set
        if (!set) { set = new Set(); incMap.set(nid, set); }
        // Add the new entity to the set
        set.add(entityId);
    }

    private removeEntityRef<E>(incMap: Map<NodeId, Set<E>>, entityId: E, nid: NodeId) {
        // Get a reference to the entity set (incident entities<E>) for the node
        const set = incMap.get(nid);
        // If no set returned, then nothing to delete
        if (!set) return;
        // Otherwise delete the segment from the set
        set.delete(entityId);
        // Finally, if no incident entities<E> left on node, delete it
        if (set.size === 0) incMap.delete(nid);
    }
}
