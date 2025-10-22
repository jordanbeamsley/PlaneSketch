import type { Point } from "pixi.js";
import { BaseTool, type PointerPayload, type ToolContext } from "./baseTool"
import type { SnapResult, SnapRuleContext } from "../snap/types";
import { useSelectStore } from "@/store/selectStore";
import type { Vec2 } from "@/models/vectors";
import { useNodeStore } from "@/store/nodeStore";

export class SelectTool extends BaseTool {
    private isDragging: boolean = false;
    private dragStartP?: Point;

    private currentSnap: SnapResult;

    constructor(context: ToolContext) {
        super(context);
        this.currentSnap = { kind: "none", p: { x: 0, y: 0 } };
    }

    activate(): void {
    }
    onDown(e: PointerPayload): void {

        // Clear any current selections first, unless shift key is pressed
        if (!e.modifiers.shift) useSelectStore.getState().clear();

        // If we're already snapped to a node or segment, then select it
        const snapKind = this.currentSnap.kind;
        if (snapKind === "node" || snapKind === "segment") {
            useSelectStore.getState().add({ kind: snapKind, id: this.currentSnap.id! })
            return;
        }

        // Node snapping may be off, but we still want to select it
    }
    onMove(p: PointerPayload): void {
        // Run snapping and render hover 
        // Resolve snap context for the current tool
        this.currentSnap = this.snapEngine.snap(this.resolveSnapContext(this.baseSnapContext, p.world));
        this.snapOverlay.render(this.currentSnap);
    }
    onKeyDown(e: KeyboardEvent): void {
    }
    destruct(): void {
    }

    resolveSnapContext(context: SnapRuleContext, p: Vec2): SnapRuleContext {
        // Disable axis snapping for circles
        const resolvedContext = { ...context, p: p };
        resolvedContext.opts.enable = { ...resolvedContext.opts.enable, axisH: false, axisV: false, grid: false }

        return resolvedContext;
    }

    hitTestRect(a: Vec2, b: Vec2) {

    }
}
