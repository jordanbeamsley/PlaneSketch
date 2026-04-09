import type { SolverFacade } from "@/gcs/gcsFacade";
import type { SolveStatus } from "@salusoft89/planegcs";
import type { GeometryStore } from "../editor/stores/createGeometryStore";

export class ConstraintEngine {
    private solver: SolverFacade;
    private geometry: GeometryStore;

    constructor(solver: SolverFacade, geometry: GeometryStore) {
        this.solver = solver;
        this.geometry = geometry;
    }


}

