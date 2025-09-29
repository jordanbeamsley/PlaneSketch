import type { Vec2 } from "./vectors";

export type NodeId = string;
export type SegmentId = string;
export type ArcId = string;
export type CircleId = string;

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
    center: NodeId;
    radius: NodeId;
}

