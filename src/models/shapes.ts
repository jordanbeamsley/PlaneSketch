import type { Graphics } from "pixi.js";
import type { Vec2 } from "./vectors";

export type ShapeKind = "line" | "rect" | "circle";

interface BaseShape {
    id: number;
    gfx: Graphics;
}

export interface LineShape extends BaseShape {
    kind: "line";
    geometryData: {
        p1: Vec2;
        p2: Vec2;
    };
}

export interface CircleShape extends BaseShape {
    kind: "circle";
    geometryData: {
        c: Vec2;
        r: number;
    };
}

export interface RectShape extends BaseShape {
    kind: "rect";
    geometryData: {
        p1: Vec2;
        p2: Vec2;
    }
}

export type Shape = LineShape | CircleShape | RectShape;
