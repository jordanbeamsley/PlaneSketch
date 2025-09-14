import { create } from "zustand";
import type { Tool } from "../models/tools";

interface ToolState {
    tool: Tool;
    setTool: (t: Tool) => void;
}

export const useToolStore = create<ToolState>((set) => ({
    tool: "select",
    setTool: (tool) => set({tool})
}))
