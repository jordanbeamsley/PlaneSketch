import type { BaseTool, PointerPayload, ToolContext } from "./baseTool";
import { LineTool } from "./shape/lineTool";
import { RectTool } from "./shape/rectTool";
import { CircleTool } from "./shape/circleTool";
import { SelectTool } from "./select/selectTool";
import { ConstraintTool } from "./constraint/constraintTool";
import type { Container } from "pixi.js";
import type { CommandContext } from "../input/commands/types";
import type { CommandId } from "../input/commands/defaultCommands";
import type { GeometryLayers } from "../models/canvas/stage";
import type { Tool } from "../models/tools/tools";
import type { ConstraintKind } from "../models/sketch/constraints";
import { shallow } from "zustand/shallow";
import { useToolStore } from "@/shared/store/toolStore";
import type { SnapOutcome } from "../snap/snapService";
import type { Modifiers } from "../input/pointer/types";

export class ToolController {
    private layers: GeometryLayers;
    private context: ToolContext;
    private selectLayer: Container;

    private current: BaseTool;
    private sub: () => void;

    constructor(context: ToolContext, layers: GeometryLayers, select: Container) {
        this.layers = layers;
        this.context = context;
        this.selectLayer = select;

        this.current = new LineTool(this.context, this.layers); // default
        this.syncSnapContext();
        this.sub = useToolStore.subscribe(
            (s) => ({ tool: s.tool, kind: s.activeConstraintKind }),
            ({ tool, kind }) => this.setTool(tool, kind),
            { equalityFn: shallow }
        );
    }

    private setTool(name: Tool, kind: ConstraintKind | null = null) {
        this.current.destruct();
        this.layers.preview.removeChildren().forEach(g => g.destroy());
        this.context.hideOverlay();

        switch (name) {
            case "line": this.current = new LineTool(this.context, this.layers); break;
            case "rectangle": this.current = new RectTool(this.context, this.layers); break;
            case "circle": this.current = new CircleTool(this.context, this.layers); break;
            case "select": this.current = new SelectTool(this.context, this.selectLayer); break;
            case "constraint":
                if (kind) this.current = new ConstraintTool(this.context, this.selectLayer, kind);
                break;
            default: break;
        }
        this.current.activate();
        this.syncSnapContext();
    }

    /** Hand SnapService the active tools context resolver (if it has one), bound to that tool instance */
    private syncSnapContext() {
        this.context.setSnapContextResolver(this.current.getSnapContext?.bind(this.current));
    }

    getActive() { return this.current.getId(); }
    isInOperation() { return this.current.getOperationState }

    executeCommand(cmd: CommandId, ctx: CommandContext): boolean {
        return this.current.executeCommand(cmd, ctx);
    }

    onDown(s: SnapOutcome, m: Modifiers) { this.current.onDown(s, m); }
    onMove(e: PointerPayload) { this.current.onMove(e); }
    onUp(e: PointerPayload) { this.current.onUp(e); }

    destroy() {
        this.sub();
        this.current.destruct();
        this.context.setSnapContextResolver(undefined);
    }
}
