import type { Node, NodeId } from "@/models/geometry";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

type NodeState = {
    byId: Map<NodeId, Node>
}

type NodeAction = {
    add: (n: Node) => void;
    addMany: (ns: Node[]) => void;
    update: (id: NodeId, patch: Partial<Node>) => void;
    remove: (id: NodeId) => void;
    asArray: () => Node[]; // For serializing data on save
}

export const useNodeStore = create<NodeState & NodeAction>()(
    subscribeWithSelector((set) => ({
        byId: new Map(),
        add: (n) => set(s => {
            s.byId.set(n.id, n);
            return { byId: new Map(s.byId) };
        }),
        addMany: (ns) => set(s => {
            for (const n of ns) s.byId.set(n.id, n);
            return { byId: new Map(s.byId) };
        }),
        update: (id, patch) => set(s => {
            const cur = s.byId.get(id);
            if (!cur) return {};
            s.byId.set(id, { ...cur, ...patch });
            return { byId: new Map(s.byId) };
        }),
        remove: (id) => set(s => {
            s.byId.delete(id);
            return { byId: new Map(s.byId) };
        }),
        asArray: () => [] // implement later

    }))
);
