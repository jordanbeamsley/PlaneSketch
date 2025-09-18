export type Vec2 = {
    x: number,
    y: number
}

// Return new object, avoid passing reference
export function copyVec(p: Vec2): Vec2 {
    return { x: p.x, y: p.y }
}
