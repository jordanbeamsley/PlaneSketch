import { FP_EPS } from "@/constants/Math";

export type Vec2 = {
    x: number,
    y: number
}

// Return new object, avoid passing reference
export function copyVec(p: Vec2): Vec2 {
    return { x: p.x, y: p.y }
}

export function compareVec(p1: Vec2, p2: Vec2): boolean {
    return (p1.x === p2.x && p1.y === p2.y)
}

/** 
 * Compare Vec2 with small epsilon tolerance 
 * Useful for suppressing floating point fuzz */
export function compareVecWithEps(p1: Vec2, p2: Vec2) {
    const dx = Math.abs(p1.x - p2.x);
    const dy = Math.abs(p1.y - p2.y);

    return (dx < FP_EPS && dy < FP_EPS);
}

// Return squared distance between two points
export function dist2(a: Vec2, b: Vec2) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return dx * dx + dy * dy
}
