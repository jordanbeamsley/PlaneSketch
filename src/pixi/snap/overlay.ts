import { Graphics, type Container } from "pixi.js";
import type { SnapResult } from "./types";
import type { Vec2 } from "@/models/vectors";

export class SnapOverlay {

    // Guide layer, node hover, on edge hover, etc.
    private layer: Container;
    // Semi-transparent circle on nodes
    private hoverCircle: Graphics;
    // transform to screen space callback
    private transform: (p: Vec2) => Vec2;

    constructor(layer: Container, transformToScreen: (p: Vec2) => Vec2) {
        this.layer = layer;
        this.transform = (p: Vec2) => transformToScreen(p);

        this.hoverCircle = new Graphics().circle(0, 0, 12).fill({ color: 0xffa500, alpha: 0.15 }).stroke({ width: 1, color: 0xffa500, alpha: 0.5 });
        this.hoverCircle.visible = false; this.hoverCircle.eventMode = "none";

        this.layer.addChild(this.hoverCircle);
    }

    render(result: SnapResult) {
        this.hoverCircle.visible = false;

        if (result.kind === "none") return;

        if (result.kind === "node") {
            this.hoverCircle.position = this.transform(result.p);
            this.hoverCircle.visible = true;
        }
    }
}
