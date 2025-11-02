import type { BaseTool, PointerPayload, ToolContext } from "./baseTool";
import { LineTool } from "./shape/lineTool";
import { useToolStore } from "@/store/toolStore";
import type { Tool } from "@/models/tools";
import type { GeometryLayers } from "@/models/stage";
import { RectTool } from "./shape/rectTool";
import { CircleTool } from "./shape/circleTool";
import { SelectTool } from "./selectTool";
import type { Container } from "pixi.js";
import type { GraphIndex } from "../graph/graphIndex";

export class ToolController {
    private layers: GeometryLayers;
    private context: ToolContext;
    private selectLayer: Container;
    private graph: GraphIndex;

    private current: BaseTool;

    constructor(context: ToolContext, layers: GeometryLayers, select: Container, graph: GraphIndex) {
        this.layers = layers;
        this.context = context;
        this.selectLayer = select;
        this.graph = graph;

        this.current = new LineTool(this.context, this.layers); // default
        useToolStore.subscribe(({ tool }) => this.setTool(tool));
        this.setTool(useToolStore.getState().tool);
    }

    private setTool(name: Tool) {
        this.current.destruct();
        this.layers.preview.removeChildren().forEach(g => g.destroy());

        switch (name) {
            case "line": this.current = new LineTool(this.context, this.layers); break;
            case "rect": this.current = new RectTool(this.context, this.layers); break;
            case "circle": this.current = new CircleTool(this.context, this.layers); break;
            case "select": this.current = new SelectTool(this.context, this.selectLayer, this.graph); break;
            default: break;
        }
        this.current.activate();
    }

    onDown(e: PointerPayload) { this.current.onDown(e); }
    onMove(e: PointerPayload) { this.current.onMove(e); }
    onUp(e: PointerPayload) { this.current.onUp(e); }
    onKeyDown(e: KeyboardEvent) { this.current.onKeyDown(e); }
}
