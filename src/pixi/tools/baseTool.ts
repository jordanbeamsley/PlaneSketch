import type { Point } from "pixi.js";
import type { SnapOverlay } from "../snap/overlay";
import type { SnapEngine } from "../snap/engine";
import type { CachedDataSource } from "../snap/cachedDataSource";
import type { SnapRuleContext } from "../snap/types";
import { SNAP_RADIUS } from "@/constants/drawing";
import type { Vec2 } from "@/models/vectors";

export interface ToolContext {
    snapOverlay: SnapOverlay;
    snapEngine: SnapEngine;
    dataSource: CachedDataSource;
    transformToScreen: (p: Vec2) => Vec2;
}

export interface PointerPayload {
    world: Point;
}

export abstract class BaseTool {
    protected snapOverlay: SnapOverlay;
    protected snapEngine: SnapEngine;
    protected dataSource: CachedDataSource;
    protected transformToScreen: (p: Vec2) => Vec2;

    // Resolve active snap rules based on tool
    // i.e axis snapping may be enabled, but only applies to line based tools
    // TODO: Subscribe to snap rule changes from here
    protected baseSnapContext: SnapRuleContext;

    constructor(context: ToolContext) {
        this.snapOverlay = context.snapOverlay;
        this.snapEngine = context.snapEngine;
        this.dataSource = context.dataSource;
        this.transformToScreen = context.transformToScreen;

        this.baseSnapContext = {
            p: { x: 0, y: 0 },
            ds: this.dataSource,
            opts: {
                radius: SNAP_RADIUS,
                enable: { node: true, axisH: true, axisV: true, origin: true },
                hysterisisMult: 1.5,
                transform: (p) => this.transformToScreen(p)
            }
        }
    }

    abstract onDown(p: PointerPayload): void;
    abstract onMove(p: PointerPayload): void;
    abstract onKeyDown(e: KeyboardEvent): void;
    abstract destruct(): void;
}
