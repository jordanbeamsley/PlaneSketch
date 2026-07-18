import type { Container } from "pixi.js";
import { BaseTool, type PointerPayload, type ToolContext } from "../baseTool";
import type { Tool } from "@/cad/models/tools/tools";
import { PickBehaviour } from "../pickBehaviour";
import type { SnapOutcome } from "@/cad/snap/snapService";
import type { Modifiers } from "@/cad/input/pointer/types";
import type { SnapRuleContext } from "@/cad/snap/types";
import type { Vec2 } from "@/cad/models/sketch/vectors";

export class SelectTool extends BaseTool {
    private pick: PickBehaviour;

    constructor(context: ToolContext, selectLayer: Container) {
        super(context);
        this.pick = new PickBehaviour(context, selectLayer, {
            clearOnEmptyClick: true,
        });
    }

    getId(): Tool {
        return "select";
    }

    activate(): void {}

    onDown(s: SnapOutcome, m: Modifiers): void {
        this.pick.onDown(s, m);
    }
    onMove(e: PointerPayload): void {
        this.pick.onMove(e);
    }
    onUp(e: PointerPayload): void {
        this.pick.onUp(e);
    }

    // Picking entities to select doesn't need grid/axis snapping — only entity snaps matter
    getSnapContext(base: SnapRuleContext, p: Vec2): SnapRuleContext {
        return {
            ...base,
            p,
            opts: {
                ...base.opts,
                enable: {
                    ...base.opts.enable,
                    grid: false,
                    axisH: false,
                    axisV: false,
                    origin: false,
                },
            },
        };
    }

    destruct(): void {
        this.pick.dispose();
    }
}
