import type { Vec2 } from "@/models/vectors";
import { useNodeStore } from "@/store/nodeStore";

export interface SnapOptions {
    radius: number;
    hysterisisLeaveMult?: number;
};

export type SnapResult =
    | { kind: "none" }
    | { kind: "node", nodeId: string, x: number, y: number }
    | { kind: "midpoint", edgeId: string, x: number, y: number }

export class SnapEngine {
    // Eventually will implement RTree, for now, just return the full node list
    getNearByNodes(p: Vec2) {
        p;
        return useNodeStore.getState().nodes;
    }
    snap(p: Vec2, opts: SnapOptions) {

        const rad2 = opts.radius * opts.radius;

        // Prioritise nodes first
        const nodes = this.getNearByNodes(p);
        let bestNode: { id: string, x: number, y: number, dist2: number } | undefined;
        for (const node of nodes) {
            const dist2 = (p.x - node.p.x) ** 2 + (p.y - node.p.y) ** 2;
            if (dist2 <= rad2 && (!bestNode || dist2 < bestNode.dist2)) bestNode = { id: node.id, x: node.p.x, y: node.p.y, dist2: dist2 };
        }
        // return bestNode...

        // 
    }
}
