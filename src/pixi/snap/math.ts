import type { Vec2 } from "@/models/vectors";

// Return squared distance between two points
export function dist2(a: Vec2, b: Vec2) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return dx * dx + dy * dy
}
