import { Graphics, Point, Polygon } from "pixi.js";
import { BaseShapeTool } from "./baseShapeTool";
import { type Shape } from "../../models/shapes";
import { HIT_SLOP, STROKE_STYLE } from "../../constants/drawing";

export class LineTool extends BaseShapeTool {

    onMoveWithSnap(x2: number, y2: number): void {
        if (!this.previewShape || this.previewShape.kind !== "line") return;

        const { x1, y1 } = this.previewShape.geometryData;

        this.previewShape.gfx.clear()
            .moveTo(x1, y1)
            .lineTo(x2, y2)
            .stroke(STROKE_STYLE);

        this.previewShape.geometryData.x2 = x2;
        this.previewShape.geometryData.y2 = y2;

        this.previewNodes[1].x = x2; this.previewNodes[1].y = y2;

        this.previewNodes[1].gfx.position.set(x2 - x1, y2 - y1);
    }

    onUp(): void {
        // No-op
    }

    makeSkeleton(x: number, y: number): Shape {
        return ({
            id: 1,
            kind: "line",
            gfx: new Graphics(),
            geometryData: {
                x1: x,
                y1: y,
                x2: x,
                y2: y
            }
        });
    }

    isNotZeroSize(): boolean {
        if (!this.previewShape || this.previewShape.kind !== "line") return false;

        const { x1, y1, x2, y2 } = this.previewShape.geometryData;
        if (Math.hypot((x2 - x1), (y2 - y1)) === 0) {
            return false;
        }

        return true;
    }

    postCreate(x: number, y: number): void {
        if (this.isSnapped) {
            this.previewShape = undefined;
            return;
        }
        this.createPreviewShape(x, y);
    }

    applyHitArea() {
        if (!this.previewShape || this.previewShape.kind !== "line") return;
        const { x1, y1, x2, y2 } = this.previewShape.geometryData;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const nx = (dy / len) * HIT_SLOP;
        const ny = -(dx / len) * HIT_SLOP;

        this.previewShape.gfx.hitArea = new Polygon([
            new Point(x1 + nx, y1 + ny),
            new Point(x1 - nx, y1 - ny),
            new Point(x2 - nx, y2 - ny),
            new Point(x2 + nx, y2 + ny),
        ])
    }
}
