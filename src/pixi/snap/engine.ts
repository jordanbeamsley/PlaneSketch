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

    private currentSnap: SnapResult = { kind: "none" }

    // Eventually will implement RTree in SnapIndexer, for now, just return the full node list
    getNearByNodes(p: Vec2) {
        p;
        return useNodeStore.getState().nodes;
    }

    getCurrentSnap() {
        return this.currentSnap;
    }

    snap(p: Vec2, opts: SnapOptions): SnapResult {

        const pt = copyVec(p);
        const rad2 = opts.radius * opts.radius;
        const hysterisis = (opts.hysterisisLeaveMult) ? opts.hysterisisLeaveMult : 3;

        // Check if still in a snap first, with leave hysterisis
        if (this.currentSnap.kind != "none") {
            const dist2 = (pt.x - this.currentSnap.p.x) ** 2 + (pt.y - this.currentSnap.p.y) ** 2;
            if (dist2 <= (rad2 * hysterisis)) return this.currentSnap;
            else this.currentSnap = { kind: "none" };
        }

        // Prioritise nodes
        const nodes = this.getNearByNodes(pt);
        let bestNode: { id: string, p: Vec2, dist2: number } | undefined;
        for (const node of nodes) {
            const dist2 = (pt.x - node.p.x) ** 2 + (pt.y - node.p.y) ** 2;
            if (dist2 <= rad2 && (!bestNode || dist2 < bestNode.dist2)) bestNode = { id: node.id, p: node.p, dist2: dist2 };
        }
        if (bestNode) {
            this.currentSnap = { kind: "node", nodeId: bestNode.id, p: bestNode.p };
            return this.currentSnap;
        }
        // Then check midpoints

        // If no snap found, return none
        return { kind: "none" };
    }
}
