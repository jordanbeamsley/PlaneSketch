import type { GcsWrapper, SketchParam, SketchPrimitive, SolveStatus } from "@salusoft89/planegcs";
import { initGcsWrapper } from "./planeGcsWrapper";

export interface SolverFacade {
    solve(primitives: (SketchPrimitive | SketchParam)[]): Promise<SolveStatus>;
}

export class PlaneGcsSolver implements SolverFacade {
    private gcs: GcsWrapper;

    constructor(gcs: GcsWrapper) {
        this.gcs = gcs;
    }

    static async create(): Promise<PlaneGcsSolver> {
        const gcsWrapper = await initGcsWrapper();
        return new PlaneGcsSolver(gcsWrapper);

    }

    async solve(primitives: (SketchPrimitive | SketchParam)[]) {
        this.gcs.clear_data();
        this.gcs.push_primitives_and_params(primitives);
        const ok = this.gcs.solve();
        this.gcs.apply_solution();
        return ok;
    }
}
