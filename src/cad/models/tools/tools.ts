export type SelectTool = "select";
export type ShapeTool = "line" | "circle" | "rectangle";
export type MoveTool = "move";
export type ConstraintTool = "constraint";

export type Tool = "none" | SelectTool | ShapeTool | MoveTool | "constraint";
