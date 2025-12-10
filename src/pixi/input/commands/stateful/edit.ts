import { useSelectStore } from "@/store/selectStore";
import type { CommandContext, StatefulCommand } from "../types";
import type { Segment, Node, Circle, CircleId, SegmentId } from "@/models/geometry";
import { useNodeStore } from "@/store/nodeStore";
import { useSegmentStore } from "@/store/segmentStore";
import { useCircleStore } from "@/store/circleStore";

export class DeleteCommand implements StatefulCommand {

    private deletedNodes: Node[] = [];
    private deletedSegments: Segment[] = [];
    private deletedCircles: Circle[] = [];

    do(ctx: CommandContext) {
        const nodeStore = useNodeStore.getState();
        const circleStore = useCircleStore.getState();
        const segmentStore = useSegmentStore.getState();

        const selected = useSelectStore.getState().getByKind();

        const nids = selected.nodes;
        const sids = new Set<SegmentId>();
        const cids = new Set<CircleId>();

        for (const nid of nids) {
            const node = nodeStore.byId.get(nid);
            if (node) this.deletedNodes.push(node);

            const { incSids, incCids } = ctx.graph.index.getAllIncidents(nid);
            for (const incSid of incSids) sids.add(incSid);
            for (const incCid of incCids) cids.add(incCid);
        }

        for (const sid of selected.segments) sids.add(sid);
        for (const cid of selected.circles) cids.add(cid);

        for (const sid of sids) {
            const segment = segmentStore.byId.get(sid);
            if (segment) this.deletedSegments.push(segment);
        }

        for (const cid of cids) {
            const circle = circleStore.byId.get(cid);
            if (circle) this.deletedCircles.push(circle);
        }

        if (sids.size) segmentStore.removeMany([...sids]);
        if (cids.size) circleStore.removeMany([...cids]);
        if (nids.length) nodeStore.removeMany(nids);
    }

    undo(_ctx: CommandContext) {
        useNodeStore.getState().addMany(this.deletedNodes);
        useSegmentStore.getState().addMany(this.deletedSegments);
        useCircleStore.getState().addMany(this.deletedCircles);
    }
}
