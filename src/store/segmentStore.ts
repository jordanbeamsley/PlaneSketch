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
    removeMany: (ids: SegmentId[]) => void;
    asArray: () => Segment[]; // For serializing data on save
}

export const useSegmentStore = create<SegmentState & SegmentAction>()(
    subscribeWithSelector((set) => ({
        byId: new Map(),
        add: (n) => set(s => {
            const byId = new Map(s.byId);
            byId.set(n.id, n);
            return { byId };
        }),
        addMany: (ns) => set(s => {
            const byId = new Map(s.byId);
            for (const n of ns) byId.set(n.id, n);
            return { byId };
        }),
        update: (id, patch) => set(s => {
            const cur = s.byId.get(id);
            if (!cur) return {};
            const byId = new Map(s.byId);
            byId.set(id, { ...cur, ...patch });
            return { byId };
        }),
        remove: (id) => set(s => {
            const byId = new Map(s.byId);
            byId.delete(id);
            return { byId };
        }),
        removeMany: (ids) => set(s => {
            const byId = new Map(s.byId);
            for (const id of ids) {
                byId.delete(id);
            }
            return { byId };
        }),
        asArray: () => [] // implement later

    }))
);
