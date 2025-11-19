import { compareVecWithEps, copyVec, dist2, type Vec2 } from "@/models/vectors";
import type { SnapCandidate, SnapRule } from "./types";
import { FP_EPS } from "@/constants/Math";

// Minimum distances before certain snaps kick in
const AXIS_MINIMUM = 40;
const SEGMENT_MINIMUM = 30;

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
                best = { kind: "node", p: copyVec(n.p), dist2: d2, id: n.id, priority: 200 }
            }
        }
        return best ? [best] : [];
    },
};

export const axisVRule: SnapRule = {
    name: "axisV",
    evaluate: ({ p, opts, viewport, axis }) => {
        // Return no candidates (empty array) if axis snapping is disabled
        // Or if no axis anchor provided
        if (opts.enable.axisV === false) return [];
        if (!axis?.anchor) return [];

        // tolerance, and x and y deltas for evaluation
        const at = viewport.worldToScreen(axis.anchor);
        const pt = viewport.worldToScreen(p);
        const dx = pt.x - at.x, dy = pt.y - at.y;
        const tol = opts.radius;

        // Don't enable axis snapping until a certain length line is drawn
        if (Math.abs(dx) <= tol && Math.abs(dy) > AXIS_MINIMUM) {
            return [{ kind: "axisV", p: { x: axis.anchor.x, y: p.y }, dist2: dx * dx, priority: 30 }];
        }
        return [];
    },
    validateAt: (p, { axis }) => {
        if (!axis?.anchor) return false;
        if (Math.abs(p.x - axis.anchor.x) < 1e-9) {
            return true;
        }

        return false;
    }
};

export const axisHRule: SnapRule = {
    name: "axisH",
    evaluate: ({ p, opts, viewport, axis }) => {
        // Return no candidates (empty array) if axis snapping is disabled
        // Or if no axis anchor provided
        if (opts.enable.axisH === false) return [];
        if (!axis?.anchor) return [];

        // tolerance, and x and y deltas for evaluation
        const at = viewport.worldToScreen(axis.anchor);
        const pt = viewport.worldToScreen(p);
        const dx = pt.x - at.x, dy = pt.y - at.y;
        const tol = opts.radius;

        // Don't enable axis snapping until a certain length line is drawn
        if (Math.abs(dy) <= tol && Math.abs(dx) > AXIS_MINIMUM) {
            return [{ kind: "axisH", p: { x: p.x, y: axis.anchor.y }, dist2: dy * dy, priority: 30 }];
        }
        return [];
    },
    validateAt: (p, { axis }) => {
        if (!axis?.anchor) return false;
        if (Math.abs(p.y - axis.anchor.y) < 1e-9) {
            return true;
        }

        return false;
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
    },
    validateAt(p) {
        const o: Vec2 = { x: 0, y: 0 };
        if (compareVecWithEps(o, p)) return true;
        return false;
    }
};

export const gridRule: SnapRule = {
    name: "grid",
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
    },
    validateAt: (p, { viewport }) => {
        const { gridOffsetX, gridOffsetY, gridStep } = viewport;

        // Convert world point → screen space
        const pt = viewport.worldToScreen(p);

        // Recompute which grid intersection pt *should* lie on
        const gx = Math.round((pt.x - gridOffsetX) / gridStep) * gridStep + gridOffsetX;
        const gy = Math.round((pt.y - gridOffsetY) / gridStep) * gridStep + gridOffsetY;

        if (Math.abs(pt.x - gx) > FP_EPS) return false;
        if (Math.abs(pt.y - gy) > FP_EPS) return false;

        return true;
    }
};

export const segmentRule: SnapRule = {
    name: "segment",
    evaluate: ({ p, ds, viewport, opts }) => {
        // Return no candidates (empty array) if segment snapping is disabled
        if (opts.enable.segment === false) return [];
        // Radius2 for evaluation
        const r = opts.radius;
        const r2 = r * r;

        const min = opts.segmentMin ?? SEGMENT_MINIMUM;
        const min2 = min * min;

        let best: SnapCandidate | undefined;

        const pt = viewport.worldToScreen(p);
        const { x: ptX, y: ptY } = pt;

        for (const s of ds.getSegments()) {
            const { x: x1, y: y1 } = viewport.worldToScreen(s.a);
            const { x: x2, y: y2 } = viewport.worldToScreen(s.b);

            // Reject snap if distance from cursor to either node end is less than segment snap minimum
            // Ideally this would check the distance along the line from either node end, but this is cheaper
            // May need some more finesse in the future
            if (dist2({ x: x1, y: y1 }, pt) < min2 || dist2({ x: x2, y: y2 }, pt) < min2) continue;

            // Vector from start to end node
            const dx = x2 - x1;
            const dy = y2 - y1;
            const len2 = dx * dx + dy * dy;

            // TODO: Profile early rejection performance

            // Early rejection if p is outside of lines bounding box + radius
            if (len2 === 0) continue;
            const minX = Math.min(x1, x2) - r;
            const maxX = Math.max(x1, x2) + r;
            const minY = Math.min(y1, y2) - r;
            const maxY = Math.max(y1, y2) + r;
            if (ptX < minX || ptX > maxX || ptY < minY || ptY > maxY) continue;

            // Find closest point on line segment
            let t = 0;
            if (len2 !== 0) {
                // Project cursor onto line segment (clamped to [0,1])
                t = ((ptX - x1) * dx + (ptY - y1) * dy) / len2;
                t = Math.max(0, Math.min(1, t));
            }

            // Closest point on segment
            const closestP: Vec2 = { x: x1 + t * dx, y: y1 + t * dy };

            const d2 = dist2(pt, closestP)

            if (d2 <= r2 && (!best || d2 < best.dist2)) {
                best = { kind: "segment", p: viewport.screenToWorld(closestP), dist2: d2, id: s.id, priority: 80 }
            }
        }
        return best ? [best] : [];
    }
};

export const circleRule: SnapRule = {
    name: "circle",
    evaluate: ({ p, ds, viewport, opts }) => {
        // Return no candidates (empty array) if circle snapping is disabled
        if (opts.enable.circle === false) return [];
        // Radius2 for evaluation
        const r = opts.radius;

        let best: SnapCandidate | undefined;

        // Cursor position in screen space
        const pt = viewport.worldToScreen(p);

        for (const c of ds.getCircles()) {

            // Circle properties in screen space
            const ct = viewport.worldToScreen(c.centre);
            const radt = viewport.worldScale * c.rad;

            // Radius bounds for snapping
            const min2 = (radt - r) * (radt - r);
            const max2 = (radt + r) * (radt + r);

            // Distance from centre of circle to point
            const d2 = dist2(pt, ct);
            const d = Math.sqrt(d2);

            // Reject
            if (d2 < min2 || d2 > max2) continue;

            // Unit vector from circle center to point
            const dxu = (pt.x - ct.x) / d;
            const dyu = (pt.y - ct.y) / d;

            // Closest point on circle
            const closestP: Vec2 = { x: ct.x + radt * dxu, y: ct.y + radt * dyu };

            // Evaluation dist
            const closestDist2 = dist2(closestP, pt);

            if (!best || closestDist2 < best.dist2) {
                best = { kind: "circle", p: viewport.screenToWorld(closestP), dist2: closestDist2, id: c.id, priority: 80 }
            }
        }
        return best ? [best] : [];
    }
}
