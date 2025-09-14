import type { FederatedPointerEvent } from "pixi.js";
import type { BaseTool } from "./baseTool";
import { LineTool } from "./lineTool";
import { useToolStore } from "../../store/toolStore";
import type { Tool } from "../../models/tools";
import { RectTool } from "./rectTool";
import { CircleTool } from "./circleTool";
import type { SceneLayers } from "../../models/layers";

export class ToolController {
    private current: BaseTool;
    private layers: SceneLayers;

    constructor(layers: SceneLayers) {
        this.layers = layers;
        this.current = new LineTool(layers); // default
        useToolStore.subscribe(({ tool }) => this.setTool(tool));
        this.setTool(useToolStore.getState().tool);
    }

    private setTool(name: Tool) {
        switch (name) {
            case "line": this.current = new LineTool(this.layers); break;
            case "rect": this.current = new RectTool(this.layers); break;
            case "circle": this.current = new CircleTool(this.layers); break;
            default: break;
        }

        this.layers.preview.removeChildren().forEach((g) => g.destroy());
    }

    onDown(e: FederatedPointerEvent) { this.current.onDown(e); }
    onMove(e: FederatedPointerEvent) { this.current.onMove(e); }
    onUp(e: FederatedPointerEvent) { this.current.onUp(e); }
    onKeyDown(e: KeyboardEvent) { this.current.onKeyDown(e); }
}
