import type {
    ArcId,
    CircleId,
    NodeId,
    SegmentId,
} from "@/cad/models/sketch/ids";
import {
    refKey,
    parseRefKey,
    type EntityRef,
    type EntityKind,
} from "@/cad/models/sketch/entityRef";
import { createStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type { EntityRef } from "@/cad/models/sketch/entityRef";
export type { EntityOwner } from "@/cad/models/sketch/entityRef";

/** Internal selection key */
type Key = string;

export type idsByKind = Record<EntityKind, Set<string>>;

type SelectState = {
    /** All selected entities normalised by key */
    selected: Set<Key>;
    /** Currently hovered entity key, or null */
    hovered: Key | null;
};

type SelectActions = {
    add: (e: EntityRef) => void;
    addMany: (es: EntityRef[]) => void;
    remove: (e: EntityRef) => void;
    toggle: (e: EntityRef) => void;
    clear: () => void;
    hasAny: () => boolean;

    setHovered: (e: EntityRef | null) => void;

    isSelected: (e: EntityRef) => boolean;

    /** Current selection, parsed back to EntityRef. Storage stays Set<string> for O(1) dedup/lookup */
    getSelected: () => EntityRef[];
    /** Current hover, parsed back to EntityRef */
    getHovered: () => EntityRef | null;

    getByKind: () => idsByKind;
    getCountByKind: () => Record<EntityKind, number>;
};

/**
 * Factory for a session-scoped selection store.
 *
 * Each EditorSession gets its own instance.
 *
 * Internally, selection is stored as a set of refKey() strings for lookup / dedup
 * Public facing API getter / setters work in EntityRef objects.
 *
 * NOTE:
 * subscribeWithSelector needs a concrete primative to diff against
 * Services that use subscribeWithSelector need to sub to the string state, but can call getter after firing
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

            getSelected: () => {
                const refs: EntityRef[] = [];
                for (const k of get().selected) {
                    const ref = parseRefKey(k);
                    if (ref) refs.push(ref);
                }
                return refs;
            },

            getHovered: () => {
                const h = get().hovered;
                return h ? parseRefKey(h) : null;
            },

            /**
             * Extract selected entities by type.
             * Only returns entities owned by the active document (doc scope).
             */
            getByKind: () => {
                const nodes: Set<NodeId> = new Set();
                const segments: Set<SegmentId> = new Set();
                const circles: Set<CircleId> = new Set();
                const arcs: Set<ArcId> = new Set();

                for (const ref of get().getSelected()) {
                    if (ref.owner.scope !== "doc") continue;

                    if (ref.kind === "node") nodes.add(ref.id);
                    else if (ref.kind === "segment") segments.add(ref.id);
                    else if (ref.kind === "circle") circles.add(ref.id);
                }

                return {
                    node: nodes,
                    segment: segments,
                    circle: circles,
                    arc: arcs,
                };
            },

            getCountByKind() {
                let nodeCount = 0;
                let segmentCount = 0;
                let circleCount = 0;
                let arcCount = 0;

                for (const ref of get().getSelected()) {
                    if (ref.owner.scope !== "doc") continue;

                    if (ref.kind === "node") nodeCount++;
                    else if (ref.kind === "segment") segmentCount++;
                    else if (ref.kind === "circle") circleCount++;
                    else if (ref.kind === "arc") arcCount++;
                }

                return {
                    node: nodeCount,
                    segment: segmentCount,
                    circle: circleCount,
                    arc: arcCount,
                };
            },
        })),
    );
}

export type SelectionStore = ReturnType<typeof createSelectionStore>;
