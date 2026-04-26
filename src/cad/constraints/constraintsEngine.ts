import type { SolverFacade } from "@/gcs/gcsFacade";
import type { ConstraintStore } from "../editor/stores/createConstraintStore";
import type { GeometryStore } from "../editor/stores/createGeometryStore";
import { buildSketchPrimatives, extractSolution } from "@/gcs/sketchAdapter";
import { SolveStatus } from "@salusoft89/planegcs";

export class ConstraintEngine {
    /** Guard to prevent write triggering read loop */
    private isSolving = false;
    /** Unsub callbacks to call on unmount */
    private subs: Array<() => void> = [];

    geometry: GeometryStore;
    constraints: ConstraintStore;
    solver: SolverFacade;

    constructor(geometry: GeometryStore, constraints: ConstraintStore, solver: SolverFacade) {
        this.geometry = geometry;
        this.constraints = constraints;
        this.solver = solver;

        this.subs.push(
            constraints.subscribe(s => s.constraints, () => this.solve())
        );

        this.subs.push(
            geometry.subscribe(s => s.nodes, () => this.solve())
        )
    }

    solve(): void {
        if (this.isSolving) return;
        const constraints = this.constraints.getState().toArray()
        if (constraints.length === 0) return;

        this.isSolving = true;

        try {
            const primitives = buildSketchPrimatives(this.geometry.getState(), constraints);
            console.log(primitives);
            const solveState = this.solver.solve(primitives);
            if (solveState.status === SolveStatus.Failed) return;

            const solution = extractSolution(solveState.solvedPrimatives, this.geometry.getState());

            this.geometry.getState().updateNodePositions(solution.nodePositions);
            this.geometry.getState().updateCircleRadii(solution.circleRadii);
        } finally {
            this.isSolving = false;
        }
    }

    dispose(): void {
        this.subs.forEach(u => u());
    }
}
