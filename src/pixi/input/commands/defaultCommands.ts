import type { Command } from "./types";

export type CommandId =
    | "selection.delete"
    | "tool.cancel"
    | "tool.change.select"
    | "tool.change.line"
    | "tool.change.rect";

export const DefaultCommands: Command[] = [
    {
        id: "selection.delete",
        description: "Delete selected entities",
        canExecute: (ctx) => ctx.selection.hasAny(),
        execute: (ctx) => ctx.selection.delete(),
    },
    {
        id: "tool.cancel",
        description: "Cancel current tool operation",
        execute: (ctx) => ctx.tools.dispatchToActiveTool("tool.cancel", ctx)
    }
]
