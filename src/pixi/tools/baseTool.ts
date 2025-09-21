import type { FederatedPointerEvent } from "pixi.js";
import type { ShapeLayers } from "../../models/layers";
import type { SnapOverlay } from "../snap/overlay";
import type { SnapEngine } from "../snap/engine";

export abstract class BaseTool {
    protected layers: ShapeLayers;
    protected snapOverlay: SnapOverlay;
    protected snapEngine: SnapEngine;

    constructor(layers: ShapeLayers, snapOverlay: SnapOverlay, snapEngine: SnapEngine) {
        this.layers = layers
        this.snapOverlay = snapOverlay;
        this.snapEngine = snapEngine;
    }

    abstract onDown(e: FederatedPointerEvent): void;
    abstract onMove(e: FederatedPointerEvent): void;
    abstract onUp(e: FederatedPointerEvent): void;
    abstract onKeyDown(e: KeyboardEvent): void;
}
