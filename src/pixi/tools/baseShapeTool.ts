import type { FederatedPointerEvent } from "pixi.js";
import type { Shape } from "../../models/shapes";
import { BaseTool } from "./baseTool";
import { useShapeStore } from "../../store/shapeStore";
import { generateNodesForShape } from "../nodes/nodeFactory";
import { useNodeStore } from "../../store/nodeStore";
import type { Node } from "../../models/node";
import { HIT_SLOP } from "@/constants/drawing";

export abstract class BaseShapeTool extends BaseTool {
    protected previewShape?: Shape;
    protected previewNodes: Node[] = [];

    // Keep track of snapped node, useful in postCreate
    protected isSnapped: boolean = false;


    abstract onMoveWithSnap(x: number, y: number): void;
    abstract onUp(e: FederatedPointerEvent): void;
    abstract makeSkeleton(x: number, y: number): Shape;
    abstract isNotZeroSize(): boolean;
    abstract applyHitArea(): void;
    abstract postCreate(x: number, y: number): void;

    // First check if cursor is in snapping range of node
    // Then deligate to tools own move handler
    public onMove(e: FederatedPointerEvent): void {
        // Position that will be passed to the tool handler
        let { x, y } = e.global;

        // Find node closest to mouse position
        // For now, if two nodes have identical co-ords, return the most recent (last in array)
        const nodes = useNodeStore.getState().nodes;
        let closestNode: Node | null = null;
        let closestDist = Infinity;

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const dist = Math.hypot((e.globalX - node.x), (e.globalY - node.y));

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
                x = closestNode.x;
                y = closestNode.y;
                this.isSnapped = true;
            } else {
                this.isSnapped = false;
            }
        }

        this.onMoveWithSnap(x, y);
        console.log("in on move!");
    }

    protected createPreviewShape(x: number, y: number) {
        this.previewShape = this.makeSkeleton(x, y);
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

    onDown(e: FederatedPointerEvent) {
        const { x, y } = e.global;
        if (!this.previewShape) {
            this.createPreviewShape(x, y);
            return;
        }

        if (!this.isNotZeroSize()) {
            this.discardPreviewNodes();
            this.previewShape = undefined;
            return;
        } else {
            this.previewShape.id = Date.now();
            useShapeStore.getState().add(this.previewShape);

            this.makeDraggable();
            this.applyHitArea();

            this.commitPreviewNodes();
        }

        this.postCreate(x, y);
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
