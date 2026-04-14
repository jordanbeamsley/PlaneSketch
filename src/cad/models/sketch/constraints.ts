import type { EntityKind } from "./entityRef";
import type { CircleId, NodeId, SegmentId } from "./ids";

export type ConstraintKind = "coincident" | "horizontal" | "vertical";

export type BaseConstraint = {
    id: string;
    kind: ConstraintKind;
};



export interface CoincidentConstraint extends BaseConstraint {
    kind: "coincident";
    target:
    | { kind: "nodes", p1: NodeId, p2: NodeId }
    | { kind: "nodesOnSegement", p: NodeId, s: SegmentId }
    | { kind: "nodesOnCircle", p: NodeId, c: CircleId }
};

export interface OrthoSegmentTarget {
    kind: "segment";
    s: SegmentId;
}

export interface OrthoNodesTarget {
    kind: "nodes";
    p1: NodeId;
    p2: NodeId;
}

export interface HorizontalConstraint extends BaseConstraint {
    kind: "horizontal";
    target: OrthoSegmentTarget | OrthoNodesTarget;
};

export interface VerticalConstraint extends BaseConstraint {
    kind: "vertical";
    target: OrthoSegmentTarget | OrthoNodesTarget;
};


/** Geometric constraints on sketch entities */
export type SketchConstraint =
    | CoincidentConstraint
    | HorizontalConstraint
    | VerticalConstraint


export type Operator = ">=" | "<=" | "==" | ">" | "<";

/** 
* One single geometry condition that must be fulfilled for a constraint to be valid
*
* These conditions may be chained in OR or AND operations to build a complete defintion
* */
export interface GeometryCondition {
    geomKind: EntityKind;
    operator: Operator;
    count: number;
}

/** A single AND group of constraint conditions */
export type ConditionGroup = GeometryCondition[];

export interface ConstraintRequirements {
    /** A constraint is excluded (greyed out) if ANY of the AND groups conditions are met */
    exclude: ConditionGroup[];

    /** 
    * A constraint is valid if ANY of the AND groups conditions are met 
    *
    * This does not garantee a valid solve from the GCS, but it does mean an attempt can be made */
    required: ConditionGroup[];
}

export const CONSTRAINT_REQS: Record<ConstraintKind, ConstraintRequirements> = {

    horizontal: {
        exclude: [
            [{ geomKind: "circle", operator: ">=", count: 1 }],
            [{ geomKind: "arc", operator: ">=", count: 1 }],
            [{ geomKind: "segment", operator: ">=", count: 1 }, { geomKind: "node", operator: ">=", count: 1 }]
        ],
        required: [
            [{ geomKind: "segment", operator: ">=", count: 1 }],
            [{ geomKind: "node", operator: ">=", count: 1 }]
        ]
    },

    vertical: {
        exclude: [
            [{ geomKind: "circle", operator: ">=", count: 1 }],
            [{ geomKind: "arc", operator: ">=", count: 1 }]
        ],
        required: [
            [{ geomKind: "segment", operator: ">=", count: 1 }],
            [{ geomKind: "node", operator: ">=", count: 1 }]
        ]
    },

    // Coincident constraints can be applied to any number of nodes, and a single edge type primitives
    // e.g (segments, circles, arcs).
    // 
    // If any two edge primitives are selected, then coincident constraint should be excluced
    coincident: {
        exclude: [
            [{ geomKind: "circle", operator: ">=", count: 2 }],
            [{ geomKind: "segment", operator: ">=", count: 2 }],
            [{ geomKind: "arc", operator: ">=", count: 2 }],
            [{ geomKind: "circle", operator: "==", count: 1 }, { geomKind: "segment", operator: "==", count: 1 }],
            [{ geomKind: "circle", operator: "==", count: 1 }, { geomKind: "arc", operator: "==", count: 1 }],
            [{ geomKind: "segment", operator: "==", count: 1 }, { geomKind: "arc", operator: "==", count: 1 }],
        ],
        required: [
            [{ geomKind: "node", operator: ">=", count: 2 }],
            [{ geomKind: "node", operator: "==", count: 1 }, { geomKind: "circle", operator: "==", count: 1 }],
            [{ geomKind: "node", operator: "==", count: 1 }, { geomKind: "segment", operator: "==", count: 1 }],
            [{ geomKind: "node", operator: "==", count: 1 }, { geomKind: "arc", operator: "==", count: 1 }],
        ]
    }
}

/** Evaluate if for the given geometry set, the constraint type should be:
 *   - excluded (greyed out),
 *   - incomplete (not greyed out, but doesn't fully define a constraint yet),
 *   - complete (selection can fully define a constraint)
 * 
 * For now, I only envision this applying to the current geometry selection,
 * however, its somewhat abstracted from the selection store, as there may be a scenario
 * where some different collection of geometry is evaluated */
export function evaluateConstraintGeom(selection: Record<EntityKind, number>, constraint: ConstraintKind): "complete" | "incomplete" | "excluded" {

    // A ConditionGroup is valid when ALL its conditions match (AND)
    const matches = (group: ConditionGroup) => {
        return group.every(({ geomKind, operator, count }) => {
            const actual = selection[geomKind] ?? 0;
            if (operator === ">=") return actual >= count;
            if (operator === "<=") return actual <= count;
            if (operator === "==") return actual === count;
            if (operator === ">") return actual > count;
            if (operator === "<") return actual < count;
        });
    }

    // Exclude is triggered if ANY group fully matches 
    // always takes precedent
    if (CONSTRAINT_REQS[constraint].exclude.some(matches)) return "excluded";

    // Required is satisfied if ANY group fully matches
    if (CONSTRAINT_REQS[constraint].required.some(matches)) return "complete";

    // If not excluded, but not fully defined (complete), then incomplete
    return "incomplete";
}
