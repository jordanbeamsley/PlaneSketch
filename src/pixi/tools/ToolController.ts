import type { FederatedPointerEvent } from "pixi.js";
import type { BaseTool, ToolContext } from "./baseTool";
import { LineTool } from "./shape/lineTool";
import { useToolStore } from "@/store/toolStore";
import type { Tool } from "@/models/tools";
import type { GeometryLayers } from "@/models/stage";
import { RectTool } from "./shape/rectTool";

export class ToolController {
    private current: BaseTool;
    private layers: GeometryLayers;
    private context: ToolContext;

    constructor(context: ToolContext, layers: GeometryLayers) {
        this.layers = layers;
        this.context = context;

        this.current = new LineTool(this.context, this.layers); // default
        useToolStore.subscribe(({ tool }) => this.setTool(tool));
        this.setTool(useToolStore.getState().tool);
    }

    private setTool(name: Tool) {
        this.current.destruct();

        switch (name) {
            case "line": this.current = new LineTool(this.context, this.layers); break;
            case "rect": this.current = new RectTool(this.context, this.layers); break;
            // case "circle": this.current = new CircleTool(this.context, this.layers); break;
            default: break;
        }
    }

    onDown(e: FederatedPointerEvent) { this.current.onDown(e); }
    onMove(e: FederatedPointerEvent) { this.current.onMove(e); }
    onKeyDown(e: KeyboardEvent) { this.current.onKeyDown(e); }
}
