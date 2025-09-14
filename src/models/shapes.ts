import type { Graphics } from "pixi.js";

export type ShapeKind = "line" | "rect" | "circle";

interface BaseShape {
    id: number;
    gfx: Graphics;
}

export interface LineShape extends BaseShape {
    kind: "line";
    geometryData: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    };
}

export interface CircleShape extends BaseShape {
    kind: "circle";
    geometryData: {
        cx: number;
        cy: number;
        r: number;
    };
}

export interface RectShape extends BaseShape {
    kind: "rect";
    geometryData: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    }
}

export type Shape = LineShape | CircleShape | RectShape;