import type { ResidualPolicy, SnapKind } from "./types";

const RS = (...k: SnapKind[]) => new Set<SnapKind>(k);

export const allowedResiduals: ResidualPolicy = {
    none: RS(), // N/a
    node: RS(),
    segment: RS("axisH", "axisV", "grid"),
    midpoint: RS(),
    axisH: RS("segment", "perpendicular", "origin", "grid"),
    axisV: RS("segment", "perpendicular", "origin", "grid"),
    perpendicular: RS("segment", "axisH", "axisV", "grid", "origin"),
    origin: RS(),
    grid: RS(),
    circle: RS("axisH", "axisV", "grid", "origin", "perpendicular")
}
