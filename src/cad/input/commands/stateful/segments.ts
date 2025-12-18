import type { NodeId, SegmentId } from "@/cad/models/sketch/ids";
import type { CommandContext, StatefulCommand } from "../types";
import type { Node } from "@/cad/models/sketch/primitives";

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

    do(ctx: CommandContext) {
        const geometryStore = ctx.geometry.getGeometry();

        this.createdNodeA = this.a.id;
        if (!geometryStore.getState().nodes.has(this.createdNodeA))
            geometryStore.getState().addNode({ id: this.createdNodeA, p: this.a.p })

        this.createdNodeB = this.b.id;
        if (!geometryStore.getState().nodes.has(this.createdNodeB))
            geometryStore.getState().addNode({ id: this.createdNodeB, p: this.b.p });

        const segId = this.sid();
        this.createdSeg = segId;
        geometryStore.getState().addSegment({ id: segId, p1: this.createdNodeA, p2: this.createdNodeB });
    }

    undo(ctx: CommandContext) {
        const index = ctx.graph.getGraph();
        const geometry = ctx.geometry.getGeometry().getState();

        // Don't delete node if it is used by other geometry
        if (this.createdNodeA && index.getSegDegree(this.createdNodeA) < 2)
            geometry.removeNode(this.createdNodeA);

        if (this.createdNodeB && index.getSegDegree(this.createdNodeB) < 2)
            geometry.removeNode(this.createdNodeB);

        if (this.createdSeg)
            geometry.removeSegment(this.createdSeg);
    }
}
