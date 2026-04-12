import type { CommandId } from "@/cad/input/commands/defaultCommands";
import type { CommandContext } from "@/cad/input/commands/types";
import type { Container } from "pixi.js";
import { BaseTool, type PointerPayload, type ToolContext } from "../baseTool";
import type { Tool } from "@/cad/models/tools/tools";
import { PickBehaviour } from "../pickBehaviour";

export class SelectTool extends BaseTool {
    private pick: PickBehaviour;

    constructor(context: ToolContext, selectLayer: Container) {
        super(context);
        this.pick = new PickBehaviour(context, selectLayer, { clearOnEmptyClick: true });
    }

    getId(): Tool { return "select"; }

    activate(): void { }

    onDown(e: PointerPayload): void { this.pick.onDown(e) }
    onMove(e: PointerPayload): void { this.pick.onMove(e) }
    onUp(e: PointerPayload): void { this.pick.onUp(e) }

    executeCommand(_cmd: CommandId, _ctx: CommandContext): boolean { return false; }

    destruct(): void { this.pick.dispose(); }
}
