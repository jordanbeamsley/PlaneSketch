import { SnapEngine } from "./engine";
import { axisRule, nodeRule } from "./rules";

export function createDefaultSnapEngine() {
    return new SnapEngine([
        nodeRule,
        axisRule
    ]);
}
