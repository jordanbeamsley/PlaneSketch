import type { SketchConstraint } from "@/cad/models/sketch/constraints";
import type { ConstraintId } from "@/cad/models/sketch/ids";
import { createStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type ConstraintState = {
    constraints: Map<ConstraintId, SketchConstraint>;
};

export type ConstraintActions = {
    add(c: SketchConstraint): void;
    addMany(cs: SketchConstraint[]): void;

    remove(id: string): void;

    /** Replace an existing constraint in-place — used when editing a dimensional value */
    update(c: SketchConstraint): void;

    clear(): void;

    /** Serialise back to a flat array for document storage */
    toArray(): SketchConstraint[];
};

/**
 * Factory for a session-scoped constraint store.
 *
 * Each EditorSession gets its own instance, initialised from the
 * document's constraint list and serialised back on session exit.
 */
export function createConstraintStore(initial: SketchConstraint[] = []) {
    return createStore<ConstraintState & ConstraintActions>()(
        subscribeWithSelector((set, get) => ({
            constraints: new Map(initial.map(c => [c.id, c])),

            add: (c) =>
                set((s) => {
                    const constraints = new Map(s.constraints);
                    constraints.set(c.id, c);
                    return { constraints };
                }),

            addMany: (cs) =>
                set((s) => {
                    const constraints = new Map(s.constraints);
                    for (const c of cs) constraints.set(c.id, c);
                    return { constraints };
                }),

            remove: (id) =>
                set((s) => {
                    const constraints = new Map(s.constraints);
                    constraints.delete(id);
                    return { constraints };
                }),

            update: (c) =>
                set((s) => {
                    if (!s.constraints.has(c.id)) return s;
                    const constraints = new Map(s.constraints);
                    constraints.set(c.id, c);
                    return { constraints };
                }),

            clear: () => set({ constraints: new Map() }),

            toArray: () => Array.from(get().constraints.values()),
        }))
    );
}

export type ConstraintStore = ReturnType<typeof createConstraintStore>;
