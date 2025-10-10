import { SnapEngine } from "./engine";
import { axisRule, gridRule, nodeRule, originRule } from "./rules";

export function createDefaultSnapEngine() {
    return new SnapEngine([
        nodeRule,
        axisRule,
        originRule,
        gridRule
    ]);
}
