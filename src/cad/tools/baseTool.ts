import type { Point } from "pixi.js";
import type { Viewport } from "../camera/viewportService";
import type { Modifiers } from "../input/pointer/types";
import type { CommandContext } from "../input/commands/types";
import type { CommandId } from "../input/commands/defaultCommands";
import type { HistoryManager } from "../input/commands/historyManager";
import type { Tool } from "../models/tools/tools";
import type { SelectionStore } from "../editor/stores/createSelectionStore";
import type { GeometryStore } from "../editor/stores/createGeometryStore";
import type { GraphIndex } from "../graph/graphIndex";
import type { SnapContextBase, SnapContextOverride, SnapOutcome } from "../snap/snapService";
import type { Vec2 } from "../models/sketch/vectors";

export interface ToolContext {
    viewport: Viewport;
    hideOverlay: () => void;
    getSnap: () => SnapOutcome;
    setSnapContextResolver: (fn?: (base: SnapContextBase, p: Vec2) => SnapContextOverride) => void;
    getHistory: () => HistoryManager;
    getSelect: () => SelectionStore;
    getGeometry: () => GeometryStore;
    getGraph: () => GraphIndex;
}

export interface PointerPayload {
    world: Point;
    modifiers: Modifiers;
}

export abstract class BaseTool {
    protected viewport: Viewport;
    protected getSnap: () => SnapOutcome;
    protected getHistory: () => HistoryManager;
    protected getSelect: () => SelectionStore;
    protected getGeometry: () => GeometryStore;
    protected getGraph: () => GraphIndex;

    protected isInOperation: boolean = false;

    constructor(context: ToolContext) {
        this.viewport = context.viewport;
        this.getSnap = context.getSnap;
        this.getHistory = context.getHistory;
        this.getSelect = context.getSelect;
        this.getGeometry = context.getGeometry;
        this.getGraph = context.getGraph;
    }

    get getOperationState() { return this.isInOperation }

    abstract getId(): Tool;
    abstract activate(): void;
    abstract onDown(s: SnapOutcome, m: Modifiers): void;
    abstract onMove(e: PointerPayload): void;
    abstract onUp(e: PointerPayload): void;
    /** Override to intercept commands before they reach the global registry. Return true if handled. */
    executeCommand(_cmd: CommandId, _ctx: CommandContext): boolean { return false; }
    /** Override to customise the snap engine's rule context while this tool is active */
    getSnapContext?(base: SnapContextBase, p: Vec2): SnapContextOverride;
    abstract destruct(): void;
}
