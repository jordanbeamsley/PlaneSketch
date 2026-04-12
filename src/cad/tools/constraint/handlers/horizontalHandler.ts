import type { HorizontalConstraint } from "@/cad/models/sketch/constraints";
import type { ConstraintHandler, ConstraintSelection } from "../types";

export class HorizontalHandler implements ConstraintHandler {
    tryBuild({ nodes, segments }: ConstraintSelection): HorizontalConstraint[] | null {
        if (segments.size > 1) {
            const [...segs] = segments;
            return segs.map((segId) => ({
                id: crypto.randomUUID(),
                kind: "horizontal",
                target: { kind: "segment", segId: segId }
            }));
        }

        if (nodes.size >= 2) {
            const [base, ...rest] = nodes;
            return rest.map(p2 => ({
                id: crypto.randomUUID(),
                kind: "horizontal",
                target: { kind: "nodes", p1: base, p2: p2 },
            }));
        }

        return null;
    }
}
