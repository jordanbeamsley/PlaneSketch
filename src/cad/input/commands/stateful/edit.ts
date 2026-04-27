import type { Circle, Node, Segment } from "@/cad/models/sketch/primitives";
import type { CommandContext, StatefulCommand } from "../types";

export class DeleteCommand implements StatefulCommand {

    private deletedNodes: Node[] = [];
    private deletedSegments: Segment[] = [];
    private deletedCircles: Circle[] = [];

    do(ctx: CommandContext) {
        const geometry = ctx.geometry.getGeometry().getState();

        const selected = ctx.selection.getSelection().getState().getByKind();

        const nids = selected["node"];
        const sids = selected["segment"];
        const cids = selected["circle"];

        for (const nid of nids) {
            const node = geometry.nodes.get(nid);
            if (node) this.deletedNodes.push(node);

            const { incSids, incCids } = ctx.graph.getGraph().getAllIncidents(nid);
            for (const incSid of incSids) sids.add(incSid);
            for (const incCid of incCids) cids.add(incCid);
        }

        for (const sid of sids) {
            const segment = geometry.segments.get(sid);
            if (segment) this.deletedSegments.push(segment);
        }

        for (const cid of cids) {
            const circle = geometry.circles.get(cid);
            if (circle) this.deletedCircles.push(circle);
        }

        geometry.removeMany(nids, sids, cids);
    }

    undo(ctx: CommandContext) {
        ctx.geometry.getGeometry().getState().addMany({
            id: "",
            nodes: this.deletedNodes,
            segments: this.deletedSegments,
            circles: this.deletedCircles,
            arcs: [], // Implememt
            blockInstances: [], // Implement
            constraints: [] // Implement

        });
    }
}
