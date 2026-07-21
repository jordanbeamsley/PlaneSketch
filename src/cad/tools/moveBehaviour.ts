import { MoveNodesCommand } from "../input/commands/stateful/transform";
import type { Modifiers } from "../input/pointer/types";
import type { NodeId } from "../models/sketch/ids";
import { copyVec, type Vec2 } from "../models/sketch/vectors";
import { EntityRefs, type EntityRef } from "../models/sketch/entityRef";
import type { SnapOutcome } from "../snap/snapService";
import type { PointerPayload, ToolContext } from "./baseTool";

/**
 * Encapsulates the geometry moving behaviour
 * i.e dragging select entities
 *
 * Tools such as the general select tool compose this
 */
export class MoveBehaviour {
    /** Label for scoping in the select tool */
    readonly behaviour = "move";

    private ctx: ToolContext;

    // Raw selection as returned by the store — kept as-is so nothing has to be
    // reconstructed later; SelectTool.getSnapContext resolves these to refKeys itself
    private selected: EntityRef[] = [];
    private selectedNodes: Set<NodeId> = new Set();

    // Snapshot of node positions at drag start
    // Every move is computed relative to this, never incrementally off the live position
    // deltas don't compound and command has a clear before and after state
    private before: Map<NodeId, Vec2> = new Map();

    private dragStart: Vec2 = { x: 0, y: 0 };

    constructor(ctx: ToolContext) {
        this.ctx = ctx;
    }

    /** Entities the snap engine should exclude while a drag is active (empty otherwise):
     * whatever's directly selected, plus the constituent nodes of any selected segment/circle
     * (those don't already have an EntityRef anywhere, so they're the only ones built fresh). */
    get excluded(): EntityRef[] {
        const derived = Array.from(this.selectedNodes, EntityRefs.docNode);
        return [...this.selected, ...derived];
    }

    onDown(s: SnapOutcome, _m: Modifiers): void {
        // Reset in case a previous gesture never reached onUp (tool switch, escape, etc.)
        this.selectedNodes = new Set();
        this.before = new Map();

        // Compile node set from selection,
        // This is what actually "moves", segments, circle, etc. just reference the node positions
        this.selected = this.ctx.getSelect().getState().getSelected();
        const geometry = this.ctx.getGeometry().getState();

        this.selected.forEach((e) => {
            if (e.kind === "node") this.selectedNodes.add(e.id);
            if (e.kind === "segment") {
                const seg = geometry.segments.get(e.id);
                if (!seg) return;
                this.selectedNodes.add(seg.p1);
                this.selectedNodes.add(seg.p2);
            }
            if (e.kind === "circle") {
                const circle = geometry.circles.get(e.id);
                if (!circle) return;
                this.selectedNodes.add(circle.centre);
            }
        });

        this.selectedNodes.forEach((n) => {
            const node = geometry.nodes.get(n);
            if (node) this.before.set(n, copyVec(node.p));
        });

        // Record drag start position
        // All moves reference the start position (not iterative), so history manager gets one action
        this.dragStart = s.p;
    }

    onMove(e: PointerPayload): void {
        const dx = e.world.x - this.dragStart.x;
        const dy = e.world.y - this.dragStart.y;

        const newNodePositions: Map<NodeId, Vec2> = new Map();

        this.before.forEach((p, n) => {
            newNodePositions.set(n, {
                x: p.x + dx,
                y: p.y + dy,
            });
        });

        this.ctx.getGeometry().getState().updateNodePositions(newNodePositions);
    }

    onUp(_e: PointerPayload): void {
        const geometry = this.ctx.getGeometry().getState();

        // Read the live (already solver-relaxed) positions rather than recomputing
        // before + delta, so the committed state matches exactly what was last previewed
        const after: Map<NodeId, Vec2> = new Map();
        this.before.forEach((_p, n) => {
            const node = geometry.nodes.get(n);
            if (node) after.set(n, copyVec(node.p));
        });

        const cmd = new MoveNodesCommand(this.before, after);
        this.ctx.getHistory().execute(cmd);

        this.selected = [];
        this.selectedNodes.clear();
        this.before.clear();
    }
}
