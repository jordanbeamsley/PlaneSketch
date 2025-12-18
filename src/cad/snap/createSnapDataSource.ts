import type { EditorSession } from "../editor/session/editorSession";
import type { DocumentStore } from "../editor/stores/createDocumentStore";
import type { CircleLite, NodeLite, SegmentLite } from "../models/sketch/primitives";
import type { Vec2 } from "../models/sketch/vectors";
import type { SnapDataSource } from "./types";

type EntityKind = "node" | "segment" | "circle";

function docKey(kind: EntityKind, id: string) {
    return `doc:${kind}:${id}`;
}

function blockKey(instId: string, defId: string, kind: EntityKind, id: string) {
    return `block:${instId}:${defId}:${kind}:${id}`;
}

function transformPoint(p: Vec2, t: { tx: number, ty: number, rot?: number, sx?: number, sy?: number }) {
    const sx = t.sx ?? 1;
    const sy = t.sy ?? 1;
    const rot = t.rot ?? 0;

    const x0 = p.x * sx;
    const y0 = p.y * sy;

    const c = Math.cos(rot);
    const s = Math.sin(rot);

    return { x: x0 * c - y0 * s + t.tx, y: x0 * s + y0 * c + t.ty };
}

function transformRadius(r: number, t: { sx?: number; sy?: number }) {
    // Pick sx if set, else sy, else 1.
    // If you later allow non-uniform scaling, circles become ellipses.
    return r * (t.sx ?? t.sy ?? 1);
}
export function createSnapDataSource(args: {
    getSession: () => EditorSession;
    docs: DocumentStore
}): SnapDataSource {
    return {
        *getNodes(): Iterable<NodeLite> {
            const session = args.getSession();
            const geom = session.geometry.getState();

            // Active session nodes (doc scope)
            for (const n of geom.nodes.values()) {
                yield { id: docKey("node", n.id), p: n.p };
            }

            // Only main session can see block instances when snapping
            if (session.ref.kind !== "main") return;

            for (const inst of geom.blockInstances.values()) {
                const def = args.docs.getState().getBlock(inst.defId);
                if (!def) return;

                for (const n of def.sketch.nodes) {
                    yield {
                        id: blockKey(inst.id, inst.defId, "node", n.id),
                        p: transformPoint(n.p, inst.transform)
                    }
                }
            }
        },

        *getSegments(): Iterable<SegmentLite> {
            const session = args.getSession();
            const geom = session.geometry.getState();

            // Active session segments (doc scope)
            for (const s of geom.segments.values()) {
                const a = geom.nodes.get(s.p1);
                const b = geom.nodes.get(s.p2);

                if (!a || !b) continue;
                yield { id: docKey("segment", s.id), a: a.p, b: b.p };
            }

            // Only main session can see block instances when snapping
            if (session.ref.kind !== "main") return;

            for (const inst of geom.blockInstances.values()) {
                const def = args.docs.getState().getBlock(inst.defId);
                if (!def) return;

                for (const s of def.sketch.segments) {
                    const a = geom.nodes.get(s.p1);
                    const b = geom.nodes.get(s.p2);

                    if (!a || !b) continue;

                    yield {
                        id: blockKey(inst.id, inst.defId, "segment", s.id),
                        a: transformPoint(a.p, inst.transform),
                        b: transformPoint(b.p, inst.transform)
                    }
                }
            }
        },

        *getCircles(): Iterable<CircleLite> {
            const session = args.getSession();
            const geom = session.geometry.getState();

            // Active session segments (doc scope)
            for (const c of geom.circles.values()) {
                const centre = geom.nodes.get(c.centre);

                if (!centre) continue;
                yield { id: docKey("circle", c.id), centre: centre.p, rad: c.radius };
            }

            // Only main session can see block instances when snapping
            if (session.ref.kind !== "main") return;

            for (const inst of geom.blockInstances.values()) {
                const def = args.docs.getState().getBlock(inst.defId);
                if (!def) return;

                for (const c of def.sketch.circles) {
                    const centre = geom.nodes.get(c.centre);

                    if (!centre) continue;

                    yield {
                        id: blockKey(inst.id, inst.defId, "circle", c.id),
                        centre: transformPoint(centre.p, inst.transform),
                        rad: transformRadius(c.radius, inst.transform)
                    }
                }
            }

        }
    }
}
