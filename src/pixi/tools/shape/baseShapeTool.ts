import { type FederatedPointerEvent } from "pixi.js";
import { copyVec, type Vec2 } from "@/models/vectors";
import { BaseTool, type ToolContext } from "../baseTool";
import type { SnapResult } from "@/pixi/snap/types";
import type { Node } from "@/models/geometry";

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

    abstract onMoveDraw(p: Vec2): void;
    abstract isZeroSize(): boolean;
    abstract commitGeometry(): void;
    abstract discardGeometry(): void;
    abstract postCreate(p: Vec2, isSnapped: boolean): void;

    constructor(context: ToolContext) {
        super(context);
        this.totalRequiredAnchors = 0;
        this.anchors = [];
        this.currentSnap = { kind: "none", p: { x: 0, y: 0 } };
    }

    onDown(_e: FederatedPointerEvent) {
        // If we're snapped to a node, then use the existing nodes ID
        // When committing geometry to store, the existing node ID will be used for segments
        const snap = this.currentSnap;
        const id = (snap.kind === "node" && snap.id) ? snap.id : this.nid();

        // Push preview anchors to array, then check if we're at total required anchors to completely define geometry
        // If not, then return
        // Each tools on move handler will use anchors to construct preview geometry
        this.anchors.push({ id: id, p: copyVec(snap.p) });
        if (this.anchors.length < this.totalRequiredAnchors) {
            return;
        }

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
        this.postCreate(snap.p, this.currentSnap.kind !== "none");
    }

    public onMove(e: FederatedPointerEvent): void {
        let p: Vec2 = e.global;

        // Call snap engine against current cursor position
        this.currentSnap = this.snapEngine.snap({ ...this.resolvedSnapContext, p: p })
        this.snapOverlay.render(this.currentSnap);


        // First check if we are actually drawing
        // If we are, then delegate to tools onMove to render preview
        if (this.anchors.length > 0) {
            this.onMoveDraw(this.currentSnap.p);
        }
    }

    public onKeyDown(e: KeyboardEvent): void {
        switch (e.key) {
            // Abort current preview shapes
            case "q": {
                this.discardGeometry();
                break;
            }
            default: break;
        }
    }

    public destruct(): void {
        this.discardGeometry();
    }
}
