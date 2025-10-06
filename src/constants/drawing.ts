import type { StrokeStyle } from "pixi.js";

export const SNAP_RADIUS = 10;

export const SEGMENT_STROKE: StrokeStyle = {
    width: 1,
    color: 0xffffff,
    pixelLine: true
}

export const PREVIEW_SEGMENT_STROKE: StrokeStyle = {
    width: 1,
    color: 0xffffff,
    alpha: 0.8,
    pixelLine: true
}

export const NODE_RADIUS = 3;
export const NODE_COLOR = 0x0fffff;
