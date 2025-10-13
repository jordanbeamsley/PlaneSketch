import { Graphics } from "pixi.js";
import { compareVec, type Vec2 } from "@/models/vectors";
import { NODE_COLOR, NODE_RADIUS, PREVIEW_SEGMENT_STROKE } from "@/constants/drawing";
import { BaseShapeTool } from "./baseShapeTool";
import { useNodeStore } from "@/store/nodeStore";
import { useSegmentStore } from "@/store/segmentStore";
import type { GeometryLayers } from "@/models/stage";
import type { ToolContext } from "../baseTool";
import type { SnapResult, SnapRuleContext } from "@/pixi/snap/types";
import { scaleFromTicks } from "@/pixi/camera/zoomQuantizer";
import { useViewportStore } from "@/store/viewportStore";

export class LineTool extends BaseShapeTool {

    protected layers: GeometryLayers;

    protected startNodeGfx: Graphics;
    protected endNodeGfx: Graphics;
    protected lineGfx: Graphics;

    constructor(context: ToolContext, layers: GeometryLayers) {
        super(context);
        this.layers = layers;
        this.totalRequiredAnchors = 2;

        // Create graphics to draw a preview line once
        // Set to invisible, update when actually drawing
        this.startNodeGfx = new Graphics().circle(0, 0, NODE_RADIUS).fill(NODE_COLOR);
        this.startNodeGfx.eventMode = "none";
        this.startNodeGfx.visible = false;
        this.layers.preview.addChild(this.startNodeGfx);

        this.endNodeGfx = new Graphics().circle(0, 0, NODE_RADIUS).fill(NODE_COLOR);
        this.endNodeGfx.eventMode = "none";
        this.endNodeGfx.visible = false;
        this.layers.preview.addChild(this.endNodeGfx);

        this.lineGfx = new Graphics();
        this.lineGfx.eventMode = "none";
        this.lineGfx.visible = false;
        this.layers.preview.addChild(this.lineGfx);

        this.rescaleNodes(useViewportStore.getState().zoomTicks);
    }

    rescaleNodes(zoomTicks: number): void {
        const s = scaleFromTicks(zoomTicks);
        const nodeScale = 1 / s;

        this.startNodeGfx.scale.set(nodeScale);
        this.endNodeGfx.scale.set(nodeScale);
    }

    onMoveDraw(p: Vec2): void {

        const startP = this.anchors[0];
        const endP = p;

        this.startNodeGfx.position.set(startP.p.x, startP.p.y);
        this.startNodeGfx.visible = true;

        this.endNodeGfx.position.set(endP.x, endP.y);
        this.endNodeGfx.visible = true;

        this.lineGfx.clear()
            .moveTo(startP.p.x, startP.p.y)
            .lineTo(endP.x, endP.y)
            .stroke(PREVIEW_SEGMENT_STROKE);
        this.lineGfx.visible = true;
    }

    isZeroSize(): boolean {
        // Should never happen
        if (this.anchors.length < this.totalRequiredAnchors) return true;

        // If start and end of line are the same point, then is zero size
        if (compareVec(this.anchors[0].p, this.anchors[1].p)) return true;

        return false;
    }

    commitGeometry(): void {
        // Commit nodes and segments to stores
        useNodeStore.getState().addMany(this.anchors);
        useSegmentStore.getState().add({ id: this.sid(), p1: this.anchors[0].id, p2: this.anchors[1].id })
    }

    discardGeometry(): void {
        this.anchors = [];
        this.startNodeGfx.visible = false;
        this.endNodeGfx.visible = false;
        this.lineGfx.visible = false;
    }

    postCreate(_p: Vec2, snap: SnapResult): void {
        const lastAnchor = this.anchors[1];
        this.discardGeometry();

        // If we're snapped to a guide then end line drawing
        if (snap.kind === "node") {
            return;
        }
        // Otherwise create a new line from the end point of the previous
        this.anchors.push(lastAnchor);
    }

    resolveSnapContext(context: SnapRuleContext, p: Vec2): SnapRuleContext {
        // If we're already drawing a line (i.e anchors > 0),
        // then we have an anchor for axis snaps
        const hasAnchor = this.anchors.length > 0;
        const anchor = hasAnchor ? this.anchors[this.anchors.length - 1].p : undefined;

        const resolvedContext = anchor
            ? { ...context, p, axis: { anchor } }
            : { ...context, p }

        return resolvedContext;
    }
}
