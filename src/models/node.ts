import type { Graphics } from "pixi.js";
import type { Vec2 } from "./vectors";

export interface Node {
    id: string;
    shapeId: number;
    role: "vertex" | "centre" | "radius";
    p: Vec2;
    gfx: Graphics;
}
