import { Graphics } from "pixi.js";
import { BaseShapeTool } from "./baseShapeTool";
import { type Shape } from "../../models/shapes";
import { STROKE_STYLE } from "../../constants/drawing";
import { copyVec, type Vec2 } from "@/models/vectors";

export class RectTool extends BaseShapeTool {

    onMoveWithSnap(p: Vec2): void {
        if (!this.previewShape || this.previewShape.kind !== "rect") return;

        const p1 = copyVec(this.previewShape.geometryData.p1);
        const p2 = copyVec(p);

        this.previewShape.gfx.clear()
            .moveTo(p1.x, p1.y)
            .lineTo(p2.x, p1.y)
            .lineTo(p2.x, p2.y)
            .lineTo(p1.x, p2.y)
            .closePath()
            .stroke(STROKE_STYLE);
        this.previewShape.gfx.eventMode = "none";

        this.previewShape.geometryData.p2 = p2;

        this.previewNodes[1].p.x = p2.x; this.previewNodes[1].p.y = p1.y;
        this.previewNodes[2].p.x = p2.x; this.previewNodes[2].p.y = p2.y;
        this.previewNodes[3].p.x = p1.x; this.previewNodes[3].p.y = p2.y;

        for (const n of this.previewNodes.slice(1)) {
            n.gfx.position.set(n.p.x - p1.x, n.p.y - p1.y);
        }
    }

    onUp(): void {
        // No-op
    }

    makeSkeleton(p: Vec2): Shape {

        const p1 = copyVec(p);
        const p2 = copyVec(p);

        const shape: Shape = ({
            id: 1,
            kind: "rect",
            gfx: new Graphics(),
            geometryData: {
                p1: p1,
                p2: p2
            }
        });

        return shape;
    }

    isNotZeroSize(): boolean {
        if (!this.previewShape || this.previewShape.kind !== "rect") return false;

        const { p1, p2 } = this.previewShape.geometryData;
        if (p1 == p2) return false;

        return true;

    }

    postCreate(): void {
        this.previewShape = undefined;
    }
}
