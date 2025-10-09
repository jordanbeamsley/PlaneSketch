import { Graphics } from "pixi.js";
import { compareVec, type Vec2 } from "@/models/vectors";
import { NODE_COLOR, NODE_RADIUS, PREVIEW_SEGMENT_STROKE } from "@/constants/drawing";
import { BaseShapeTool } from "./baseShapeTool";
import { useNodeStore } from "@/store/nodeStore";
import type { GeometryLayers } from "@/models/stage";
import type { ToolContext } from "../baseTool";
import { useCircleStore } from "@/store/circleStore";
import type { SnapResult, SnapRuleContext } from "@/pixi/snap/types";

export class CircleTool extends BaseShapeTool {

    protected layers: GeometryLayers;

    protected centreNodeGfx: Graphics;
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

        this.arcGfx = new Graphics();
        this.arcGfx.eventMode = "none";
        this.arcGfx.visible = false;
        this.layers.preview.addChild(this.arcGfx);
    }

    onMoveDraw(p: Vec2): void {

        const startP = this.anchors[0].p;
        const endP = p;
        const radius = Math.hypot(endP.x - startP.x, endP.y - startP.y);

        this.centreNodeGfx.position.set(startP.x, startP.y);
        this.centreNodeGfx.visible = true;

        this.arcGfx.clear()
            .circle(startP.x, startP.y, radius)
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
        const centreP = this.anchors[0].p;
        const radiusP = this.anchors[1].p;
        const radius = Math.hypot(radiusP.x - centreP.x, radiusP.y - centreP.y);

        useNodeStore.getState().add(this.anchors[0]);
        useCircleStore.getState().add({ id: this.cid(), center: this.anchors[0].id, radius: radius })
    }

    discardGeometry(): void {
        this.anchors = [];
        this.centreNodeGfx.visible = false;
        this.arcGfx.visible = false;
    }

    postCreate(_p: Vec2, _snap: SnapResult): void {
        this.discardGeometry();
    }

    resolveSnapContext(context: SnapRuleContext, p: Vec2): SnapRuleContext {
        // Disable axis snapping for circles
        const resolvedContext = { ...context, p: p };
        resolvedContext.opts.enable = { ...resolvedContext.opts.enable, axisH: false, axisV: false }

        return resolvedContext;
    }
}
