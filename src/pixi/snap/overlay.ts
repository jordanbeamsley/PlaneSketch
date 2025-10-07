import { Graphics, type Container } from "pixi.js";
import type { SnapResult } from "./types";
import type { Vec2 } from "@/models/vectors";
import { SNAP_NODE_SIZE, SNAP_STROKE } from "@/constants/canvas";

export class SnapOverlay {

    // Guide layer, node hover, on edge hover, etc.
    private layer: Container;
    // Outline square on nodes and origin
    private nodeSnapGfx: Graphics;
    // transform to screen space callback
    private transform: (p: Vec2) => Vec2;

    constructor(layer: Container, transformToScreen: (p: Vec2) => Vec2) {
        this.layer = layer;
        this.transform = (p: Vec2) => transformToScreen(p);

        this.nodeSnapGfx = new Graphics().rect(0, 0, SNAP_NODE_SIZE, SNAP_NODE_SIZE).stroke(SNAP_STROKE);
        this.nodeSnapGfx.visible = false; this.nodeSnapGfx.eventMode = "none";

        this.layer.addChild(this.nodeSnapGfx);
    }

    render(result: SnapResult) {
        this.nodeSnapGfx.visible = false;

        if (result.kind === "none") return;

        if (result.kind === "node" || result.kind === "origin") {
            const pt = this.transform(result.p);
            this.nodeSnapGfx.position = {
                x: Math.ceil(pt.x - SNAP_NODE_SIZE / 2) - 0.5,
                y: Math.ceil(pt.y - SNAP_NODE_SIZE / 2) - 0.5
            };
            this.nodeSnapGfx.visible = true;
        }
    }
}
