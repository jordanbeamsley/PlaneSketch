import type { CircleId, NodeId, SegmentId } from "@/cad/models/sketch/ids";
import { refKey, parseRefKey, type EntityRef } from "@/cad/models/sketch/entityRef";
import { createStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type { EntityRef } from "@/cad/models/sketch/entityRef";
export type { EntityOwner } from "@/cad/models/sketch/entityRef";

/** Internal selection key */
type Key = string;

type SelectState = {
    /** All selected entities normalised by key */
    selected: Set<Key>;
    /** Currently hovered entity key, or null */
    hovered: Key | null;
}

type SelectActions = {
    add: (e: EntityRef) => void;
    addMany: (es: EntityRef[]) => void;
    remove: (e: EntityRef) => void;
    toggle: (e: EntityRef) => void;
    clear: () => void;
    hasAny: () => boolean;

    setHovered: (e: EntityRef | null) => void;

    isSelected: (e: EntityRef) => boolean;

    getByKind: () => { nodes: Set<NodeId>; segments: Set<SegmentId>; circles: Set<CircleId> };
}

/**
 * Factory for a session-scoped selection store.
 *
 * Each EditorSession gets its own instance.
 * All keys are canonical refKey() strings — see entityRef.ts.
 */
export function createSelectionStore() {
    return createStore<SelectState & SelectActions>()(
        subscribeWithSelector((set, get) => ({
            selected: new Set<Key>(),
            hovered: null,

            add: (e) =>
                set((s) => {
                    const c = new Set(s.selected);
                    c.add(refKey(e));
                    return { selected: c };
                }),

            addMany: (es) =>
                set((s) => {
                    const c = new Set(s.selected);
                    for (const e of es) c.add(refKey(e));
                    return { selected: c };
                }),

            remove: (e) =>
                set((s) => {
                    const c = new Set(s.selected);
                    c.delete(refKey(e));
                    return { selected: c };
                }),

            toggle: (e) =>
                set((s) => {
                    const c = new Set(s.selected);
                    const k = refKey(e);
                    c.has(k) ? c.delete(k) : c.add(k);
                    return { selected: c };
                }),

            clear: () => set({ selected: new Set<Key>() }),

            hasAny: () => get().selected.size > 0,

            setHovered: (e) => set({ hovered: e ? refKey(e) : null }),

            isSelected: (e) => get().selected.has(refKey(e)),

            /**
             * Extract selected entities by type.
             * Only returns entities owned by the active document (doc scope).
             */
            getByKind: () => {
                const nodes: Set<NodeId> = new Set();
                const segments: Set<SegmentId> = new Set();
                const circles: Set<CircleId> = new Set();

                for (const k of get().selected) {
                    const ref = parseRefKey(k);
                    if (!ref || ref.owner.scope !== "doc") continue;

                    if (ref.kind === "node") nodes.add(ref.id);
                    else if (ref.kind === "segment") segments.add(ref.id);
                    else if (ref.kind === "circle") circles.add(ref.id);
                }

                return { nodes, segments, circles };
            },
        }))
    );
}

export type SelectionStore = ReturnType<typeof createSelectionStore>;
