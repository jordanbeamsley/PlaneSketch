import type { Command } from "./types";

export type CommandId =
    | "selection.delete"
    | "tool.cancel"
    | "tool.change.select"
    | "tool.change.line"
    | "tool.change.rectangle"
    | "tool.change.circle";

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
    },
    {
        id: "tool.change.line",
        description: "Activate line tool",
    },
    {
        id: "tool.change.rectangle",
        description: "Activate rectangle tool",
    },
    {
        id: "tool.change.circle",
        description: "Activate circle tool",
    }
]
