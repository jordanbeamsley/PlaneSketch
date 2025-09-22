import type { Segment } from "@/models/geometry";
import { create } from "zustand";

type State = {
    segments: Segment[];
}

type Action = {
    addMany: (n: Segment[]) => void;
    clear: () => void;
}

export const useSegmentStore = create<State & Action>((set) => ({
    segments: [],
    addMany: (n) => set((s) => ({ segments: [...s.segments, ...n] })),
    clear: () => set({ segments: [] })
}))
