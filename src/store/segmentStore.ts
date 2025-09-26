import type { Segment, SegmentId } from "@/models/geometry";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

type SegmentState = {
    byId: Map<SegmentId, Segment>
}

type SegmentAction = {
    add: (n: Segment) => void;
    addMany: (ns: Segment[]) => void;
    update: (id: SegmentId, patch: Partial<Segment>) => void;
    remove: (id: SegmentId) => void;
    asArray: () => Segment[]; // For serializing data on save
}

export const useSegmentStore = create<SegmentState & SegmentAction>()(
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
