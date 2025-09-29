import { Graphics } from "pixi.js";
import { compareVec, type Vec2 } from "@/models/vectors";
import { NODE_COLOR, NODE_RADIUS, PREVIEW_SEGMENT_STROKE } from "@/constants/drawing";
import { BaseShapeTool } from "./baseShapeTool";
import { useNodeStore } from "@/store/nodeStore";
import type { GeometryLayers } from "@/models/stage";
import type { ToolContext } from "../baseTool";
import { useCircleStore } from "@/store/circleStore";

export class CircleTool extends BaseShapeTool {

    protected layers: GeometryLayers;

    protected centreNodeGfx: Graphics;
    protected radiusNodeGfx: Graphics;
    protected arcGfx: Graphics;

    constructor(context: ToolContext, layers: GeometryLayers) {
        super(context);
        this.layers = layers;
        this.totalRequiredAnchors = 2;

        // Create graphics to draw a preview circle once
        // Set to invisible, update when actually drawing
        this.centreNodeGfx = new Graphics().circle(0, 0, NODE_RADIUS).fill(NODE_COLOR);
        this.centreNodeGfx.eventMode = "none";
        this.centreNodeGfx.visible = false;
        this.layers.preview.addChild(this.centreNodeGfx);

        this.radiusNodeGfx = new Graphics().circle(0, 0, NODE_RADIUS).fill(NODE_COLOR);
        this.radiusNodeGfx.eventMode = "none";
        this.radiusNodeGfx.visible = false;
        this.layers.preview.addChild(this.radiusNodeGfx);

        this.arcGfx = new Graphics();
        this.arcGfx.eventMode = "none";
        this.arcGfx.visible = false;
        this.layers.preview.addChild(this.arcGfx);
    }

    onMoveDraw(p: Vec2): void {

        const startP = this.anchors[0];
        const endP = p;
        const radius = Math.hypot(endP.x - startP.p.x, endP.y - startP.p.y);

        this.centreNodeGfx.position.set(startP.p.x, startP.p.y);
        this.centreNodeGfx.visible = true;

        this.radiusNodeGfx.position.set(endP.x, endP.y);
        this.radiusNodeGfx.visible = true;

        this.arcGfx.clear()
            .circle(startP.p.x, startP.p.y, radius)
            .stroke(PREVIEW_SEGMENT_STROKE);
        this.arcGfx.visible = true;
    }

    isZeroSize(): boolean {
        // Should never happen
        if (this.anchors.length < this.totalRequiredAnchors) return true;

        // If radius node is at center node, then is zero size
        if (compareVec(this.anchors[0].p, this.anchors[1].p)) return true;

        return false;

    }

    commitGeometry(): void {
        // Commit nodes and segments to stores
        useNodeStore.getState().addMany(this.anchors);
        useCircleStore.getState().add({ id: this.cid(), center: this.anchors[0].id, radius: this.anchors[1].id })
    }

    discardGeometry(): void {
        this.anchors = [];
        this.centreNodeGfx.visible = false;
        this.radiusNodeGfx.visible = false;
        this.arcGfx.visible = false;
    }

    postCreate(_p: Vec2, _isSnapped: boolean): void {
        this.discardGeometry();
    }

}
