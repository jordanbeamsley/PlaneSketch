import { type FederatedPointerEvent } from "pixi.js";
import { HIT_SLOP } from "@/constants/drawing";
import { copyVec, type Vec2 } from "@/models/vectors";
import { BaseTool } from "../baseTool";
import type { Shape } from "@/models/shapes";
import { useNodeStore } from "@/store/nodeStore";
import { generateNodesForShape } from "@/pixi/nodes/nodeFactory";
import { useShapeStore } from "@/store/shapeStore";
import type { SnapResult } from "@/pixi/snap/types";
import type { Node } from "@/models/geometry";

export abstract class BaseShapeTool extends BaseTool {

    protected previewShape?: Shape;
    protected previewNodes: Node[] = [];
    protected currentSnap: SnapResult = { kind: "none", p: { x: 0, y: 0 } };

    abstract onMoveWithSnap(p: Vec2): void;
    abstract onUp(e: FederatedPointerEvent): void;
    abstract makeSkeleton(p: Vec2): Shape;
    abstract isNotZeroSize(): boolean;
    abstract postCreate(p: Vec2, isSnapped: boolean): void;


    onDown(_e: FederatedPointerEvent) {
        const p: Vec2 = copyVec(this.currentSnap.p);

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

        this.commitPreviewNodes();

        this.postCreate(p, this.currentSnap.kind !== "none");
    }


    // First check if cursor is in snapping range of node
    // Then deligate to tools own move handler
    public onMove(e: FederatedPointerEvent): void {
        let p: Vec2 = e.global;

        // Call snap engine
        this.currentSnap = this.snapEngine.snap({
            p: p,
            ds: this.dataSource,
            opts: {
                radius: HIT_SLOP,
                enable: {
                    node: true
                }
            }
        })
        this.snapOverlay.render(this.currentSnap);

        // Delegate to the shape tools onMove handler
        this.onMoveWithSnap(this.currentSnap.p);
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
