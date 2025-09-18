import { Graphics } from "pixi.js";
import type { Shape } from "../../models/shapes";
import type { Node } from "../../models/node";
import type { Vec2 } from "@/models/vectors";

const NODE_SIZE = 3;

export function generateNodesForShape(s: Shape): Node[] {
    const makeGfx = (p: Vec2) => {
        const nodeGfx = new Graphics().circle(p.x, p.y, NODE_SIZE).fill(0x0fffff);
        nodeGfx.eventMode = "none";
        return nodeGfx;
    }

    if (s.kind === "rect") {
        const { p1, p2 } = s.geometryData;
        return [
            { id: `${s.id}@0`, shapeId: s.id, role: "vertex", p: { x: p1.x, y: p1.y }, gfx: makeGfx({ x: p1.x, y: p1.y }) },
            { id: `${s.id}@1`, shapeId: s.id, role: "vertex", p: { x: p2.x, y: p1.y }, gfx: makeGfx({ x: p2.x, y: p1.y }) },
            { id: `${s.id}@2`, shapeId: s.id, role: "vertex", p: { x: p2.x, y: p2.y }, gfx: makeGfx({ x: p2.x, y: p2.y }) },
            { id: `${s.id}@3`, shapeId: s.id, role: "vertex", p: { x: p1.x, y: p2.y }, gfx: makeGfx({ x: p1.x, y: p2.y }) }
        ];
    }

    if (s.kind === "line") {
        const { p1, p2 } = s.geometryData;
        return [
            { id: `${s.id}@0`, shapeId: s.id, role: "vertex", p: { x: p1.x, y: p1.y }, gfx: makeGfx({ x: p1.x, y: p1.y }) },
            { id: `${s.id}@1`, shapeId: s.id, role: "vertex", p: { x: p2.x, y: p2.y }, gfx: makeGfx({ x: p1.x, y: p2.y }) }
        ];
    }

    if (s.kind === "circle") {
        const { c } = s.geometryData;
        return [
            { id: `${s.id}@0`, shapeId: s.id, role: "centre", p: c, gfx: makeGfx(c) },
        ];
    }

    return [];
}
