import type { NodeId, SegmentId } from "@/models/geometry";
import type { GraphIndex } from "./graphIndex";
import { useSegmentStore } from "@/store/segmentStore";
import { useNodeStore } from "@/store/nodeStore";

export function deleteNodesAndIncidents(graph: GraphIndex, nids: NodeId[]) {
    const sids = new Set<SegmentId>();

    for (const nid of nids) {
        const incSids = graph.getIncidentSegments(nid);
        if (!incSids) return;
        for (const incSid of incSids) sids.add(incSid);
    }

    if (sids.size) useSegmentStore.getState().removeMany([...sids]);

    if (nids.length) useNodeStore.getState().removeMany(nids);
}
