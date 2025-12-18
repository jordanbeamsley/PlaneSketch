import type { BlockDefinition } from "@/cad/models/sketch/blocks";
import type { SketchDocument } from "@/cad/models/sketch/document"
import type { BlockDefId } from "@/cad/models/sketch/ids";
import { createStore } from "zustand";

export type DocumentState = {
    main: SketchDocument | null;
    blocks: Map<BlockDefId, BlockDefinition>;
};

export type DocumentActions = {
    setMain(doc: SketchDocument): void;
    upsertBlock(def: BlockDefinition): void;
    getBlock(defId: BlockDefId): BlockDefinition | undefined;

    exportAll(): { main: SketchDocument | null; blocks: BlockDefinition[] };
};

export function createDocumentStore() {
    return createStore<DocumentState & DocumentActions>((set, get) => ({
        main: null,
        blocks: new Map(),

        setMain: (doc) => set({ main: doc }),

        upsertBlock: (def) =>
            set((s) => {
                const blocks = new Map(s.blocks);
                blocks.set(def.id, def);
                return { blocks };
            }),

        getBlock: (defId) => get().blocks.get(defId),

        exportAll: () => {
            const s = get();
            return { main: s.main, blocks: [...s.blocks.values()] };
        },
    }));
}

export type DocumentStore = ReturnType<typeof createDocumentStore>;
