import { Graphics, Point, type Container } from "pixi.js";
import type { PointerPayload, ToolContext } from "./baseTool";
import { EntityRefs, type EntityRef } from "../models/sketch/entityRef";
import type { CircleId, NodeId, SegmentId } from "../models/sketch/ids";
import type { SnapOutcome } from "../snap/snapService";
import type { Modifiers } from "../input/pointer/types";

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
 * i.e snap-hover, click-select / deselect, marquee selection
 *
 * Tools such as the general select tool or the constraint tool compose this.
 * Snapping itself lives in SnapService 
 */
export class PickBehaviour {
    /** Label for scoping in the select tool */
    readonly behaviour = "pick";

    private ctx: ToolContext;
    private opts: PickBehaviourOpts;
    private marqueeGfx: Graphics;
    private dragStartP: Point | null = null;

    constructor(ctx: ToolContext, selectLayer: Container, opts: PickBehaviourOpts) {
        this.ctx = ctx;
        this.opts = opts;
        this.marqueeGfx = new Graphics();
        selectLayer.addChild(this.marqueeGfx);

    }

    onDown(s: SnapOutcome, m: Modifiers): void {
        const selectStore = this.ctx.getSelect().getState();

        if (this.opts.clearOnEmptyClick && !m.shift) selectStore.clear();

        const entity = s.primary?.ref;
        if (entity) {
            // If it's already in the select store then remove it, otherwise add if permitted
            if (selectStore.isSelected(entity)) selectStore.remove(entity);
            else if (!this.opts.canSelect || this.opts.canSelect(entity)) selectStore.add(entity);
            return;
        }

        // If we're not snapped to an entity, then start drawing select marquee
        this.dragStartP = new Point(s.p.x, s.p.y);
    }

    onMove(e: PointerPayload): void {
        // We're dragging a marquee, draw it and ignore hover effects
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

        const selectStore = this.ctx.getSelect().getState();
        const entity = this.ctx.getSnap().primary?.ref;

        if (!entity) {
            if (selectStore.hovered) selectStore.setHovered(null);
            return;
        }

        const alreadySelected = selectStore.isSelected(entity);
        const permitted = alreadySelected || !this.opts.canSelect || this.opts.canSelect(entity);

        if (permitted) selectStore.setHovered(entity);
        else if (selectStore.hovered) selectStore.setHovered(null);
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
