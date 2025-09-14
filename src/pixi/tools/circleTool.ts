import { Circle, Graphics, type FederatedPointerEvent } from "pixi.js";
import { BaseShapeTool } from "./baseShapeTool";
import {  type Shape } from "../../models/shapes";
import { HIT_SLOP, STROKE_STYLE } from "../../constants/drawing";

export class CircleTool extends BaseShapeTool {

    onMove(e: FederatedPointerEvent): void {
        if (!this.previewShape || this.previewShape.kind !== "circle") return;

        const { x: mx, y: my } = e.global;
        const { cx, cy } = this.previewShape.geometryData;
        const radius = Math.hypot(mx - cx, my - cy);

        this.previewShape.gfx.clear()
            .circle(cx, cy, radius)
            .stroke(STROKE_STYLE);

        this.previewShape.geometryData.r = radius;
    }

    onUp(): void {
        // No-op
    }

    makeSkeleton(x: number, y: number): Shape {
        const shape: Shape = ({
            id: 1,
            kind: "circle",
            gfx: new Graphics(),
            geometryData: {
                cx: x,
                cy: y,
                r: 0
            }
        });

        return shape;
    }

    isNotZeroSize(): boolean {
        if (!this.previewShape || this.previewShape.kind !== "circle") return false;
        if (this.previewShape.geometryData.r === 0) return false;

        return true;
    }

    applyHitArea() {
        if (!this.previewShape || this.previewShape.kind !== "circle") return;

        const { cx, cy, r } = this.previewShape.geometryData;

        this.previewShape.gfx.hitArea = new Circle(cx, cy, r + HIT_SLOP);
    }

    postCreate(): void {
        this.previewShape = undefined;
    }
}