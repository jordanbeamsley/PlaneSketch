import type { CircleId, NodeId, SegmentId } from "@/cad/models/sketch/ids";
import { createStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

/**
 * Describes where an entity lives 
 *
 * doc -> geometry owned by the active editing session
 * block -> geometry inside a block definition, ref by an instance
 */
export type EntityOwner =
    | { scope: "doc" }
    | { scope: "block"; instId: string; defId: string }

/** Typed reference to a selectable entity */
export type EntityRef =
    | { kind: "node"; id: string; owner?: EntityOwner }
    | { kind: "segment"; id: string; owner?: EntityOwner }
    | { kind: "circle"; id: string; owner?: EntityOwner }
    | { kind: "arc"; id: string; owner?: EntityOwner };

/** Internal selection key */
type Key = string;

/** 
 * Normalise an EntityRef into a unique key
 * 
 * Example:
 *  doc:node:123
 *  block:inst123:def123:segment:123
 */
export function createKey(e: EntityRef): Key {
    const owner = (e.owner?.scope === "block")
        ? `block:${e.owner.instId}:${e.owner.defId}`
        : "doc";

    return `${owner}:${e.kind}:${e.id}`;
}

type SelectState = {
    /** All selected entities normalised by key */
    selected: Set<Key>;
    /** Currently hovered entity, or null */
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
 * Factory for a sessions scoped selection store
 *
 * Each EditorSession gets its own instance
 */
export function createSelectionStore() {
    return createStore<SelectState & SelectActions>()(
        subscribeWithSelector((set, get) => ({
            selected: new Set<Key>(),
            hovered: null,

            add: (e) =>
                set((s) => {
                    const c = new Set(s.selected);
                    c.add(createKey(e));
                    return { selected: c };
                }),

            addMany: (es) =>
                set((s) => {
                    const c = new Set(s.selected);
                    for (const e of es) c.add(createKey(e));
                    return { selected: c };
                }),

            remove: (e) =>
                set((s) => {
                    const c = new Set(s.selected);
                    c.delete(createKey(e));
                    return { selected: c };
                }),

            toggle: (e) =>
                set((s) => {
                    const c = new Set(s.selected);
                    const k = createKey(e);
                    c.has(k) ? c.delete(k) : c.add(k);
                    return { selected: c };
                }),

            clear: () => set({ selected: new Set<Key>() }),

            hasAny: () => get().selected.size > 0,

            setHovered: (e) => set({ hovered: e ? createKey(e) : null }),

            isSelected: (e) => get().selected.has(createKey(e)),

            /**
             * Extract selected entities by type.
             *
             * Only returns entitie owned by the active document
             */
            getByKind: () => {
                const nodes: Set<NodeId> = new Set();
                const segments: Set<SegmentId> = new Set();
                const circles: Set<CircleId> = new Set();

                for (const k of get().selected) {
                    const parts = k.split(":");

                    // doc:<kind>:<id>
                    if (parts[0] !== "doc") continue;

                    const kind = parts[1];
                    const id = parts[2];

                    if (kind === "node") nodes.add(id);
                    else if (kind === "segment") segments.add(id);
                    else if (kind === "circle") circles.add(id);
                }

                return { nodes, segments, circles };
            },
        }))
    );
}

export type SelectionStore = ReturnType<typeof createSelectionStore>;
