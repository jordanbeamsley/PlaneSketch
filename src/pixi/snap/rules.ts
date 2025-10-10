import { copyVec, type Vec2 } from "@/models/vectors";
import type { SnapCandidate, SnapRule } from "./types";
import { dist2 } from "./math";

export const nodeRule: SnapRule = {
    name: "node",
    evaluate: ({ p, ds, viewport, opts }) => {
        // Return no candidates (empty array) if node snapping is disabled
        if (opts.enable.node === false) return [];
        // Radius2 for evaluation
        const r2 = opts.radius * opts.radius;

        let best: SnapCandidate | undefined;

        const pt = viewport.worldToScreen(p);

        for (const n of ds.getNodes()) {
            const nt = viewport.worldToScreen(n.p);
            const d2 = dist2(pt, nt);
            if (d2 <= r2 && (!best || d2 < best.dist2)) {
                best = { kind: "node", p: copyVec(n.p), dist2: d2, id: n.id, priority: 100 }
            }
        }
        return best ? [best] : [];
    }
};

export const axisRule: SnapRule = {
    name: "axis",
    evaluate: ({ p, opts, viewport, axis }) => {
        // Return no candidates (empty array) if axis snapping is disabled
        // Or if no axis anchor provided
        if (opts.enable.axisH === false && opts.enable.axisV === false) return [];
        if (!axis?.anchor) return [];

        // tolerance, and x and y deltas for evaluation
        const at = viewport.worldToScreen(axis.anchor);
        const pt = viewport.worldToScreen(p);
        const dx = pt.x - at.x, dy = pt.y - at.y;
        const tol = opts.radius;

        const candidates: SnapCandidate[] = [];
        // Don't enable axis snapping until a certain length line is drawn
        if (opts.enable.axisH !== false && Math.abs(dy) <= tol && Math.abs(dx) > 40) {
            candidates.push({ kind: "axisH", p: { x: p.x, y: axis.anchor.y }, dist2: dy * dy, priority: 40 })
        }
        if (opts.enable.axisV !== false && Math.abs(dx) <= tol && Math.abs(dy) > 40) {
            candidates.push({ kind: "axisV", p: { x: axis.anchor.x, y: p.y }, dist2: dx * dx, priority: 40 })
        }
        return candidates;
    }
};

export const originRule: SnapRule = {
    name: "origin",
    evaluate: ({ p, viewport, opts }) => {
        // Return no candidates (empty array) if origin snapping is disabled
        if (opts.enable.origin === false) return [];
        // Radius2 for evaluation
        const r2 = opts.radius * opts.radius;

        // Origin point in world space
        const o: Vec2 = { x: 0, y: 0 };

        const pt = viewport.worldToScreen(p);
        const ot = viewport.worldToScreen(o);

        const d2 = dist2(pt, ot);

        if (d2 <= r2) return [{ kind: "origin", p: copyVec(o), dist2: d2, priority: 100 }]
        else return [];
    }
};

export const gridRule: SnapRule = {
    name: "origin",
    evaluate: ({ p, viewport, opts }) => {
        // Return no candidates (empty array) if grid snapping is disabled
        if (opts.enable.grid === false) return [];
        // Radius2 for evaluation
        const r2 = opts.radius * opts.radius;

        const pt = viewport.worldToScreen(p);
        const { gridOffsetX, gridOffsetY, gridStep } = viewport;

        const gx = Math.round((pt.x - gridOffsetX) / gridStep) * gridStep + gridOffsetX;
        const gy = Math.round((pt.y - gridOffsetY) / gridStep) * gridStep + gridOffsetY;

        const dx = pt.x - gx, dy = pt.y - gy;
        const d2 = dx * dx + dy * dy;

        const pw = viewport.screenToWorld({ x: gx, y: gy });
        if (d2 <= r2) return [{ kind: "grid", p: pw, dist2: d2, priority: 10 }]
        else return [];
    }
}
