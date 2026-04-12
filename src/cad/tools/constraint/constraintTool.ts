import { type ConstraintKind, evaluateConstraintGeom } from "@/cad/models/sketch/constraints";
import type { ConstraintHandler } from "./types";
import { BaseTool, type PointerPayload, type ToolContext } from "../baseTool";
import { PickBehaviour } from "../pickBehaviour";
import type { Container } from "pixi.js";
import type { Tool } from "@/cad/models/tools/tools";
import type { CommandId } from "@/cad/input/commands/defaultCommands";
import type { CommandContext } from "@/cad/input/commands/types";
import type { EntityRef } from "@/cad/models/sketch/entityRef";
import { HorizontalHandler } from "./handlers/horizontalHandler";
import { VerticalHandler } from "./handlers/verticalHandler";
import { CoincidentHandler } from "./handlers/coincidentHandler";

// Handlers transform the selection into the actual constraint types for each kind
// E.g HorizontalHandler will determine if it builds a horizontal_line or horizontal_pp constraint
// handlers return array of all constraints to be applied in the GCS
const HANDLERS: Record<ConstraintKind, ConstraintHandler> = {
    horizontal: new HorizontalHandler(),
    // TODO: vertical, coincident
    vertical: new VerticalHandler(),   // placeholder
    coincident: new CoincidentHandler(), // placeholder
};

export class ConstraintTool extends BaseTool {
    private pick: PickBehaviour;
    private handler: ConstraintHandler;
    private kind: ConstraintKind;

    constructor(context: ToolContext, selectLayer: Container, kind: ConstraintKind) {
        super(context);
        this.kind = kind;
        this.handler = HANDLERS[kind];
        this.pick = new PickBehaviour(context, selectLayer, {
            clearOnEmptyClick: false,
            canSelect: (e) => this.canSelect(e),
        });
    }

    getId(): Tool { return "constraint"; }

    activate(): void { this.tryApply(); }

    onDown(e: PointerPayload): void { this.pick.onDown(e); }
    onMove(e: PointerPayload): void { this.pick.onMove(e); }
    onUp(e: PointerPayload): void { this.pick.onUp(e); this.tryApply(); }

    executeCommand(_cmd: CommandId, _ctx: CommandContext): boolean { return false; }

    destruct(): void { this.pick.dispose(); }

    private canSelect(candidate: EntityRef): boolean {
        const counts = this.getSelect().getState().getCountByKind();
        counts[candidate.kind]++;
        return evaluateConstraintGeom(counts, this.kind) !== "excluded";
    }

    private tryApply(): void {
        const selectionState = this.getSelect().getState();
        const selection = selectionState.getByKind();
        const counts = selectionState.getCountByKind();

        if (evaluateConstraintGeom(counts, this.kind) !== "complete") return;

        const constraints = this.handler.tryBuild(selection);
        if (!constraints) return;
        // TODO: dispatch AddConstraintCommand(constraints)
    }
}
