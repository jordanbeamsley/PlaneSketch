import { Graphics } from "pixi.js";
import type { Shape } from "../../models/shapes";
import type { Node } from "../../models/node";

const NODE_SIZE = 3;

export function generateNodesForShape(s: Shape): Node[] {
    const makeGfx = (x: number, y: number) =>
        new Graphics().circle(x, y, NODE_SIZE).fill(0xfffff);

    if (s.kind === "rect") {
        const {x1, y1, x2, y2} = s.geometryData;
        return [
            {id: `${s.id}@0`, shapeId: s.id, role: "vertex", x: x1, y: y1, gfx: makeGfx(x1, y1)},
            {id: `${s.id}@1`, shapeId: s.id, role: "vertex", x: x2, y: y1, gfx: makeGfx(x2, y1)},
            {id: `${s.id}@2`, shapeId: s.id, role: "vertex", x: x2, y: y2, gfx: makeGfx(x2, y2)},
            {id: `${s.id}@3`, shapeId: s.id, role: "vertex", x: x1, y: y2, gfx: makeGfx(x1, y2)}
        ];
    }

    if (s.kind === "line") {
        const {x1, y1, x2, y2} = s.geometryData;
        return [
            {id: `${s.id}@0`, shapeId: s.id, role: "vertex", x: x1, y: y1, gfx: makeGfx(x1, y1)},
            {id: `${s.id}@1`, shapeId: s.id, role: "vertex", x: x2, y: y2, gfx: makeGfx(x2, y2)}
        ];
    }

    if (s.kind === "circle") {
        const {cx, cy, r} = s.geometryData;
        return [
            {id: `${s.id}@0`, shapeId: s.id, role: "centre", x: cx, y: cx, gfx: makeGfx(cx, cy)},
        ];
    } 

    return [];
}