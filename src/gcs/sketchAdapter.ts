import type { GeometryState } from "@/cad/editor/stores/createGeometryStore";
import type { SketchConstraint } from "@/cad/models/sketch/constraints";
import type { CircleId, NodeId } from "@/cad/models/sketch/ids";
import type { Vec2 } from "@/cad/models/sketch/vectors";
import type { SketchPrimitive } from "@salusoft89/planegcs";

/** 
 * This lives outside of the cad/ directory as it is the interface between native types
 * and those of the GCS. If we ever change the GCS model, the internals of cad stay the same.
 */

/** 
 * Convert geometry store state into PlaneGCS primatives for solving 
 *
 * Base primatives must be defined before being used by higher order primatives and constraints
 * ie. Nodes must be defined in the SketchPrimitive array before they are referenced by segments, etc. 
 */
export function buildSketchPrimatives(geometry: GeometryState, constraints: SketchConstraint[]): SketchPrimitive[] {
    let sketchPrims: SketchPrimitive[] = [];

    // TODO: Revisit when we have a way to fix nodes
    geometry.nodes.forEach((n) => {
        sketchPrims.push({ id: n.id, type: "point", x: n.p.x, y: n.p.y, fixed: false });
    });

    geometry.segments.forEach((s) => {
        sketchPrims.push({ id: s.id, type: "line", p1_id: s.p1, p2_id: s.p2 });
    })

    geometry.circles.forEach((c) => {
        sketchPrims.push({ id: c.id, type: "circle", c_id: c.centre, radius: c.radius });
    })

    constraints.forEach((c) => {
        switch (c.kind) {
            case "coincident": {
                const target = c.target.kind;
                if (target === "nodes")
                    sketchPrims.push({ id: c.id, type: "p2p_coincident", p1_id: c.target.p1, p2_id: c.target.p2 });
                else if (target === "nodesOnSegement")
                    sketchPrims.push({ id: c.id, type: "point_on_line_pl", p_id: c.target.p, l_id: c.target.s });
                else if (target === "nodesOnCircle")
                    sketchPrims.push({ id: c.id, type: "point_on_circle", p_id: c.target.p, c_id: c.target.c });
                break;
            };
            case "horizontal": {
                const target = c.target.kind;
                if (target === "nodes")
                    sketchPrims.push({ id: c.id, type: "horizontal_pp", p1_id: c.target.p1, p2_id: c.target.p2 });
                else if (target === "segment")
                    sketchPrims.push({ id: c.id, type: "horizontal_l", l_id: c.target.s });
                break;
            };
            case "vertical": {
                const target = c.target.kind;
                if (target === "nodes")
                    sketchPrims.push({ id: c.id, type: "vertical_pp", p1_id: c.target.p1, p2_id: c.target.p2 });
                else if (target === "segment")
                    sketchPrims.push({ id: c.id, type: "vertical_l", l_id: c.target.s });
                break;
            };

            default: {
                break;
            }
        }

    })

    return sketchPrims;
}

/** 
 * Decompose the solution offered by PlaneGCS back into native types 
 *
 * Only return the changed valules to keep the applyGCSsolution diff minimal
 */
export function extractSolution(solvedPrimatives: SketchPrimitive[], geom: GeometryState): { nodePositions: Map<NodeId, Vec2>, circleRadii: Map<CircleId, number> } {
    console.log(solvedPrimatives)
}
