import { copyVec, type Vec2 } from "@/models/vectors";
import type { SnapCandidate, SnapRule } from "./types";
import { dist2 } from "./math";

export const nodeRule: SnapRule = {
    name: "node",
    evaluate: ({ p, ds, opts }) => {
        // Return no candidates (empty array) if node snapping is disabled
        if (opts.enable.node === false) return [];
        // Radius2 for evaluation
        const r2 = opts.radius * opts.radius;

        let best: SnapCandidate | undefined;

        const pt = (opts.transform) ? opts.transform(p) : p;

        for (const n of ds.getNodes()) {
            const nt = (opts.transform) ? opts.transform(n.p) : n.p;
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
    evaluate: ({ p, opts, axis }) => {
        // Return no candidates (empty array) if axis snapping is disabled
        // Or if no axis anchor provided
        if (opts.enable.axisH === false && opts.enable.axisV === false) return [];
        if (!axis?.anchor) return [];

        // tolerance, and x and y deltas for evaluation
        const at = (opts.transform) ? opts.transform(axis.anchor) : axis.anchor;
        const pt = (opts.transform) ? opts.transform(p) : p;
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
    evaluate: ({ p, opts }) => {
        // Return no candidates (empty array) if origin snapping is disabled
        if (opts.enable.origin === false) return [];
        // Radius2 for evaluation
        const r2 = opts.radius * opts.radius;

        // Origin point in world space
        const o: Vec2 = { x: 0, y: 0 };

        const pt = (opts.transform) ? opts.transform(p) : p;
        const ot = (opts.transform) ? opts.transform(o) : o;

        const d2 = dist2(pt, ot);

        if (d2 <= r2) return [{ kind: "origin", p: copyVec(o), dist2: d2, priority: 100 }]
        else return []
    }
};
