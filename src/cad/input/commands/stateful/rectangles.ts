import type { NodeId, SegmentId } from "@/cad/models/sketch/ids";
import type { CommandContext, StatefulCommand } from "../types";
import type { Node } from "@/cad/models/sketch/primitives";

export type cmdNode = { x: number, y: number, nid?: string }

export class AddRectangleCommand implements StatefulCommand {
    label = "Add rectangle";

    /*
     *  node 0 ------- seg 0 --------- node 1
     *    |                              |
     *    |                              |
     *  seg 3                          seg 1
     *    |                              |
     *    |                              |
     *  node 3 ------- seg 2 --------- node 2
     *
     *  node 0 = anchorA
     *  node 2 = anchorB
     *
     *  Created entities are stored in array at indexes for history tracking
     */

    readonly anchorA: Node;
    readonly anchorB: Node;

    private createdNodes: NodeId[] = Array(4).fill("");
    private createSegs: SegmentId[] = Array(4).fill("");

    sid = () => crypto.randomUUID();
    nid = () => crypto.randomUUID();

    constructor(a: Node, b: Node) {
        this.anchorA = a;
        this.anchorB = b;
    }

    do(ctx: CommandContext) {
        const geometryStore = ctx.geometry.getGeometry();

        // Anchors may be existing nodes, check if they exist and create if not
        this.createdNodes[0] = this.anchorA.id;
        if (!geometryStore.getState().nodes.has(this.anchorA.id))
            geometryStore.getState().addNode({ id: this.anchorA.id, p: this.anchorA.p })

        this.createdNodes[2] = this.anchorB.id;
        if (!geometryStore.getState().nodes.has(this.anchorB.id))
            geometryStore.getState().addNode({ id: this.anchorB.id, p: this.anchorB.p })

        // Intermediate nodes always need to be created
        this.createdNodes[1] = this.nid();
        geometryStore.getState().addNode({ id: this.createdNodes[1], p: {x: this.anchorB.p.x, y: this.anchorA.p.y} });

        this.createdNodes[3] = this.nid();
        geometryStore.getState().addNode({ id: this.createdNodes[3], p: {x: this.anchorA.p.x, y: this.anchorB.p.y} });

        // Create segments between nodes
        this.createSegs.forEach((_, i) => {
            const segId = this.sid();
            this.createSegs[i] = segId;
            geometryStore.getState().addSegment({id: segId, p1: this.createdNodes[i], p2: this.createdNodes[(i + 1) % this.createdNodes.length]});

        })
    }

    undo(ctx: CommandContext) {
        const index = ctx.graph.getGraph();
        const geometry = ctx.geometry.getGeometry().getState();

        // Don't delete node if it is used by other geometry
        this.createdNodes.forEach((n) => {
            if (index.getSegDegree(n) < 2) geometry.removeNode(n);
        });

        this.createSegs.forEach((s) => {
            geometry.removeSegment(s);
        })

    }
}
