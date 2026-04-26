import type { CircleId, NodeId, SegmentId } from "../models/sketch/ids";
import type { GraphIndex } from "./graphIndex";

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
