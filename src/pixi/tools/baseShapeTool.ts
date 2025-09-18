import { type FederatedPointerEvent } from "pixi.js";
import type { Shape } from "../../models/shapes";
import { BaseTool } from "./baseTool";
import { useShapeStore } from "../../store/shapeStore";
import { generateNodesForShape } from "../nodes/nodeFactory";
import { useNodeStore } from "../../store/nodeStore";
import type { Node } from "../../models/node";
import { HIT_SLOP } from "@/constants/drawing";
import { copyVec, type Vec2 } from "@/models/vectors";

export abstract class BaseShapeTool extends BaseTool {

    protected previewShape?: Shape;
    protected previewNodes: Node[] = [];

    // Keep track of snapped node
    protected snappedPoint: Vec2 | undefined = undefined;

    abstract onMoveWithSnap(p: Vec2): void;
    abstract onUp(e: FederatedPointerEvent): void;
    abstract makeSkeleton(p: Vec2): Shape;
    abstract isNotZeroSize(): boolean;
    abstract postCreate(p: Vec2): void;


    // First check if cursor is in snapping range of node
    // Then deligate to tools own move handler
    public onMove(e: FederatedPointerEvent): void {
        // Position that will be passed to the tool handler
        let p: Vec2 = e.global;

        // Find node closest to mouse position
        // For now, if two nodes have identical co-ords, return the most recent (last in array)
        // Might need to handle this with more finesse in the future
        const nodes = useNodeStore.getState().nodes;
        let closestNode: Node | null = null;
        let closestDist = Infinity;

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const dist = Math.hypot((e.globalX - node.p.x), (e.globalY - node.p.y));

            if (dist <= closestDist) {
                closestNode = node;
                closestDist = dist;
            }

            // Short-circuit an exact match
            // i.e Mouse is directly above an existing node
            if (dist === 0) break;

            // Check if closest node is within hit_slop and snap to that node
            // Otherwise, just pass the cursor position to tool
            if (closestNode && (closestDist < HIT_SLOP)) {
                p = copyVec(closestNode.p);
                this.snappedPoint = p;
            } else {
                this.snappedPoint = undefined;
            }
        }

        // Finally, delegate to the shape tools onMove handler
        this.onMoveWithSnap(p);
    }

    public onKeyDown(e: KeyboardEvent): void {
        switch (e.key) {
            // Abort current preview shapes
            case "q": {
                this.discardPreviewNodes();
                this.discardPreviewShape();
                this.snappedPoint = undefined;
                break;
            }
            default: break;
        }
    }

    protected createPreviewShape(p: Vec2) {
        this.previewShape = this.makeSkeleton(p);
        this.previewNodes = generateNodesForShape(this.previewShape);

        this.previewNodes.forEach((n) => this.layers.preview.addChild(n.gfx));
        this.layers.sketch.addChild(this.previewShape.gfx);
    }

    protected addPreviewNode(n: Node) {
        this.previewNodes.push(n);
        this.layers.preview.addChild(n.gfx);
    }

    protected commitPreviewNodes() {
        if (this.previewNodes.length === 0) return;

        this.previewNodes.forEach((n) => {
            this.layers.preview.removeChild(n.gfx);
            this.layers.nodes.addChild(n.gfx);
        })

        useNodeStore.getState().addMany(this.previewNodes);

        this.previewNodes = [];
    }

    protected discardPreviewNodes() {
        this.layers.preview.removeChildren().forEach((g) => g.destroy());
        this.previewNodes = [];
    }

    protected discardPreviewShape() {
        if (this.previewShape) {
            // Remove the shape’s gfx from the sketch layer
            this.layers.sketch.removeChild(this.previewShape.gfx);
            this.previewShape.gfx.destroy(); // free GPU buffers

            this.previewShape = undefined;
        }
    }

    onDown(e: FederatedPointerEvent) {
        const p: Vec2 = (this.snappedPoint !== undefined) ? this.snappedPoint : e.global;

        // Start of shape drawing, create preview shape
        if (!this.previewShape) {
            this.createPreviewShape(p);
            return;
        }

        // If the shape is of zero size, discard it
        if (!this.isNotZeroSize()) {
            this.discardPreviewNodes();
            this.discardPreviewShape();
            return;
        }

        this.previewShape.id = Date.now();
        useShapeStore.getState().add(this.previewShape);

        // this.makeDraggable();
        // this.applyHitArea();

        this.commitPreviewNodes();

        this.postCreate(p);
    }

    makeDraggable() {
        if (!this.previewShape) return;
        const g = this.previewShape.gfx;
        let offsetX = 0, offsetY = 0;

        function onDragStart(e: FederatedPointerEvent) {
            offsetX = e.globalX - g.x;
            offsetY = e.globalY - g.y;
            g.cursor = "grabbing";
            g.alpha = 0.8;
            g.on('pointermove', onDragMove);
        }

        function onDragMove(e: FederatedPointerEvent) {
            g.position.set(e.globalX - offsetX, e.globalY - offsetY);
        }

        function onDragEnd() {
            g.off("pointermove", onDragMove);
            g.cursor = "move";
            g.alpha = 1;
        }

        g.eventMode = "static";
        g.cursor = "move";
        g.on("pointerdown", onDragStart)
            .on("pointerup", onDragEnd)
            .on("pointerupoutside", onDragEnd);
    }
}
