import { copyVec, type Vec2 } from "@/models/vectors";
import { BaseTool, type PointerPayload, type ToolContext } from "../baseTool";
import type { SnapResult, SnapRuleContext } from "@/pixi/snap/types";
import type { Node } from "@/models/geometry";
import { useViewportStore } from "@/store/viewportStore";
import type { CommandId } from "@/pixi/input/commands/defaultCommands";
import type { CommandContext } from "@/pixi/input/commands/types";

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

        // Push preview anchors to array, then check if we're at total required anchors to completely define geometry
        // If not, then return
        // Each tools on move handler will use anchors to construct preview geometry
        this.anchors.push({ id: id, p: copyVec(snap.p) });
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
        this.postCreate(snap.p, this.currentSnap);
    }

    public onMove(e: PointerPayload): void {
        let p: Vec2 = e.world;

        // If we already have a first point, use it as the axis anchor (for H and V snapping)
        const hasAnchor = this.anchors.length > 0;

        // Run snapping and render hover 
        // Resolve snap context for the current tool
        this.currentSnap = this.snapEngine.snap(this.resolveSnapContext(this.baseSnapContext, p));
        this.snapOverlay.render(this.currentSnap);


        // First check if we are actually drawing
        // If we are, then delegate to tools onMove to render preview
        if (hasAnchor) {
            this.onMoveDraw(this.currentSnap.p);
        }
    }

    public onUp(_e: PointerPayload): void {
        //no op
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
    }
}
