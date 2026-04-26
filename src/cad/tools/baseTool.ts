import type { Point, Ticker } from "pixi.js";
import type { SnapOverlay } from "../snap/overlay";
import type { SnapEngine } from "../snap/engine";
import type { SnapDataSource, SnapRuleContext } from "../snap/types";
import type { Viewport } from "../camera/viewportService";
import type { Modifiers } from "../input/pointer/types";
import type { CommandContext } from "../input/commands/types";
import type { CommandId } from "../input/commands/defaultCommands";
import type { HistoryManager } from "../input/commands/historyManager";
import { SNAP_RADIUS } from "../constants/drawing";
import type { Tool } from "../models/tools/tools";
import type { SelectionStore } from "../editor/stores/createSelectionStore";
import type { GeometryStore } from "../editor/stores/createGeometryStore";
import type { GraphIndex } from "../graph/graphIndex";

export interface ToolContext {
    snapOverlay: SnapOverlay;
    snapEngine: SnapEngine;
    dataSource: SnapDataSource;
    viewport: Viewport;
    ticker: Ticker;
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
    protected snapOverlay: SnapOverlay;
    protected snapEngine: SnapEngine;
    protected dataSource: SnapDataSource;
    protected viewport: Viewport;
    protected getHistory: () => HistoryManager;
    protected getSelect: () => SelectionStore;
    protected getGeometry: () => GeometryStore;
    protected getGraph: () => GraphIndex;

    protected isInOperation: boolean = false;

    // Resolve active snap rules based on tool
    // i.e axis snapping may be enabled, but only applies to line based tools
    // TODO: Subscribe to snap rule changes from here
    protected baseSnapContext: SnapRuleContext;

    constructor(context: ToolContext) {
        this.snapOverlay = context.snapOverlay;
        this.snapEngine = context.snapEngine;
        this.dataSource = context.dataSource;
        this.viewport = context.viewport;
        this.getHistory = context.getHistory;
        this.getSelect = context.getSelect;
        this.getGeometry = context.getGeometry;
        this.getGraph = context.getGraph;

        this.baseSnapContext = {
            p: { x: 0, y: 0 },
            ds: this.dataSource,
            viewport: this.viewport,
            opts: {
                radius: SNAP_RADIUS,
                enable: { node: true, axisH: true, axisV: true, origin: true, grid: true, segment: true, circle: true },
                hysterisisMult: 1.5,
            }
        }
    }

    get getOperationState() { return this.isInOperation }

    abstract getId(): Tool;
    abstract activate(): void;
    abstract onDown(e: PointerPayload): void;
    abstract onMove(e: PointerPayload): void;
    abstract onUp(e: PointerPayload): void;
    /** Override to intercept commands before they reach the global registry. Return true if handled. */
    executeCommand(_cmd: CommandId, _ctx: CommandContext): boolean { return false; }
    abstract destruct(): void;
}
