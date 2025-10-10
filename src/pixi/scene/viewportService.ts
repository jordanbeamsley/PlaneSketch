import { DEFAULT_GRID_CONF } from "@/constants/canvas";
import type { Vec2 } from "@/models/vectors";

export type PointTransform = (p: Vec2) => Vec2;

export interface Viewport {
    // Transforms
    worldToScreen: PointTransform;
    screenToWorld: PointTransform;

    // Grid spacing in screen space 
    // spacing is always uniform, i.e stepX === stepY
    gridStep: number;

    // Grid offset in screen space
    gridOffsetX: number;
    gridOffsetY: number;
}

export class ViewportService implements Viewport {
    // Functions injected from PixiStage
    worldToScreen!: PointTransform;
    screenToWorld!: PointTransform;

    gridStep = DEFAULT_GRID_CONF.medianCellSize;
    gridOffsetX = 0;
    gridOffsetY = 0;

    setTransform(worldToScreen: PointTransform, screenToWorld: PointTransform) {
        this.worldToScreen = worldToScreen;
        this.screenToWorld = screenToWorld;
    }

    setGrid(params: { step: number, offsetX: number, offsetY: number }) {
        this.gridStep = params.step;
        this.gridOffsetX = params.offsetX;
        this.gridOffsetY = params.offsetY;
    }
}
