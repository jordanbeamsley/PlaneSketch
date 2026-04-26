import { Graphics, Point, type Container } from "pixi.js";
import type { PointerPayload, ToolContext } from "./baseTool";
import type { SnapResult, SnapRuleContext } from "../snap/types";
import { SNAP_RADIUS } from "../constants/drawing";
import { EntityRefs, parseRefKey, type EntityRef } from "../models/sketch/entityRef";
import type { CircleId, NodeId, SegmentId } from "../models/sketch/ids";

export type PickBehaviourOpts = {
    /**
     * Clear the entire selection when clicking empty space
     * true --> select tool behaviour (click empty = deselect all)
     * false --> constraint tool behaviour (accumulate, don't clear)
     */
    clearOnEmptyClick: boolean;

    /**
     * Optional filter called before hovering or selecting a snapped entity.
     * Return false to suppress the hover highlight and prevent selection.
     * Already-selected entities are always hoverable (to allow deselection).
     */
    canSelect?: (entity: EntityRef) => boolean;
};

/**
 * Encapsulates the geometry picking behaviour
 * i.e snap-hover, click-select/deselect, marquee selection
 *
 * Tools such as the general select tool or the constraint tool compose this
 */
export class PickBehaviour {
    private ctx: ToolContext;
    private opts: PickBehaviourOpts;
    private marqueeGfx: Graphics;
    private dragStartP: Point | null = null;
    private currentSnap: SnapResult;

    /** Snap context fixed for pick/ select mode: axis and grid snapping disabled */
    private snapCtx: SnapRuleContext;

    constructor(ctx: ToolContext, selectLayer: Container, opts: PickBehaviourOpts) {
        this.ctx = ctx;
        this.opts = opts;
        this.marqueeGfx = new Graphics();
        selectLayer.addChild(this.marqueeGfx);

        this.currentSnap = { kind: "none", p: { x: 0, y: 0 } }

        // Axis and grid snapping are construction only, not useful during picking
        // segmentMin: 0 lets cursors snap to segments right up to their endpoints.
        // Nodes should still have higher priority, so they won't be masked
        this.snapCtx = {
            p: { x: 0, y: 0 },
            ds: ctx.dataSource,
            viewport: ctx.viewport,
            opts: {
                radius: SNAP_RADIUS,
                enable: { axisH: false, axisV: false, grid: false },
                hysterisisMult: 1.5,
                segmentMin: 0
            }
        };
    }

    onDown(e: PointerPayload): void {
        const selectStore = this.ctx.getSelect().getState();

        if (this.opts.clearOnEmptyClick && !e.modifiers.shift) selectStore.clear();

        const snapKind = this.currentSnap.kind;
        if (snapKind === "node" || snapKind === "segment" || snapKind === "circle") {
            const snapKey = this.currentSnap.primary.id!;
            const entity = parseRefKey(snapKey);
            if (!entity) return;

            // If it's already in the select store then remove it, otherwise add if permitted
            if (selectStore.selected.has(snapKey)) selectStore.remove(entity);
            else if (!this.opts.canSelect || this.opts.canSelect(entity)) selectStore.add(entity);
            return;

        }

        // If we're not snapped to anything, then start drawing select marquee
        this.dragStartP = e.world.clone();
    }

    onMove(e: PointerPayload): void {
        // We're dragging a marquee, draw it and ignore snap/ hover effects
        if (this.dragStartP) {
            const x = Math.min(e.world.x, this.dragStartP.x);
            const y = Math.min(e.world.y, this.dragStartP.y);
            const w = Math.abs(e.world.x - this.dragStartP.x);
            const h = Math.abs(e.world.y - this.dragStartP.y);

            this.marqueeGfx.clear()
                .rect(x, y, w, h)
                .fill({ color: 0xf5ac58, alpha: 0.5 })
                .stroke({ color: 0xFF8A00, pixelLine: true });

            return;
        }

        this.currentSnap = this.ctx.snapEngine.snap({ ...this.snapCtx, p: e.world });

        const snapKind = this.currentSnap.kind;
        const selectStore = this.ctx.getSelect().getState();

        if (snapKind === "none") {
            if (selectStore.hovered) selectStore.setHovered(null);
        } else if (snapKind === "node" || snapKind === "segment" || snapKind === "circle") {
            const snapKey = this.currentSnap.primary.id!;
            const entity = parseRefKey(snapKey);
            const alreadySelected = entity && selectStore.selected.has(snapKey);
            const permitted = entity && (alreadySelected || !this.opts.canSelect || this.opts.canSelect(entity));
            if (permitted) selectStore.setHovered(entity);
            else if (selectStore.hovered) selectStore.setHovered(null);
        }
    }

    onUp(e: PointerPayload): void {
        // Check if we're drawing a marquee and that its not 0 area
        // Then run hit test
        if (this.dragStartP && (this.dragStartP.x !== e.world.x || this.dragStartP.y !== e.world.y)) {
            this.rectHitTest(this.dragStartP, e.world);
        }
        this.marqueeGfx.clear();
        this.dragStartP = null;
    }

    clear(): void {
        this.ctx.getSelect().getState().clear();
    }

    rectHitTest(p1: Point, p2: Point): void {
        const geometry = this.ctx.getGeometry().getState();

        // Find the bounding nodes of the hitbox
        const x1 = Math.min(p1.x, p2.x);
        const y1 = Math.min(p1.y, p2.y);
        const x2 = Math.max(p1.x, p2.x);
        const y2 = Math.max(p1.y, p2.y);

        // Grab store states once
        const nodes = geometry.nodes;
        const segments = geometry.segments;
        const circles = geometry.circles;

        // List of entities to be added to the selection
        const nodesInHitbox: Set<NodeId> = new Set();
        const segsInHitbox: Set<SegmentId> = new Set();
        const circlesInHitbox: Set<CircleId> = new Set();

        // Find all nodes contained within hitbox
        nodes.forEach(n => {
            if (n.p.x > x1 && n.p.y > y1 && n.p.x < x2 && n.p.y < y2) nodesInHitbox.add(n.id);
        });

        // For each node found, check if it has incident entities 
        nodesInHitbox.forEach(nid => {
            const { incSids, incCids } = this.ctx.getGraph().getAllIncidents(nid);

            // Check incident segments
            // Check if both nodes of the segment are in the hitbox, i.e they are in the node set
            for (const sid of incSids) {
                const s = segments.get(sid);
                if (!s) continue; // should never happen
                if (nodesInHitbox.has(s.p1) && nodesInHitbox.has(s.p2)) segsInHitbox.add(sid);
            }

            // Check incident circles
            // Check if radius is within hitbox
            for (const cid of incCids) {
                const c = circles.get(cid);
                if (!c) continue; // should never happen

                const { x, y } = nodes.get(c.centre)!.p;
                const r = c.radius;
                if ((x - r > x1) && (x + r < x2) && (y - r > y1) && (y + r < y2)) {
                    circlesInHitbox.add(cid);
                }
            }
        });

        // convert nids, sids into doc-scoped entity refs
        const es: Array<EntityRef> = [];
        nodesInHitbox.forEach(nid => es.push(EntityRefs.docNode(nid)));
        segsInHitbox.forEach(sid => es.push(EntityRefs.docSegment(sid)));
        circlesInHitbox.forEach(cid => es.push(EntityRefs.docCircle(cid)));

        this.ctx.getSelect().getState().addMany(es);
    }

    dispose(): void {
        this.marqueeGfx.destroy();
    }

}
