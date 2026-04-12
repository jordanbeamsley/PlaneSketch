import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Tool } from "@/cad/models/tools/tools";
import type { ConstraintKind } from "@/cad/models/sketch/constraints";

interface ToolState {
  tool: Tool;
  activeConstraintKind: ConstraintKind | null;
  setTool: (t: Tool) => void;
  /** Switch to the constraint tool and set the active constraint kind */
  activateConstraint: (kind: ConstraintKind) => void;
}

export const useToolStore = create<ToolState>()(

  subscribeWithSelector((set) => ({
    tool: "line",
    activeConstraintKind: null,
    setTool: (tool) => set({ tool, activeConstraintKind: null }),
    activateConstraint: (kind) => set({ tool: "constraint", activeConstraintKind: kind }),
  }))
);
