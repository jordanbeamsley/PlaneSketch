import { Graphics, Rectangle, type FederatedPointerEvent } from "pixi.js";
import { BaseShapeTool } from "./baseShapeTool";
import { type Shape } from "../../models/shapes";
import { HIT_SLOP, STROKE_STYLE } from "../../constants/drawing";

export class RectTool extends BaseShapeTool {

    onMove(e: FederatedPointerEvent): void {
        if (!this.previewShape || this.previewShape.kind !== "rect") return;

        const { x1: x1, y1: y1 } = this.previewShape.geometryData;
        const { x: x2, y: y2 } = e.global;

        this.previewShape.gfx.clear()
            .moveTo(x1, y1)
            .lineTo(x2, y1)
            .lineTo(x2, y2)
            .lineTo(x1, y2)
            .closePath()
            .stroke(STROKE_STYLE);

        this.previewShape.geometryData.x2 = x2;
        this.previewShape.geometryData.y2 = y2;

        this.previewNodes[1].x = x2; this.previewNodes[1].y = y1;
        this.previewNodes[2].x = x2; this.previewNodes[2].y = y2;
        this.previewNodes[3].x = x1; this.previewNodes[3].y = y2;

        for (const n of this.previewNodes.slice(1)) {
            n.gfx.position.set(n.x - x1, n.y - y1);
        }
    }

    onUp(): void {
        // No-op
    }

    makeSkeleton(x: number, y: number): Shape {
        const shape: Shape = ({
            id: 1,
            kind: "rect",
            gfx: new Graphics(),
            geometryData: {
                x1: x,
                y1: y,
                x2: x,
                y2: y
            }
        });

        return shape;
    }

    isNotZeroSize(): boolean {
        if (!this.previewShape || this.previewShape.kind !== "rect") return false;

        const { x1, y1, x2, y2 } = this.previewShape.geometryData;
        if (x1 === x2 && y1 === y2) return false;

        return true;

    }

    applyHitArea() {
        if (!this.previewShape || this.previewShape.kind !== "rect") return;

        const { x1, y1, x2, y2 } = this.previewShape.geometryData;
        this.previewShape.gfx.hitArea = new Rectangle(
            Math.min(x1, x2) - HIT_SLOP,
            Math.min(y1, y2) - HIT_SLOP,
            Math.abs(x2 - x1) + 2 * HIT_SLOP,
            Math.abs(y2 - y1) + 2 * HIT_SLOP
        )
    }

    postCreate(): void {
        this.previewShape = undefined;
    }
}