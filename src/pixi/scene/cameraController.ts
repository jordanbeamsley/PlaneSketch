import { Point, type Container } from "pixi.js";

export interface CameraLimits {
    minScale: number;
    maxScale: number;
}

export interface CameraContext {
    world: Container;
    getViewportSize: () => { w: number, h: number };
    limits: CameraLimits;
}

export class CameraController {
    private world: Container;
    private getViewportSize: () => { w: number, h: number };
    private limits: CameraLimits;

    constructor(context: CameraContext) {
        this.world = context.world;
        this.getViewportSize = context.getViewportSize;
        this.limits = context.limits;
    }

    // Scaling is uniform, so x == y
    get scale() { return this.world.scale.x }

    // Pan the camera by screen space delta (pixels)
    panByScreen(dx: number, dy: number) {
        this.world.position.x += dx;
        this.world.position.y += dy;
    }

    // Zoom at a specific screen point
    zoomAtScreenPoint(factor: number, screenP: Point) {
        const old = this.world.scale.x;
        let next = this.clampScale(old * factor);
        if (next === old) return;

        // Calculate where point moves to after scaling
        const worldBefore = this.world.toLocal(screenP);
        this.world.scale.set(next);
        const worldAfter = this.world.toGlobal(worldBefore);

        // Translate world to keep screen point under cursor
        this.world.position.x += (screenP.x - worldAfter.x);
        this.world.position.y += (screenP.y - worldAfter.y);
    }

    // Absolute scale to a number, centered at viewport center
    setZoom(scale: number) {
        const { w, h } = this.getViewportSize();
        this.zoomAtScreenPoint(this.clampScale(scale) / this.world.scale.x, new Point(w / 2, h / 2))
    }

    private clampScale(s: number) {
        return Math.max(this.limits.minScale, Math.min(this.limits.maxScale, s));
    }
}
