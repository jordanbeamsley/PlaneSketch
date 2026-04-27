import type { SolverFacade } from "@/gcs/gcsFacade";
import type { ConstraintStore } from "../editor/stores/createConstraintStore";
import type { GeometryStore } from "../editor/stores/createGeometryStore";
import { buildSketchPrimatives, extractSolution } from "@/gcs/sketchAdapter";
import { SolveStatus } from "@salusoft89/planegcs";
import { notifications } from "@/shared/notifications";

export class ConstraintEngine {
    /** Guard to prevent write triggering read loop */
    private isSolving = false;
    /** When paused, reactive subscriptions queue a single deferred solve instead of solving immediately */
    private isPaused = false;
    private pendingSolve = false;
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

    pause(): void { this.isPaused = true; }

    resume(): void {
        this.isPaused = false;
        if (this.pendingSolve) {
            this.pendingSolve = false;
            this.solve();
        }
    }

    solve(): void {
        if (this.isPaused) { this.pendingSolve = true; return; }
        if (this.isSolving) return;
        const constraints = this.constraints.getState().toArray()
        if (constraints.length === 0) return;

        this.isSolving = true;

        try {
            const primitives = buildSketchPrimatives(this.geometry.getState(), constraints);
            const solveState = this.solver.solve(primitives);
            if (solveState.status === SolveStatus.Failed) {
                notifications.warning("Constraint could not be solved");
                return;
            }

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
