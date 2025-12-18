import type { BaseTool, PointerPayload, ToolContext } from "./baseTool";
import { LineTool } from "./shape/lineTool";
import { RectTool } from "./shape/rectTool";
import { CircleTool } from "./shape/circleTool";
import { SelectTool } from "./selectTool";
import type { Container } from "pixi.js";
import type { CommandContext } from "../input/commands/types";
import type { CommandId } from "../input/commands/defaultCommands";
import { useToolStore } from "@/shared/store/toolStore";
import type { GeometryLayers } from "../models/canvas/stage";
import type { Tool } from "../models/tools/tools";

export class ToolController {
    private layers: GeometryLayers;
    private context: ToolContext;
    private selectLayer: Container;

    private current: BaseTool;

    constructor(context: ToolContext, layers: GeometryLayers, select: Container) {
        this.layers = layers;
        this.context = context;
        this.selectLayer = select;

        this.current = new LineTool(this.context, this.layers); // default
        useToolStore.subscribe(({ tool }) => this.setTool(tool));
        this.setTool(useToolStore.getState().tool);
    }

    private setTool(name: Tool) {
        this.current.destruct();
        this.layers.preview.removeChildren().forEach(g => g.destroy());
        this.context.snapOverlay.hideOverlay();

        switch (name) {
            case "line": this.current = new LineTool(this.context, this.layers); break;
            case "rectangle": this.current = new RectTool(this.context, this.layers); break;
            case "circle": this.current = new CircleTool(this.context, this.layers); break;
            case "select": this.current = new SelectTool(this.context, this.selectLayer); break;
            default: break;
        }
        this.current.activate();
    }

    getActive() { return this.current.getId(); }
    isInOperation() { return this.current.getOperationState }

    executeCommand(cmd: CommandId, ctx: CommandContext): boolean {
        const [category, command, specific] = cmd.split(".");
        if (category === "tool" && command === "change") {
            useToolStore.getState().setTool(specific as Tool);
            return true;
        }
        return this.current.executeCommand(cmd, ctx);
    }

    onDown(e: PointerPayload) { this.current.onDown(e); }
    onMove(e: PointerPayload) { this.current.onMove(e); }
    onUp(e: PointerPayload) { this.current.onUp(e); }
}
