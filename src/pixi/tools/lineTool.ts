import { Graphics } from "pixi.js";
import { BaseShapeTool } from "./baseShapeTool";
import { type Shape } from "../../models/shapes";
import { STROKE_STYLE } from "../../constants/drawing";
import { copyVec, type Vec2 } from "@/models/vectors";

export class LineTool extends BaseShapeTool {

    onMoveWithSnap(p: Vec2): void {
        if (!this.previewShape || this.previewShape.kind !== "line") return;

        const p1 = copyVec(this.previewShape.geometryData.p1);
        const p2 = copyVec(p);

        console.log(`p1: ${p1.x},${p1.y} | p2: ${p2.x},${p2.y}`);
        this.previewShape.gfx.clear()
            .moveTo(p1.x, p1.y)
            .lineTo(p2.x, p2.y)
            .stroke(STROKE_STYLE);
        this.previewShape.gfx.eventMode = "none";

        this.previewShape.geometryData.p2 = p2;
        this.previewNodes[1].p = p2;
        this.previewNodes[1].gfx.position.set(p2.x - p1.x, p2.y - p1.y);
    }

    onUp(): void {
        // No-op
    }

    makeSkeleton(p: Vec2): Shape {

        const p1 = copyVec(p);
        const p2 = copyVec(p);

        return ({
            id: 1,
            kind: "line",
            gfx: new Graphics(),
            geometryData: {
                p1: p1,
                p2: p2
            }
        });
    }

    isNotZeroSize(): boolean {
        if (!this.previewShape || this.previewShape.kind !== "line") return false;

        const { p1, p2 } = this.previewShape.geometryData;
        if (p1 == p2) {
            return false;
        }

        return true;
    }

    postCreate(p: Vec2): void {
        // If we're snapped to a guide then end line drawing
        if (this.snappedPoint) {
            this.previewShape = undefined;
            return;
        }
        // Otherwise create a new line from the end point of the previous
        this.createPreviewShape(p);
    }

}
