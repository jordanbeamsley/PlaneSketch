import type { GeometryState } from "@/cad/editor/stores/createGeometryStore";
import type { SketchConstraint } from "@/cad/models/sketch/constraints";
import type { Vec2 } from "@/cad/models/sketch/vectors";
import type { SketchPrimitive } from "@salusoft89/planegcs";

/** 
 * Convert geometry store state into PlaneGCS primatives for solving 
 *
 * Base primatives must be defined before being used by higher order primatives and constraints
 * ie. Nodes must be defined in the SketchPrimitive array before they are referenced by segments, etc. 
 * */
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
                sketchPrims.push({ id: c.id, type: "p2p_coincident", p1_id: c.p1, p2_id: c.p2 });
                break;
            };
            case "horizontalSeg": {
                sketchPrims.push({ id: c.id, type: "horizontal_l", l_id: c.segId });
                break;
            };
            case "horizontalNodes": {
                sketchPrims.push({ id: c.id, type: "horizontal_pp", p1_id: c.p1, p2_id: c.p2 });
                break;
            }
            case "verticalSeg": {
                sketchPrims.push({ id: c.id, type: "vertical_l", l_id: c.segId });
                break;
            };
            case "verticalNodes": {
                sketchPrims.push({ id: c.id, type: "vertical_pp", p1_id: c.p1, p2_id: c.p2 });
                break;
            }
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
 * */
export function extractSolution(solved: SketchPrimitive[], geom: GeometryState): { nodePositions: Vec2, circleRadii: number } {

}
