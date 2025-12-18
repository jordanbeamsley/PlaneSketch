import type { SolverFacade } from "@/gcs/gcsFacade";
import type { SolveStatus } from "@salusoft89/planegcs";

export class ConstraintEngine {
    private solver: SolverFacade;

    constructor(solver: SolverFacade) {
        this.solver = solver;
    }

    async solveFromDocument(doc: SketchDocument): Promise<SolveStatus> {
        const primitives = buildPrimitivesFromDocument(doc); // your adapter
        const status = await this.solver.solve(primitives);
        applySolutionToDocument(primitives, doc);
        return status;
    }
}
