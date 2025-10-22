import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

/** Map a entity id to its type */
export type EntityRef =
    | { kind: "node"; id: string }
    | { kind: "segment"; id: string }
    | { kind: "circle"; id: string };

type Key = string;
/** Helper to convert a EntityRef to a Key (string). E.g `${kind}:${id}` */
function key(e: EntityRef): Key { return `${e.kind}:${e.id}`; }

type SelectState = {
    selected: Set<Key>;
    hovered: Key | null;
}

type SelectAction = {
    add: (e: EntityRef) => void;
    addMany: (es: EntityRef[]) => void;
    remove: (e: EntityRef) => void;
    toggle: (e: EntityRef) => void;
    clear: () => void;

    setHovered: (e: EntityRef | null) => void;

    isSelected: (e: EntityRef) => boolean;
    getByKind: () => { nodes: string[]; segments: string[]; circles: string[] };
}

export const useSelectStore = create<SelectState & SelectAction>()(
    subscribeWithSelector((set, get) => ({
        selected: new Set<Key>(),
        hovered: null,

        add: (e) => set(s => {
            const c = new Set(s.selected);
            c.add(key(e));
            return { selected: c };
        }),
        addMany: (es) => set(s => {
            const c = new Set(s.selected);
            es.forEach((e) => { c.add(key(e)) });
            return { selected: c };
        }),
        remove: (e) => set(s => {
            const c = new Set(s.selected);
            c.delete(key(e));
            return { selected: c };
        }),
        toggle: (e) => set(s => {
            const c = new Set(s.selected);
            const k = key(e);
            c.has(k) ? c.delete(k) : c.add(k);
            return { selected: c };
        }),
        clear: () => set({ selected: new Set<Key>() }),

        setHovered: (e) => set({ hovered: e ? key(e) : null }),

        isSelected: (e) => get().selected.has(key(e)),
        getByKind: () => {
            const nodes: string[] = [], segments: string[] = [], circles: string[] = [];
            for (const k of get().selected) {
                const [kind, id] = k.split(":");
                if (kind === "node") nodes.push(id);
                else if (kind === "segment") segments.push(id);
                else circles.push(id);
            }
            return { nodes, segments, circles };
        }
    }))
); 
