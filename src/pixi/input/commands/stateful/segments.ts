import { useNodeStore } from "@/store/nodeStore";
import type { CommandContext, StatefulCommand } from "../types";
import { useSegmentStore } from "@/store/segmentStore";
import type { Node, NodeId, SegmentId } from "@/models/geometry";

export type cmdNode = { x: number, y: number, nid?: string }

export class AddSegmentCommand implements StatefulCommand {
    label = "Add segment";

    readonly a: Node;
    readonly b: Node;

    private createdNodeA?: NodeId;
    private createdNodeB?: NodeId;
    private createdSeg?: SegmentId;

    sid = () => crypto.randomUUID();

    constructor(a: Node, b: Node) {
        this.a = a;
        this.b = b;
    }

    do(_ctx: CommandContext) {
        const nodeStore = useNodeStore.getState();
        const segsStore = useSegmentStore.getState();

        this.createdNodeA = this.a.id;
        if (!nodeStore.byId.has(this.createdNodeA))
            nodeStore.add({ id: this.createdNodeA, p: this.a.p });

        this.createdNodeB = this.b.id;
        if (!nodeStore.byId.has(this.createdNodeB))
            nodeStore.add({ id: this.createdNodeB, p: this.b.p });

        const segId = this.sid();
        this.createdSeg = segId;
        segsStore.add({ id: segId, p1: this.createdNodeA, p2: this.createdNodeB });
    }

    undo(ctx: CommandContext) {
        const index = ctx.graph.index;
        const nodeStore = useNodeStore.getState();

        // Don't delete node if it is used by other geometry
        if (this.createdNodeA && index.getSegDegree(this.createdNodeA) < 2)
            nodeStore.remove(this.createdNodeA);

        if (this.createdNodeB && index.getSegDegree(this.createdNodeB) < 2)
            nodeStore.remove(this.createdNodeB);

        if (this.createdSeg)
            useSegmentStore.getState().remove(this.createdSeg);
    }
}
