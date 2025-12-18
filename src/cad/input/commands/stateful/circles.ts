import type { CircleId, NodeId } from "@/cad/models/sketch/ids";
import type { CommandContext, StatefulCommand } from "../types";
import type { Node } from "@/cad/models/sketch/primitives";

export type cmdNode = { x: number, y: number, nid?: string }

export class AddCentreRadiusCircleCommand implements StatefulCommand {
    label = "Add c-d circle";

    readonly centre: Node;
    readonly radius: number;

    private createdNodeCentre?: NodeId;
    private createdCircle?: CircleId;

    cid = () => crypto.randomUUID();

    constructor(centre: Node, radius: number) {
        this.centre = centre;
        this.radius = radius;
    }

    do(ctx: CommandContext) {
        const geometry = ctx.geometry.getGeometry().getState();

        this.createdNodeCentre = this.centre.id;
        if (!geometry.nodes.has(this.createdNodeCentre))
            geometry.addNode({ id: this.createdNodeCentre, p: this.centre.p });

        const circleId = this.cid();
        this.createdCircle = circleId;
        geometry.addCircle({ id: circleId, centre: this.createdNodeCentre, radius: this.radius });
    }

    undo(ctx: CommandContext) {
        const graph = ctx.graph.getGraph();
        const geometry = ctx.geometry.getGeometry().getState();

        // Don't delete node if it is used by other geometry
        if (this.createdNodeCentre && graph.getSegDegree(this.createdNodeCentre) < 2)
            geometry.removeNode(this.createdNodeCentre);

        if (this.createdCircle)
            geometry.removeCircle(this.createdCircle);
    }
}
