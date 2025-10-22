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


// Return squared distance between two points
export function dist2(a: Vec2, b: Vec2) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return dx * dx + dy * dy
}
