import { type FederatedPointerEvent } from "pixi.js";
import { HIT_SLOP } from "@/constants/drawing";
import { type Vec2 } from "@/models/vectors";
import { BaseTool } from "../baseTool";
import type { Shape } from "@/models/shapes";
import type { Node } from "@/models/node"
import { useNodeStore } from "@/store/nodeStore";
import { generateNodesForShape } from "@/pixi/nodes/nodeFactory";
import { useShapeStore } from "@/store/shapeStore";

export abstract class BaseShapeTool extends BaseTool {

    protected previewShape?: Shape;
    protected previewNodes: Node[] = [];

    abstract onMoveWithSnap(p: Vec2): void;
    abstract onUp(e: FederatedPointerEvent): void;
    abstract makeSkeleton(p: Vec2): Shape;
    abstract isNotZeroSize(): boolean;
    abstract postCreate(p: Vec2, isSnapped: boolean): void;


    onDown(e: FederatedPointerEvent) {
        const currentSnap = this.snapEngine.getCurrentSnap();
        const p: Vec2 = (currentSnap.kind !== "none") ? currentSnap.p : e.global;

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

        this.postCreate(p, currentSnap.kind !== "none");
    }


    // First check if cursor is in snapping range of node
    // Then deligate to tools own move handler
    public onMove(e: FederatedPointerEvent): void {
        // Position that will be passed to the tool handler
        let p: Vec2 = e.global;

        // Call snap engine
        const snapResult = this.snapEngine.snap(p, { radius: HIT_SLOP });
        this.snapOverlay.render(snapResult);

        // Delegate to the shape tools onMove handler
        if (snapResult.kind !== "none")
            this.onMoveWithSnap(snapResult.p);
        else
            this.onMoveWithSnap(p);
    }

    public onKeyDown(e: KeyboardEvent): void {
        switch (e.key) {
            // Abort current preview shapes
            case "q": {
                this.discardPreviewNodes();
                this.discardPreviewShape();
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
