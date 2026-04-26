
// Handlers transform the selection into the actual constraint types for each kind
// E.g HorizontalHandler will determine if it builds a horizontal_line or horizontal_pp constraint

import { evaluateConstraintGeom, type ConstraintKind, type SketchConstraint } from "@/cad/models/sketch/constraints";
import type { ConstraintHandler } from "./types";
import { CoincidentHandler, HorizontalHandler, VerticalHandler } from "./handlers";
import type { CommandContext, StatefulCommand } from "../../types";
import type { NodeId } from "@/cad/models/sketch/ids";
import type { Node } from "@/cad/models/sketch/primitives";

// handlers return array of all constraints to be applied in the GCS
const HANDLERS: Record<ConstraintKind, ConstraintHandler> = {
    horizontal: new HorizontalHandler(),
    vertical: new VerticalHandler(),
    coincident: new CoincidentHandler(),
};


export class AddConstraintsCommand implements StatefulCommand {
    label = "Add constraint"
    readonly kind: ConstraintKind;

    /** Constraints that were applied */
    private built: SketchConstraint[] = [];

    /** Snapshot of the sketch nodes before constraints were applied */
    private snapshotBefore = new Map<NodeId, Node>();

    cid = () => crypto.randomUUID();

    constructor(constraint: ConstraintKind) {
        this.kind = constraint;
    }

    canExecute(ctx: CommandContext): boolean {
        const selected = ctx.selection.getSelection().getState().getCountByKind();
        return evaluateConstraintGeom(selected, this.kind) === "complete";
    }

    do(ctx: CommandContext) {
        // Snapshot nodes before any solving
        this.snapshotBefore = ctx.geometry.getGeometry().getState().nodes

        const selection = ctx.selection.getSelection().getState().getByKind();
        this.built = HANDLERS[this.kind].build(selection) ?? [];
        ctx.constraint.getConstraints().getState().addMany(this.built);
    }

    undo(ctx: CommandContext) {
        // Restore geometry first so the engine re-solves from the right starting position
        const geomState = ctx.geometry.getGeometry().getState();
        geomState.updateNodePositions(this.snapshotBefore);

        this.built.forEach(c => ctx.constraint.getConstraints().getState().remove(c.id));
    }
}
