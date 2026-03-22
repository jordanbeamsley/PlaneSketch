import { Container, Graphics, Point } from "pixi.js";
import { BaseTool, type PointerPayload, type ToolContext } from "./baseTool"
import type { SnapResult, SnapRuleContext } from "../snap/types";
import type { CommandId } from "../input/commands/defaultCommands";
import type { CommandContext } from "../input/commands/types";
import type { Tool } from "../models/tools/tools";
import type { Vec2 } from "../models/sketch/vectors";
import type { CircleId, NodeId, SegmentId } from "../models/sketch/ids";
import { parseRefKey, EntityRefs } from "../models/sketch/entityRef";
import type { EntityRef } from "../models/sketch/entityRef";

export class SelectTool extends BaseTool {
    private dragStartP: Point | null = null;
    private currentSnap: SnapResult;

    private marqueeGfx: Graphics;

    constructor(context: ToolContext, selectLayer: Container) {
        super(context);
        this.currentSnap = { kind: "none", p: { x: 0, y: 0 } };
        this.marqueeGfx = new Graphics();
        selectLayer.addChild(this.marqueeGfx);
    }

    getId(): Tool {
        return "select";
    }

    activate(): void {
    }

    onDown(e: PointerPayload): void {
        const selectStore = this.getSelect().getState();

        // Clear any current selections first, unless shift key is pressed
        if (!e.modifiers.shift) selectStore.clear;

        // If we're already snapped to a node or segment, then select it
        const snapKind = this.currentSnap.kind;
        if (snapKind === "node" || snapKind === "segment" || snapKind === "circle") {
            // Snap candidate ids are canonical refKey strings (e.g. "doc:node:abc")
            const snapKey = this.currentSnap.primary.id!;
            const entity = parseRefKey(snapKey);
            if (!entity) return;

            // If it's already in the select store then remove it
            if (selectStore.selected.has(snapKey)) selectStore.remove(entity);
            else selectStore.add(entity);
            return;
        }

        // If we're not snapped to anything, then start drawing select marquee
        this.dragStartP = e.world.clone();
    }

    onMove(p: PointerPayload): void {
        // We're currently drawing a marquee, draw the shape and ignore any hover effects
        if (this.dragStartP) {
            const x = Math.min(p.world.x, this.dragStartP.x);
            const y = Math.min(p.world.y, this.dragStartP.y);
            const w = Math.abs(p.world.x - this.dragStartP.x);
            const h = Math.abs(p.world.y - this.dragStartP.y);

            this.marqueeGfx.clear()
                .rect(x, y, w, h)
                .fill({ color: 0xf5ac58, alpha: 0.5 })
                .stroke({ color: 0xFF8A00, pixelLine: true });

            return;
        }

        this.currentSnap = this.snapEngine.snap(this.resolveSnapContext(this.baseSnapContext, p.world));

        const snapKind = this.currentSnap.kind;
        const selectStore = this.getSelect().getState();

        if (snapKind === "none" && selectStore.hovered)
            selectStore.setHovered(null);
        else if (snapKind === "node" || snapKind === "segment" || snapKind === "circle") {
            const entity = parseRefKey(this.currentSnap.primary.id!);
            if (entity) selectStore.setHovered(entity);
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

    resolveSnapContext(context: SnapRuleContext, p: Vec2): SnapRuleContext {
        // Disable axis snapping for circles
        const resolvedContext = { ...context, p: p };
        resolvedContext.opts.enable = { ...resolvedContext.opts.enable, axisH: false, axisV: false, grid: false }
        resolvedContext.opts.segmentMin = 0;

        return resolvedContext;
    }

    rectHitTest(p1: Point, p2: Point): void {
        const geometry = this.getGeometry().getState();

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
            const { incSids, incCids } = this.getGraph().getAllIncidents(nid);

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

        this.getSelect().getState().addMany(es);
    }

    executeCommand(_cmd: CommandId, _ctx: CommandContext): boolean {
        // no op yet
        return false;
    }

    destruct(): void {
    }
}
