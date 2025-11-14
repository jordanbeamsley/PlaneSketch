import { NODE_COLOR, NODE_RADIUS, SEGMENT_STROKE } from "@/constants/drawing";
import type { GeometryLayers } from "@/models/stage";
import { useCircleStore } from "@/store/circleStore";
import { useNodeStore } from "@/store/nodeStore";
import { useSegmentStore } from "@/store/segmentStore";
import { useViewportStore } from "@/store/viewportStore";
import { Graphics } from "pixi.js";
import { scaleFromTicks } from "../camera/zoomQuantizer";
import { useSelectStore } from "@/store/selectStore";
import type { GraphIndex } from "../graph/graphIndex";

const SEG_SELECT_TINT = 0xFF8A00;
const SEG_NORMAL_TINT = 0xFFFFFF;
const SEG_HOVER_TINT = 0xf5ac58;
const NODE_SELECT_TINT = 0xFF8A00;
const NODE_NORMAL_TINT = NODE_COLOR;
const NODE_HOVER_TINT = 0xf5ac58;
const CIRCLE_SELECT_TINT = 0xFF8A00;
const CIRCLE_NORMAL_TINT = 0xFFFFFF;
const CIRCLE_HOVER_TINT = 0xf5ac58;


// TODO: 
// Only touch graphics on diffs, not full updates
export class SceneGraphics {
    private layers: GeometryLayers;
    private graph: GraphIndex;

    private unsubs: Array<() => void> = [];

    private nodeGfx = new Map<string, Graphics>();
    private segGfx = new Map<string, Graphics>();
    private circleGfx = new Map<string, Graphics>();

    constructor(layers: GeometryLayers, graphIndex: GraphIndex) {
        this.layers = layers;
        this.graph = graphIndex;
    }

    mount() {
        this.rebuildAll();

        this.unsubs.push(
            useViewportStore.subscribe(
                (state) => state.zoomTicks,
                (state, _prevState) => {
                    this.rescaleNodes(state);
                }
            )
        )

        this.unsubs.push(
            useSelectStore.subscribe(
                (state) => state.selected,
                (state) => {
                    this.applySelectionTints(state);
                }
            )
        )

        this.unsubs.push(
            useSelectStore.subscribe(
                (state) => state.hovered,
                (state, prevState) => {
                    this.applyHover(state, prevState);
                }
            )
        )

        this.unsubs.push(
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
        this.unsubs.push(
            useSegmentStore.subscribe(
                (state) => state.byId,
                (state, prevState) => {
                    this.syncSegments(state.size < prevState.size);
                    this.syncNodeDegrees();
                }
            )
        )
        this.unsubs.push(
            useCircleStore.subscribe(
                (state) => state.byId,
                (state, prevState) => {
                    this.syncCircles(state.size < prevState.size);
                }
            )
        )
    }

    unmount() {
        this.unsubs.forEach(u => u());
        this.unsubs = [];

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

    syncNodeDegrees() {
        const nodes = useNodeStore.getState().byId;

        for (const [id] of nodes) {
            let g = this.nodeGfx.get(id);
            if (!g) continue;

            // If degrees on node > 2, then don't render
            g.visible = this.graph.getSegDegree(id) < 2;
        }
    }

    rescaleNodes(zoomTicks: number) {
        const nodes = useNodeStore.getState().byId;

        const s = scaleFromTicks(zoomTicks);
        const nodeScale = 1 / s;

        for (const [id] of nodes) {
            let g = this.nodeGfx.get(id);
            if (!g) continue;

            g.scale.set(nodeScale);
        }
    }

    applySelectionTints(selected: Set<String>) {
        for (const [id, g] of this.nodeGfx) {
            const k = `node:${id}`;
            if (selected.has(k)) {
                g.tint = NODE_SELECT_TINT;
                // May be hidden if degree > 2, however always show when selected
                g.visible = true;
            } else {
                g.tint = NODE_NORMAL_TINT;
                g.visible = this.graph.getSegDegree(id) < 2;
            }
        }
        for (const [id, g] of this.segGfx) {
            const k = `segment:${id}`;
            g.tint = selected.has(k) ? SEG_SELECT_TINT : SEG_NORMAL_TINT;
        }
        for (const [id, g] of this.circleGfx) {
            const k = `circle:${id}`;
            g.tint = selected.has(k) ? SEG_SELECT_TINT : SEG_NORMAL_TINT;
        }
    }

    applyHover(currEntity: string | null, prevEntity: string | null) {
        if (prevEntity) {
            const [kind, id] = prevEntity.split(":");

            const selected = useSelectStore.getState().selected.has(prevEntity);

            if (kind === "node") {
                const g = this.nodeGfx.get(id);
                if (g) {
                    g.tint = (selected) ? NODE_SELECT_TINT : NODE_NORMAL_TINT;
                    g.visible = selected || this.graph.getSegDegree(id) < 2;
                }
            }

            else if (kind === "segment") {
                const g = this.segGfx.get(id);
                if (g) g.tint = (selected) ? SEG_SELECT_TINT : SEG_NORMAL_TINT;
            }

            else if (kind === "circle") {
                const g = this.circleGfx.get(id);
                if (g) g.tint = selected ? CIRCLE_SELECT_TINT : CIRCLE_NORMAL_TINT;
            }
        }

        if (currEntity) {
            const [kind, id] = currEntity.split(":");

            if (kind === "node") {
                const g = this.nodeGfx.get(id);
                if (g) {
                    g.tint = NODE_HOVER_TINT;
                    // Node might be invisible if degree > 2
                    // Always show on hover
                    g.visible = true;
                }
            }

            else if (kind === "segment") {
                const g = this.segGfx.get(id);
                if (g) g.tint = SEG_HOVER_TINT;
            }

            else if (kind === "circle") {
                const g = this.circleGfx.get(id);
                if (g) g.tint = CIRCLE_HOVER_TINT;
            }
        }
    }

    syncNodes(withDelete = false) {
        const nodes = useNodeStore.getState().byId;
        const zoomTicks = useViewportStore.getState().zoomTicks;

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

        this.rescaleNodes(zoomTicks);
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
        const g = new Graphics().circle(0, 0, NODE_RADIUS).fill(0xffffff);
        g.tint = NODE_NORMAL_TINT;
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
