import type { Node } from "@/models/geometry";
import { create } from "zustand";

type State = {
    nodes: Node[];
}

type Action = {
    addMany: (n: Node[]) => void;
    clear: () => void;
}

export const useNodeStore = create<State & Action>((set) => ({
    nodes: [],
    addMany: (n) => set((s) => ({ nodes: [...s.nodes, ...n] })),
    clear: () => set({ nodes: [] })
}))
