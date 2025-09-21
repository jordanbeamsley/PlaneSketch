import { Graphics } from "pixi.js";
import { BaseShapeTool } from "./baseShapeTool";
import { copyVec, type Vec2 } from "@/models/vectors";
import { STROKE_STYLE } from "@/constants/drawing";
import type { Shape } from "@/models/shapes";

export class CircleTool extends BaseShapeTool {

    onMoveWithSnap(p: Vec2): void {
        if (!this.previewShape || this.previewShape.kind !== "circle") return;

        const c = copyVec(this.previewShape.geometryData.c);
        const p1 = copyVec(p);
        const radius = Math.hypot(p1.x - c.x, p1.y - c.y);

        this.previewShape.gfx.clear()
            .circle(c.x, c.y, radius)
            .stroke(STROKE_STYLE);
        this.previewShape.gfx.eventMode = "none";

        this.previewShape.geometryData.r = radius;
    }

    onUp(): void {
        // No-op
    }

    makeSkeleton(p: Vec2): Shape {

        const c = copyVec(p);

        const shape: Shape = ({
            id: 1,
            kind: "circle",
            gfx: new Graphics(),
            geometryData: {
                c: c,
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

    postCreate(): void {
        this.previewShape = undefined;
    }
}
