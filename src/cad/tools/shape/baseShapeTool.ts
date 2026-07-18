import { BaseTool, type PointerPayload, type ToolContext } from "../baseTool";
import type { SnapRuleContext } from "@/cad/snap/types";
import { useViewportStore } from "@/shared/store/viewportStore";
import type { CommandId } from "@/cad/input/commands/defaultCommands";
import type { CommandContext } from "@/cad/input/commands/types";
import { copyVec, type Vec2 } from "@/cad/models/sketch/vectors";
import type { Node } from "@/cad/models/sketch/primitives";
import type { SnapOutcome } from "@/cad/snap/snapService";
import type { Modifiers } from "@/cad/input/pointer/types";



export abstract class BaseShapeTool extends BaseTool {

    // Different tools require a different number of anchors to define geometry
    // e.g lines = start + end, arc = center + start + end
    // Once required nodes has been reached, geometry is committed to store
    // Each tool must override this property
    protected totalRequiredAnchors: number;

    // Store preview anchors in an array
    protected anchors: Node[];

    protected lastPointerScreen: Vec2 = { x: 0, y: 0 };

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
    abstract postCreate(p: Vec2, snap: SnapOutcome): void;
    abstract getSnapContext(base: SnapRuleContext, p: Vec2): SnapRuleContext;

    constructor(context: ToolContext) {
        super(context);
        this.totalRequiredAnchors = 0;
        this.anchors = [];
    }

    activate(): void {
        this.unsubZoom = useViewportStore.subscribe(
            (state) => state.zoomTicks,
            (state, _prevState) => {
                this.rescaleNodes(state);
            }
        )

        // Clear selection when changing tools
        this.getSelect().getState().clear();
    }

    onDown(s: SnapOutcome, _m: Modifiers) {

        const id = s.primary?.ref ? s.primary.ref.id : this.nid();

        // Push preview anchors to array, then check if we're at total required anchors to completely define geometry
        // If not, then return
        // Each tools on move handler will use anchors to construct preview geometry
        this.anchors.push({ id: id, p: copyVec(s.p) });
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
        this.postCreate(s.p, s);
    }

    public onMove(e: PointerPayload): void {
        // First check if we are actually drawing
        // If we are, then delegate to tools onMove to render preview
        if (this.anchors.length > 0) {
            this.onMoveDraw(e.world);
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
        //this.ticker.remove(this.onTick, this);
    }
}
