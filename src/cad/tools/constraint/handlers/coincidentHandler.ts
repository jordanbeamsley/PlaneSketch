import type { CoincidentConstraint } from "@/cad/models/sketch/constraints";
import type { ConstraintHandler, ConstraintSelection } from "../types";

export class CoincidentHandler implements ConstraintHandler {
    tryBuild({ nodes, segments }: ConstraintSelection): CoincidentConstraint[] | null {

        if (nodes.size > 1) {
            const [base, ...rest] = nodes;
            return rest.map(p2 => ({
                id: crypto.randomUUID(),
                kind: "coincident",
                target: { kind: "nodes", p1: base, p2: p2 }
            }));
        }

        if (segments.size = 1) {
            const [...segs] = segments;
            return segs.map((segId) => ({
                id: crypto.randomUUID(),
                kind: "vertical",
                target: { kind: "segment", segId: segId }
            }));
        }

        return null;
    }
}
