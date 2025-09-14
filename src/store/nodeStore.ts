import { create } from "zustand";
import type { Node } from "../models/node";

// interface NodeState {
//     nodes: Node[];
//     addMany: (n: Node[]) => void;
//     clear: () => void;
// }

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

// export const useNodeStore = create<NodeState>((set) => ({
//     nodes: [] as Node,
//     addMany: (n) => set((s) => ({nodes: [...s.nodes, ...n]})),
//     clear: () => set({nodes: []})
// }));
