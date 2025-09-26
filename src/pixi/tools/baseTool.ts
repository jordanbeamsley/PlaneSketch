import type { FederatedPointerEvent } from "pixi.js";
import type { SnapOverlay } from "../snap/overlay";
import type { SnapEngine } from "../snap/engine";
import type { CachedDataSource } from "../snap/cachedDataSource";
import type { SnapRuleContext } from "../snap/types";
import { SNAP_RADIUS } from "@/constants/drawing";

export interface ToolContext {
    snapOverlay: SnapOverlay;
    snapEngine: SnapEngine;
    dataSource: CachedDataSource
}

export abstract class BaseTool {
    protected snapOverlay: SnapOverlay;
    protected snapEngine: SnapEngine;
    protected dataSource: CachedDataSource;

    // Resolve active snap rules based on tool
    // i.e axis snapping may be enabled, but only applies to line based tools
    // Each tool should call a resolve function and store in resolvedSnapContext
    protected resolvedSnapContext: SnapRuleContext;

    constructor(context: ToolContext) {
        this.snapOverlay = context.snapOverlay;
        this.snapEngine = context.snapEngine;
        this.dataSource = context.dataSource;

        this.resolvedSnapContext = {
            p: { x: 0, y: 0 },
            ds: this.dataSource,
            opts: {
                radius: SNAP_RADIUS,
                enable: { node: true, axisH: true, axisV: true }
            }
        }
    }

    abstract onDown(e: FederatedPointerEvent): void;
    abstract onMove(e: FederatedPointerEvent): void;
    abstract onKeyDown(e: KeyboardEvent): void;
}
