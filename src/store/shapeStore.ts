import { create } from "zustand";
import type { Shape } from "../models/shapes";

interface shapeState {
    shapes: Shape[];
    add: (s: Shape) => void;
    clear: () => void;
}

export const useShapeStore = create<shapeState>((set) => ({
    shapes: [],
    add: (s) => set((st) => ({ shapes: [...st.shapes, s]})),
    clear: () => set({shapes: []})
}));