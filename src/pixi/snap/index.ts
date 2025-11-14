import { SnapEngine } from "./engine";
import { axisRule, circleRule, gridRule, nodeRule, originRule, segmentRule } from "./rules";

export function createDefaultSnapEngine() {
    return new SnapEngine([
        nodeRule,
        axisRule,
        originRule,
        gridRule,
        segmentRule,
        circleRule
    ]);
}
