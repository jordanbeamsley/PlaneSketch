import { Point, type Container } from "pixi.js";
import { scaleFromTicks, ticksFromScale } from "./zoomQuantizer";
import { useViewportStore } from "@/store/viewportStore";

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
    private minTicks: number;
    private maxTicks: number;

    // The single source of truth for current zoom ticks
    private zoomTicks: number;

    constructor(context: CameraContext) {
        this.world = context.world;
        this.getViewportSize = context.getViewportSize;
        this.minTicks = ticksFromScale(context.limits.minScale);
        this.maxTicks = ticksFromScale(context.limits.maxScale);

        // Initialize ticks from the current world scale (quantized)
        this.zoomTicks = ticksFromScale(this.world.scale.x);
        // Snap the actual world scale to the quantized value (clean start)
        const snappedScale = scaleFromTicks(this.zoomTicks);
        if (snappedScale !== this.world.scale.x) this.world.scale.set(snappedScale, snappedScale);
    }

    // Scaling is uniform, so x == y
    get scale() { return this.world.scale.x }
    get ticks() { return this.zoomTicks }

    // Pan the camera by screen space delta (pixels)
    panByScreen(dx: number, dy: number) {
        this.world.position.x += dx;
        this.world.position.y += dy;
    }

    applyDeltaTicks(deltaTicks: number, screenP: Point) {
        // May be called without having crossed a tick threshold
        if (deltaTicks === 0) return;

        const nextTicks = this.clampTicks(this.zoomTicks + deltaTicks);
        if (nextTicks === this.zoomTicks) return;

        this.setTicksAtPoint(nextTicks, screenP);

    }

    /** Set absolute ticks at a given point */
    setTicksAtPoint(targetTicks: number, screenP: Point) {
        const clampedTicks = this.clampTicks(targetTicks);
        const currentScale = this.world.scale.x;
        const targetScale = scaleFromTicks(clampedTicks);

        if (targetScale === currentScale) {
            this.zoomTicks = clampedTicks;
            return;
        }

        useViewportStore.getState().update(targetTicks);

        // Calculate where point moves to after scaling
        const worldBefore = this.world.toLocal(screenP);
        this.world.scale.set(targetScale);
        const worldAfter = this.world.toGlobal(worldBefore);

        this.panByScreen(screenP.x - worldAfter.x, screenP.y - worldAfter.y);
        this.zoomTicks = targetTicks;
    }

    setDefaultZoom() {
        const { w, h } = this.getViewportSize();
        this.setTicksAtPoint(ticksFromScale(1), new Point(w / 2, h / 2));
    }

    private clampTicks(s: number) {
        return Math.max(this.minTicks, Math.min(this.maxTicks, s));
    }
}
