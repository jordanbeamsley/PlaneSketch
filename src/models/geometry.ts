import type { Graphics } from "pixi.js";
import type { Vec2 } from "./vectors";

export interface Node {
    id: string;
    role: "vertex" | "centre" | "radius";
    p: Vec2;
    gfx: Graphics;
}

export interface Segment {
    id: string;
    n1: string;
    n2: string;
    gfx: Graphics;
}
