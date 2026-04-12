import type { VerticalConstraint } from "@/cad/models/sketch/constraints";
import type { ConstraintHandler, ConstraintSelection } from "../types";

export class VerticalHandler implements ConstraintHandler {
    tryBuild({ nodes, segments }: ConstraintSelection): VerticalConstraint[] | null {
        if (segments.size > 1) {
            const [...segs] = segments;
            return segs.map((segId) => ({
                id: crypto.randomUUID(),
                kind: "vertical",
                target: { kind: "segment", segId: segId }
            }));
        }

        if (nodes.size >= 2) {
            const [base, ...rest] = nodes;
            return rest.map(p2 => ({
                id: crypto.randomUUID(),
                kind: "vertical",
                target: { kind: "nodes", p1: base, p2: p2 },
            }));
        }

        return null;
    }
}
