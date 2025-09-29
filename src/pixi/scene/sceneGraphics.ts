import { NODE_COLOR, NODE_RADIUS, SEGMENT_STROKE } from "@/constants/drawing";
import type { GeometryLayers } from "@/models/stage";
import { useCircleStore } from "@/store/circleStore";
import { useNodeStore } from "@/store/nodeStore";
import { useSegmentStore } from "@/store/segmentStore";
import { Graphics } from "pixi.js";

export class SceneGraphics {
    private layers: GeometryLayers;
    private subs: Array<() => void> = [];

    private nodeGfx = new Map<string, Graphics>();
    private segGfx = new Map<string, Graphics>();
    private circleGfx = new Map<string, Graphics>();

    constructor(layers: GeometryLayers) {
        this.layers = layers;
    }

    mount() {
        this.rebuildAll();

        this.subs.push(
            useNodeStore.subscribe(
                (state) => state.byId,
                (state, prevState) => {
                    const withDelete = state.size < prevState.size;
                    this.syncNodes(withDelete);
                    this.syncSegments(withDelete);
                    this.syncCircles(withDelete);
                }
            )
        )
        this.subs.push(
            useSegmentStore.subscribe(
                (state) => state.byId,
                (state, prevState) => {
                    this.syncSegments(state.size < prevState.size);
                }
            )
        )
        this.subs.push(
            useCircleStore.subscribe(
                (state) => state.byId,
                (state, prevState) => {
                    this.syncCircles(state.size < prevState.size);
                }
            )
        )
    }

    umount() {
        this.subs.forEach(u => u());
        this.subs = [];

        // Destroy all graphics
        for (const g of this.nodeGfx.values()) g.destroy();
        for (const g of this.segGfx.values()) g.destroy();
        for (const g of this.circleGfx.values()) g.destroy();
        this.nodeGfx.clear();
        this.segGfx.clear();
        this.circleGfx.clear();
        this.layers.nodes.removeChildren();
        this.layers.edges.removeChildren();
        this.layers.preview.removeChildren();
    }

    rebuildAll() {
        this.syncNodes(true);
        this.syncSegments(true);
        this.syncCircles(true);
    }

    syncNodes(withDelete = false) {
        const nodes = useNodeStore.getState().byId;

        console.log(`${nodes.size} nodes in store`);

        for (const [id, n] of nodes) {
            let g = this.nodeGfx.get(id);
            if (!g) {
                g = this.makeNodeGfx();
                this.nodeGfx.set(id, g);
                this.layers.nodes.addChild(g);
            }

            // Reset node position
            // Eventually implement partial updates
            g.position.set(n.p.x, n.p.y);
        }

        if (withDelete) {
            for (const [id, g] of this.nodeGfx) {
                if (!nodes.has(id)) { g.destroy(); this.nodeGfx.delete(id); }
            }
        }
    }

    syncSegments(withDelete = false) {
        const segs = useSegmentStore.getState().byId;
        const nodes = useNodeStore.getState().byId;

        for (const [id, s] of segs) {
            const a = nodes.get(s.p1);
            const b = nodes.get(s.p2);

            // Should never happen, but handle edge case of dangling segment
            if (!a || !b) continue;

            let g = this.segGfx.get(id);
            if (!g) {
                g = this.makeSegGfx();
                this.segGfx.set(id, g);
                this.layers.edges.addChild(g);
            }

            // Redraw line
            // Eventually implement partial updates
            g?.clear()
                .moveTo(a.p.x, a.p.y)
                .lineTo(b.p.x, b.p.y)
                .stroke(SEGMENT_STROKE);
        }

        if (withDelete) {
            for (const [id, g] of this.segGfx) {
                if (!segs.has(id)) { g.destroy(); this.segGfx.delete(id); }
            }
        }
    }

    syncCircles(withDelete = false) {
        const circles = useCircleStore.getState().byId;
        const nodes = useNodeStore.getState().byId;

        for (const [id, c] of circles) {
            const a = nodes.get(c.center);

            // Should never happen, but handle edge case of dangling segment
            if (!a) continue;

            let g = this.circleGfx.get(id);
            if (!g) {
                g = this.makeCircleGfx();
                this.circleGfx.set(id, g);
                this.layers.edges.addChild(g);
            }

            // Redraw circle
            // Eventually implement partial updates
            g?.clear()
                .circle(a.p.x, a.p.y, c.radius)
                .stroke(SEGMENT_STROKE);
        }

        if (withDelete) {
            for (const [id, g] of this.circleGfx) {
                if (!circles.has(id)) { g.destroy(); this.circleGfx.delete(id); }
            }
        }

    }

    makeNodeGfx() {
        const g = new Graphics().circle(0, 0, NODE_RADIUS).fill(NODE_COLOR);
        g.eventMode = "none";
        return g;

    }

    makeSegGfx() {
        const g = new Graphics();
        g.eventMode = "none";
        return g;
    }

    makeCircleGfx() {
        const g = new Graphics();
        g.eventMode = "none";
        return g;
    }
}
