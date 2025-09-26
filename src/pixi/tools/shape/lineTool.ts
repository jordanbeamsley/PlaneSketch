import { Graphics } from "pixi.js";
import { compareVec, type Vec2 } from "@/models/vectors";
import { NODE_COLOR, NODE_RADIUS, PREVIEW_SEGMENT_STROKE } from "@/constants/drawing";
import { BaseShapeTool } from "./baseShapeTool";
import { useNodeStore } from "@/store/nodeStore";
import { useSegmentStore } from "@/store/segmentStore";
import type { Node } from "@/models/geometry";
import type { GeometryLayers } from "@/models/stage";
import type { ToolContext } from "../baseTool";

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
    }

    onMoveDraw(p: Vec2): void {

        const startP = this.anchors[0];
        const endP = p;

        this.startNodeGfx.position.set(startP.x, startP.y);
        this.startNodeGfx.visible = true;

        this.endNodeGfx.position.set(endP.x, endP.y);
        this.endNodeGfx.visible = true;

        this.lineGfx.clear()
            .moveTo(startP.x, startP.y)
            .lineTo(endP.x, endP.y)
            .stroke(PREVIEW_SEGMENT_STROKE);
        this.lineGfx.visible = true;
    }

    isZeroSize(): boolean {
        // Should never happen
        if (this.anchors.length < this.totalRequiredAnchors) return true;

        // If start and end of line are the same point, then is zero size
        if (compareVec(this.anchors[0], this.anchors[1])) return true;

        return false;

    }

    commitGeometry(): void {
        // Commit nodes and segments to stores
        const nodes: Node[] = [];
        for (const p of this.anchors) {
            nodes.push({ id: this.nid(), p: { x: p.x, y: p.y } })
        }
        useNodeStore.getState().addMany(nodes);
        useSegmentStore.getState().add({ id: this.sid(), p1: nodes[0].id, p2: nodes[1].id })

        const segCount = useSegmentStore.getState().byId.size;
        console.log('segments in store:', segCount);

        this.discardGeometry();
    }

    discardGeometry(): void {
        this.anchors = [];
        this.startNodeGfx.visible = false;
        this.endNodeGfx.visible = false;
        this.lineGfx.visible = false;
    }

    postCreate(p: Vec2, isSnapped: boolean): void {
        // If we're snapped to a guide then end line drawing
        this.anchors = [];
        if (isSnapped) {
            return;
        }
        // Otherwise create a new line from the end point of the previous
        this.anchors.push(p);
    }

}
