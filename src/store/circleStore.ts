import type { Circle, CircleId } from "@/models/geometry";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

type CircleState = {
    byId: Map<CircleId, Circle>
}

type CircleAction = {
    add: (n: Circle) => void;
    addMany: (ns: Circle[]) => void;
    update: (id: CircleId, patch: Partial<Circle>) => void;
    remove: (id: CircleId) => void;
    removeMany: (ids: CircleId[]) => void;
    asArray: () => Circle[]; // For serializing data on save
}

export const useCircleStore = create<CircleState & CircleAction>()(
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
        removeMany: (ids) => set(s => {
            for (const id of ids) {
                s.byId.delete(id);
            }
            return { byId: new Map(s.byId) };
        }),
        asArray: () => [] // implement later
    }))
)
