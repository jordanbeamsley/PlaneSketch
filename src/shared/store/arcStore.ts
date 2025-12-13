import type { Arc, ArcId } from "@/models/geometry";
import { create } from "zustand";

type ArcState = {
    byId: Map<ArcId, Arc>
}

type ArcAction = {
    add: (n: Arc) => void;
    addMany: (ns: Arc[]) => void;
    update: (id: ArcId, patch: Partial<Arc>) => void;
    remove: (id: ArcId) => void;
    asArray: () => Arc[]; // For serializing data on save
}

export const useArcStore = create<ArcState & ArcAction>((set) => ({
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
