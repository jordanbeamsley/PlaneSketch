import type { FederatedPointerEvent } from "pixi.js";
import type { BaseTool } from "./baseTool";
import { LineTool } from "./shape/lineTool";
import { RectTool } from "./shape/rectTool";
import { CircleTool } from "./shape/circleTool";
import type { ShapeLayers } from "@/models/layers";
import type { SnapOverlay } from "../snap/overlay";
import type { SnapEngine } from "../snap/engine";
import { useToolStore } from "@/store/toolStore";
import type { Tool } from "@/models/tools";

export class ToolController {
    private current: BaseTool;
    private layers: ShapeLayers;
    private snapOverley: SnapOverlay;
    private snapEngine: SnapEngine;

    constructor(layers: ShapeLayers, snapOverlay: SnapOverlay, snapEngine: SnapEngine) {
        this.layers = layers;
        this.snapOverley = snapOverlay;
        this.snapEngine = snapEngine;

        this.current = new LineTool(layers, snapOverlay, snapEngine); // default
        useToolStore.subscribe(({ tool }) => this.setTool(tool));
        this.setTool(useToolStore.getState().tool);
    }

    private setTool(name: Tool) {
        switch (name) {
            case "line": this.current = new LineTool(this.layers, this.snapOverley, this.snapEngine); break;
            case "rect": this.current = new RectTool(this.layers, this.snapOverley, this.snapEngine); break;
            case "circle": this.current = new CircleTool(this.layers, this.snapOverley, this.snapEngine); break;
            default: break;
        }

        this.layers.preview.removeChildren().forEach((g) => g.destroy());
    }

    onDown(e: FederatedPointerEvent) { this.current.onDown(e); }
    onMove(e: FederatedPointerEvent) { this.current.onMove(e); }
    onUp(e: FederatedPointerEvent) { this.current.onUp(e); }
    onKeyDown(e: KeyboardEvent) { this.current.onKeyDown(e); }
}
