import type { CircleId, NodeId, SegmentId } from "@/models/geometry";
import type { GraphIndex } from "./graphIndex";
import { useSegmentStore } from "@/store/segmentStore";
import { useNodeStore } from "@/store/nodeStore";
import { useCircleStore } from "@/store/circleStore";

export function deleteNodesAndIncidents(graph: GraphIndex, nids: NodeId[]) {
    const sids = new Set<SegmentId>();
    const cids = new Set<CircleId>();

    for (const nid of nids) {
        const { incSids, incCids } = graph.getAllIncidents(nid);
        for (const incSid of incSids) sids.add(incSid);
        for (const incCid of incCids) cids.add(incCid);
    }

    if (sids.size) useSegmentStore.getState().removeMany([...sids]);
    if (cids.size) useCircleStore.getState().removeMany([...cids]);

    if (nids.length) useNodeStore.getState().removeMany(nids);
}
