import { SnapEngine } from "./engine";
import { axisRule, nodeRule, originRule } from "./rules";

export function createDefaultSnapEngine() {
    return new SnapEngine([
        nodeRule,
        axisRule,
        originRule
    ]);
}
