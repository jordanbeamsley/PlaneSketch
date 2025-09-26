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
