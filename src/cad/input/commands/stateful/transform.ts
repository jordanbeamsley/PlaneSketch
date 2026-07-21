import type { NodeId } from "@/cad/models/sketch/ids";
import type { CommandContext, StatefulCommand } from "../types";
import type { Vec2 } from "@/cad/models/sketch/vectors";

export class MoveNodesCommand implements StatefulCommand {
    label = "Move nodes";

    private before: Map<NodeId, Vec2>;
    private after: Map<NodeId, Vec2>;

    constructor(before: Map<NodeId, Vec2>, after: Map<NodeId, Vec2>) {
        this.before = before;
        this.after = after;
    }

    do(ctx: CommandContext) {
        ctx.geometry.getGeometry().getState().updateNodePositions(this.after);
    }

    undo(ctx: CommandContext) {
        ctx.geometry.getGeometry().getState().updateNodePositions(this.before);
    }
}
