import { useNodeStore } from "@/store/nodeStore";
import type { CommandContext, StatefulCommand } from "../types";
import type { CircleId, Node, NodeId } from "@/models/geometry";
import { useCircleStore } from "@/store/circleStore";

export type cmdNode = { x: number, y: number, nid?: string }

export class AddCentreDiametreCircle implements StatefulCommand {
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

    do(_ctx: CommandContext) {
        const nodeStore = useNodeStore.getState();
        const circleStore = useCircleStore.getState();

        this.createdNodeCentre = this.centre.id;
        if (!nodeStore.byId.has(this.createdNodeCentre))
            nodeStore.add({ id: this.createdNodeCentre, p: this.centre.p });

        const circleId = this.cid();
        this.createdCircle = circleId;
        circleStore.add({ id: circleId, center: this.createdNodeCentre, radius: this.radius });
    }

    undo(ctx: CommandContext) {
        const index = ctx.graph.index;

        // Don't delete node if it is used by other geometry
        if (this.createdNodeCentre && index.getSegDegree(this.createdNodeCentre) < 2)
            useNodeStore.getState().remove(this.createdNodeCentre);

        if (this.createdCircle)
            useCircleStore.getState().remove(this.createdCircle);
    }
}
