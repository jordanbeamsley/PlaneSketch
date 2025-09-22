import type { FederatedPointerEvent } from "pixi.js";
import type { SnapOverlay } from "../snap/overlay";
import type { SnapEngine } from "../snap/engine";
import type { CachedDataSource } from "../snap/cachedDataSource";
import type { ShapeLayers } from "@/models/stage";

export abstract class BaseTool {
    protected layers: ShapeLayers;
    protected snapOverlay: SnapOverlay;
    protected snapEngine: SnapEngine;
    protected dataSource: CachedDataSource;

    constructor(layers: ShapeLayers, snapOverlay: SnapOverlay, snapEngine: SnapEngine, dataSoure: CachedDataSource) {
        this.layers = layers
        this.snapOverlay = snapOverlay;
        this.snapEngine = snapEngine;
        this.dataSource = dataSoure;
    }

    abstract onDown(e: FederatedPointerEvent): void;
    abstract onMove(e: FederatedPointerEvent): void;
    abstract onUp(e: FederatedPointerEvent): void;
    abstract onKeyDown(e: KeyboardEvent): void;
}
