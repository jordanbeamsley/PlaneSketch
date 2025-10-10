import type { GridConfig } from "@/pixi/scene/sceneGrid";
import type { StrokeStyle } from "pixi.js";

export const ZOOM_STEP = 1.1;
export const MIN_SCALE = 0.05;
export const MAX_SCALE = 8;

export const DEFAULT_GRID_CONF: GridConfig = {
    axisColor: { x: 0xFC5C65, y: 0x48BB78 },
    axisWidth: 2,
    medianCellSize: 40,

    minorsPerMajor: 5,

    majorAlphaNearCombine: 0.7,
    majorAlphaMid: 0.6,
    majorAlphaNearSubdiv: 0.5,

    minorAlphaNearCombine: 0.05,
    minorAlphaMid: 0.10,
    minorAlphaNearSubdiv: 0.4
}

export const SNAP_ICON_SIZE = 20;
export const SNAP_STROKE: StrokeStyle = {
    width: 2,
    color: 0x34e5eb,
    // pixelLine: true
}
