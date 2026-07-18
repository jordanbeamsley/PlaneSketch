import { type ConstraintKind, evaluateConstraintGeom } from "@/cad/models/sketch/constraints";
import { BaseTool, type PointerPayload, type ToolContext } from "../baseTool";
import { PickBehaviour } from "../pickBehaviour";
import type { Container } from "pixi.js";
import type { Tool } from "@/cad/models/tools/tools";
import type { EntityRef } from "@/cad/models/sketch/entityRef";
import { AddConstraintsCommand } from "@/cad/input/commands/stateful/constraints/constraints";
import type { SnapOutcome } from "@/cad/snap/snapService";
import type { Modifiers } from "@/cad/input/pointer/types";

export class ConstraintTool extends BaseTool {
    private pick: PickBehaviour;
    private kind: ConstraintKind;

    constructor(context: ToolContext, selectLayer: Container, kind: ConstraintKind) {
        super(context);
        this.kind = kind;
        this.pick = new PickBehaviour(context, selectLayer, {
            clearOnEmptyClick: false,
            canSelect: (e) => this.canSelect(e),
        });
    }

    getId(): Tool { return "constraint"; }

    activate(): void { this.tryApply(); }

    onDown(s: SnapOutcome, m: Modifiers): void { this.pick.onDown(s, m); }
    onMove(e: PointerPayload): void { this.pick.onMove(e); }
    onUp(e: PointerPayload): void { this.pick.onUp(e); this.tryApply(); }

    destruct(): void { this.pick.dispose(); }

    private canSelect(candidate: EntityRef): boolean {
        const counts = this.getSelect().getState().getCountByKind();
        counts[candidate.kind]++;
        return evaluateConstraintGeom(counts, this.kind) !== "excluded";
    }

    private tryApply(): void {
        const cmd = new AddConstraintsCommand(this.kind);
        if (this.getHistory().execute(cmd)) {
            this.pick.clear();
        }
    }
}
