import type { Graphics } from "pixi.js";

export interface Node {
    id: string;
    shapeId: number;
    role: "vertex" | "centre" | "radius";
    x: number;
    y: number;
    gfx: Graphics;
}