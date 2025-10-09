import { Graphics } from "pixi.js";
import { compareVec, type Vec2 } from "@/models/vectors";
import { NODE_COLOR, NODE_RADIUS, PREVIEW_SEGMENT_STROKE } from "@/constants/drawing";
import { BaseShapeTool } from "./baseShapeTool";
import { useNodeStore } from "@/store/nodeStore";
import { useSegmentStore } from "@/store/segmentStore";
import type { Node, Segment } from "@/models/geometry";
import type { GeometryLayers } from "@/models/stage";
import type { ToolContext } from "../baseTool";
import type { SnapResult, SnapRuleContext } from "@/pixi/snap/types";

export class RectTool extends BaseShapeTool {

    private totalNodes = 4;

    protected layers: GeometryLayers;

    protected vertexNodesGfx: Graphics[] = [];
    protected rectGfx: Graphics;

    // Helper to convert anchors positions to 4 node positions
    getPositionsFromAnchors = (startP: Vec2, endP: Vec2): Vec2[] => {
        return ([
            { x: startP.x, y: startP.y },
            { x: endP.x, y: startP.y },
            { x: endP.x, y: endP.y },
            { x: startP.x, y: endP.y }
        ])
    }

    constructor(context: ToolContext, layers: GeometryLayers) {
        super(context);
        this.layers = layers;
        this.totalRequiredAnchors = 2;

        // Create graphics to draw a preview rect once
        // Set to invisible, update when actually drawing
        for (let i = 0; i < this.totalNodes; i++) {
            const g = new Graphics().circle(0, 0, NODE_RADIUS).fill(NODE_COLOR);
            g.eventMode = "none";
            g.visible = false;
            this.layers.preview.addChild(g);
            this.vertexNodesGfx.push(g);
        }

        this.rectGfx = new Graphics();
        this.rectGfx.eventMode = "none";
        this.rectGfx.visible = false;
        this.layers.preview.addChild(this.rectGfx);
    }

    onMoveDraw(p: Vec2): void {

        const startP = this.anchors[0];
        const endP = p;

        const nodePositions = this.getPositionsFromAnchors(startP.p, endP);

        this.vertexNodesGfx.forEach((g, i) => {
            g.position.set(nodePositions[i].x, nodePositions[i].y);
            g.visible = true;
        });

        // We can use a single graphic here
        // the scene renderer will change to segments after commit
        this.rectGfx.clear()
            .moveTo(nodePositions[0].x, nodePositions[0].y)
            .lineTo(nodePositions[1].x, nodePositions[1].y)
            .lineTo(nodePositions[2].x, nodePositions[2].y)
            .lineTo(nodePositions[3].x, nodePositions[3].y)
            .closePath().stroke(PREVIEW_SEGMENT_STROKE);
        this.rectGfx.visible = true;
    }

    isZeroSize(): boolean {
        // Should never happen
        if (this.anchors.length < this.totalRequiredAnchors) return true;

        // If anchors of rect are the same point, then is zero size
        if (compareVec(this.anchors[0].p, this.anchors[1].p)) return true;

        return false;

    }

    commitGeometry(): void {
        // Commit nodes and segments to stores
        const positions = this.getPositionsFromAnchors(this.anchors[0].p, this.anchors[1].p);
        const nodes: Node[] = [
            this.anchors[0],
            { id: this.nid(), p: { x: positions[1].x, y: positions[1].y } },
            this.anchors[1],
            { id: this.nid(), p: { x: positions[3].x, y: positions[3].y } }
        ];
        const segments: Segment[] = [
            { id: this.sid(), p1: nodes[0].id, p2: nodes[1].id },
            { id: this.sid(), p1: nodes[1].id, p2: nodes[2].id },
            { id: this.sid(), p1: nodes[2].id, p2: nodes[3].id },
            { id: this.sid(), p1: nodes[3].id, p2: nodes[0].id }
        ]

        useNodeStore.getState().addMany(nodes);
        useSegmentStore.getState().addMany(segments);
    }

    discardGeometry(): void {
        this.anchors = [];
        this.vertexNodesGfx.forEach((g) => {
            g.visible = false;
        });

        this.rectGfx.visible = false;
    }

    postCreate(_p: Vec2, _snap: SnapResult): void {
        this.discardGeometry();
    }

    resolveSnapContext(context: SnapRuleContext, p: Vec2): SnapRuleContext {
        // Disable axis snapping for rects
        const resolvedContext = { ...context, p: p };
        resolvedContext.opts.enable = { ...resolvedContext.opts.enable, axisH: false, axisV: false }

        return resolvedContext;
    }
}
