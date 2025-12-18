import type { ArcId, BlockDefId, BlockInstId, CircleId, NodeId, SegmentId } from "./ids";
import type { Vec2 } from "./vectors";

// ID and geometric only data-sources 
export interface NodeLite { id: string, p: Vec2 }
export interface SegmentLite { id: string, a: Vec2, b: Vec2 }
export interface CircleLite { id: string, centre: Vec2, rad: number }

// Eventually expand to include construction toggle, layer style, etc.
export type Node = {
    id: NodeId;
    p: Vec2;
}

export type Segment = {
    id: SegmentId;
    p1: NodeId;
    p2: NodeId;
}

export type Arc = {
    id: ArcId;
    center: NodeId;
    start: NodeId;
    end: NodeId;
    cw: boolean;
}

export type Circle = {
    id: CircleId;
    centre: NodeId;
    radius: number;
}


export type BlockInstance = {
    id: BlockInstId;
    defId: BlockDefId;
    transform: {
        tx: number;
        ty: number;
        rot?: number; // radians
        sx?: number;
        sy?: number;
    };
};
