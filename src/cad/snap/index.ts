import { SnapEngine } from "./engine";
import { axisHRule, axisVRule, circleRule, gridRule, nodeRule, originRule, segmentRule } from "./rules";

export function createDefaultSnapEngine() {
    return new SnapEngine([
        nodeRule,
        axisHRule,
        axisVRule,
        originRule,
        gridRule,
        segmentRule,
        circleRule
    ]);
}
