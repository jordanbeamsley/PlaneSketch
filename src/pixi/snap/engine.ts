import { copyVec, type Vec2 } from "@/models/vectors";
import { useNodeStore } from "@/store/nodeStore";

export interface SnapOptions {
    radius: number;
    hysterisisLeaveMult?: number;
};

export type SnapResult =
    | { kind: "none" }
    | { kind: "node", nodeId: string, p: Vec2 }
    | { kind: "midpoint", edgeId: string, p: Vec2 }

export class SnapEngine {

    // Eventually will implement RTree in SnapIndexer, for now, just return the full node list
    getNearByNodes(p: Vec2) {
        p;
        return useNodeStore.getState().nodes;
    }

    snap(p: Vec2, opts: SnapOptions): SnapResult {

        const pt = copyVec(p);
        const rad2 = opts.radius * opts.radius;

        // Prioritise nodes first
        const nodes = this.getNearByNodes(pt);
        let bestNode: { id: string, p: Vec2, dist2: number } | undefined;
        for (const node of nodes) {
            const dist2 = (pt.x - node.p.x) ** 2 + (pt.y - node.p.y) ** 2;
            if (dist2 <= rad2 && (!bestNode || dist2 < bestNode.dist2)) bestNode = { id: node.id, p: node.p, dist2: dist2 };
        }
        if (bestNode) return { kind: "node", nodeId: bestNode.id, p: bestNode.p };

        // Then check midpoints

        // If no snap found, return none
        return { kind: "none" };
    }
}
