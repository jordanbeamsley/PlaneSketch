import type { CoincidentConstraint, HorizontalConstraint, VerticalConstraint } from "@/cad/models/sketch/constraints";
import type { ConstraintHandler } from "./types";
import type { idsByKind } from "@/cad/editor/stores/createSelectionStore";

export class CoincidentHandler implements ConstraintHandler {
    build({ node }: idsByKind): CoincidentConstraint[] | null {

        if (node.size > 1) {
            const [base, ...rest] = node;
            return rest.map(p2 => ({
                id: crypto.randomUUID(),
                kind: "coincident",
                target: { kind: "nodes", p1: base, p2: p2 }
            }));
        }

        return null;
    }
}

export class HorizontalHandler implements ConstraintHandler {
    build({ node, segment }: idsByKind): HorizontalConstraint[] | null {
        if (segment.size > 1) {
            const [...segs] = segment;
            return segs.map((segId) => ({
                id: crypto.randomUUID(),
                kind: "horizontal",
                target: { kind: "segment", s: segId }
            }));
        }

        if (node.size >= 2) {
            const [base, ...rest] = node;
            return rest.map(p2 => ({
                id: crypto.randomUUID(),
                kind: "horizontal",
                target: { kind: "nodes", p1: base, p2: p2 },
            }));
        }

        return null;
    }
}

export class VerticalHandler implements ConstraintHandler {
    build({ node, segment }: idsByKind): VerticalConstraint[] | null {
        if (segment.size >= 1) {
            const [...segs] = segment;
            return segs.map((segId) => ({
                id: crypto.randomUUID(),
                kind: "vertical",
                target: { kind: "segment", s: segId }
            }));
        }

        if (node.size >= 2) {
            const [base, ...rest] = node;
            return rest.map(p2 => ({
                id: crypto.randomUUID(),
                kind: "vertical",
                target: { kind: "nodes", p1: base, p2: p2 },
            }));
        }

        return null;
    }
}
