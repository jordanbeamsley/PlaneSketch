import type { Container } from "pixi.js";
import { BaseTool, type PointerPayload, type ToolContext } from "../baseTool";
import type { Tool } from "@/cad/models/tools/tools";
import { PickBehaviour } from "../pickBehaviour";
import type { SnapContextBase, SnapContextOverride, SnapOutcome } from "@/cad/snap/snapService";
import type { Modifiers } from "@/cad/input/pointer/types";
import type { SnapKind } from "@/cad/snap/types";
import type { Vec2 } from "@/cad/models/sketch/vectors";
import type { EntityRef } from "@/cad/models/sketch/entityRef";
import { MoveBehaviour } from "../moveBehaviour";

export class SelectTool extends BaseTool {
    private pick: PickBehaviour;
    private move: MoveBehaviour;
    private context: ToolContext;

    private active: PickBehaviour | MoveBehaviour | null = null;

    constructor(context: ToolContext, selectLayer: Container) {
        super(context);

        this.context = context;

        this.pick = new PickBehaviour(context, selectLayer, {
            clearOnEmptyClick: true,
        });

        this.move = new MoveBehaviour(context);
    }

    getId(): Tool {
        return "select";
    }

    activate(): void {}

    onDown(s: SnapOutcome, m: Modifiers): void {
        const entity = s.primary?.ref;
        const onSelected =
            entity && this.context.getSelect().getState().isSelected(entity);

        this.active = onSelected ? this.move : this.pick;
        this.active.onDown(s, m);
    }
    onMove(e: PointerPayload): void {
        this.active?.onMove(e);
    }
    onUp(e: PointerPayload): void {
        this.active?.onUp(e);
        this.active = null;
    }

    // While dragging, exclude the entities being moved so they can't snap to their own live position
    getSnapContext(base: SnapContextBase, p: Vec2): SnapContextOverride {
        let exclude: EntityRef[] | undefined;
        let enable: Partial<Record<SnapKind, boolean>>;

        if (this.active?.behaviour === "move") {
            exclude = this.move.excluded;
            enable = { ...base.opts.enable };
        } else {
            exclude = undefined;
            enable = {
                ...base.opts.enable,
                grid: false,
                axisH: false,
                axisV: false,
                origin: false,
            };
        }

        return {
            ...base,
            p,
            exclude: exclude,
            opts: {
                ...base.opts,
                enable: enable,
            },
        };
    }

    destruct(): void {
        this.pick.dispose();
    }
}
