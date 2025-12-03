import { copyVec, dist2, type Vec2 } from "@/models/vectors";
import { BaseTool, type PointerPayload, type ToolContext } from "../baseTool";
import type { SnapCandidate, SnapResult, SnapRuleContext } from "@/pixi/snap/types";
import type { Node } from "@/models/geometry";
import { useViewportStore } from "@/store/viewportStore";
import type { CommandId } from "@/pixi/input/commands/defaultCommands";
import type { CommandContext } from "@/pixi/input/commands/types";
import type { Ticker } from "pixi.js";
import { RESIDUAL_DWELL_MS, RESIDUAL_MAX_DRIFT_PX2 } from "@/constants/tools";

interface residualDwellState {
    /** Last residual candidate from snap engine */
    pending?: Omit<SnapCandidate, "dist2">;
    /** Screen space anchor where dwell started */
    anchorScreen?: Vec2;
    /** Start time from when residual was first returned */
    startedAtMs: number;
    active: boolean;
}

export abstract class BaseShapeTool extends BaseTool {

    // Different tools require a different number of anchors to define geometry
    // e.g lines = start + end, arc = center + start + end
    // Once required nodes has been reached, geometry is committed to store
    // Each tool must override this property
    protected totalRequiredAnchors: number;

    // Store preview anchors in an array
    protected anchors: Node[];

    // Store the current snap position from the OnMove handler
    // Pass this into the onDown handler so that final geometry uses the snapped position
    protected currentSnap: SnapResult;

    // Shared ticker passed in from stage.
    // Used to track residual dwell
    protected ticker: Ticker;

    protected lastPointerScreen: Vec2 = { x: 0, y: 0 };

    protected residualDwell: residualDwellState = {
        startedAtMs: 0,
        active: false
    }

    // May want to append an identifier to the start of the UUID in the future
    nid = () => crypto.randomUUID();
    sid = () => crypto.randomUUID();
    cid = () => crypto.randomUUID();

    // Unsub from zoom ticks when destruct is called
    private unsubZoom: () => void = () => { };

    abstract rescaleNodes(zoomTicks: number): void;
    abstract onMoveDraw(p: Vec2): void;
    abstract isZeroSize(): boolean;
    abstract commitGeometry(): void;
    abstract discardGeometry(): void;
    abstract postCreate(p: Vec2, snap: SnapResult): void;
    abstract resolveSnapContext(context: SnapRuleContext, p: Vec2): SnapRuleContext;

    constructor(context: ToolContext) {
        super(context);
        this.totalRequiredAnchors = 0;
        this.anchors = [];
        this.currentSnap = { kind: "none", p: { x: 0, y: 0 } };
        this.ticker = context.ticker;

        this.ticker.add(this.onTick, this);
        this.ticker.start();
    }

    activate(): void {
        this.unsubZoom = useViewportStore.subscribe(
            (state) => state.zoomTicks,
            (state, _prevState) => {
                this.rescaleNodes(state);
            }
        )
    }

    onDown(_e: PointerPayload) {
        // If we're snapped to a node, then use the existing nodes ID
        // When committing geometry to store, the existing node ID will be used for segments
        const snap = this.currentSnap;
        const id = (snap.kind === "node" && snap.primary.id) ? snap.primary.id : this.nid();

        const p = (this.residualDwell.active) ? this.residualDwell.pending!.p : snap.p;

        // Push preview anchors to array, then check if we're at total required anchors to completely define geometry
        // If not, then return
        // Each tools on move handler will use anchors to construct preview geometry
        this.anchors.push({ id: id, p: copyVec(p) });
        if (this.anchors.length < this.totalRequiredAnchors) {
            this.isInOperation = true;
            return;
        }

        this.isInOperation = false;

        // If we get here, then geometry has been fully defined
        // First check if geometry is zero size (e.g line.start = line.end)
        // If it is, discard it and return
        if (this.isZeroSize()) {
            this.discardGeometry();
            return;
        }

        // Finally, call tools handler for committing geometry to store
        // Then call any post create steps (e.g in line tool, immediately start drawing new line)
        this.commitGeometry();
        this.postCreate(p, this.currentSnap);
    }

    public onMove(e: PointerPayload): void {
        let p: Vec2 = e.world;
        this.lastPointerScreen = this.viewport.worldToScreen(p);

        // If we already have a first point, use it as the axis anchor (for H and V snapping)
        const hasAnchor = this.anchors.length > 0;

        // Run snapping and render hover 
        // Resolve snap context for the current tool
        const res = this.snapEngine.snap(this.resolveSnapContext(this.baseSnapContext, p));

        this.currentSnap = res;

        let snappedP = p;

        if (res.kind === "none") {
            this.clearDwell();
            this.snapOverlay.render(res);
        } else {
            // Dont render residual if the dwell is not active
            if (!this.residualDwell.active || !res.residual) {
                this.snapOverlay.render({
                    kind: res.kind,
                    p: res.p,
                    primary: res.primary,
                    residual: undefined
                });
                snappedP = res.p;
            } else {
                this.snapOverlay.render(res);
                snappedP = res.residual.p;
            }
        }

        if (res.kind !== "none") {
            if (res.residual) {
                this.updateDwellCandidate(res.residual, this.viewport.worldToScreen(p));
            } else {
                this.clearDwell();
            }
        }


        // First check if we are actually drawing
        // If we are, then delegate to tools onMove to render preview
        if (hasAnchor) {
            this.onMoveDraw(snappedP);
        }
    }

    public onUp(_e: PointerPayload): void {
        //no op
    }

    private updateDwellCandidate(residual: Omit<SnapCandidate, "dist2">, screenP: Vec2) {
        const pending = this.residualDwell.pending;

        // If kind or position changed significantly --> reset dwell
        if (
            !pending ||
            pending.kind !== residual.kind ||
            dist2(screenP, pending.p) > RESIDUAL_MAX_DRIFT_PX2
        ) {
            this.residualDwell.pending = residual;
            this.residualDwell.anchorScreen = copyVec(screenP);
            this.residualDwell.startedAtMs = performance.now();
            this.residualDwell.active = false;
        }
    }

    private onTick() {
        // If there is no pending residual, or if its already active, do nothing
        if (!this.residualDwell.pending || this.residualDwell.active) return;

        // Reject if residual has not been pending for cutoff
        const now = performance.now();
        const elapsed = now - this.residualDwell.startedAtMs;
        if (elapsed < RESIDUAL_DWELL_MS) return;

        const currScreen = this.lastPointerScreen;
        const anchor = this.residualDwell.anchorScreen;
        if (!anchor) return;

        // Check if cursor is still within residual hitbox
        if (dist2(currScreen, anchor) < RESIDUAL_MAX_DRIFT_PX2) {
            // Dwell satisfied, enable residual
            this.residualDwell.active = true;

            const res = this.currentSnap;
            const pending = this.residualDwell.pending;
            if (res.kind !== "none" && pending) {
                const p = pending.p;
                // Redraw preview at residual position
                if (this.anchors.length > 0) this.onMoveDraw(p);

                // Render both primary + residual
                this.snapOverlay.render(res);
            }
        } else {
            // Cursor moved too much, clear dwell
            this.clearDwell();
        }
    }

    private clearDwell() {
        this.residualDwell = { startedAtMs: 0, active: false };
    }

    executeCommand(cmd: CommandId, _ctx: CommandContext): boolean {
        switch (cmd) {
            case "tool.cancel": {
                this.isInOperation = false;
                this.discardGeometry();
                return true;
            }
            default: return false;
        }
    }

    public destruct(): void {
        this.discardGeometry();
        this.unsubZoom();
        this.ticker.remove(this.onTick, this);
    }
}
