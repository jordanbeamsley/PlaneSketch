import type { HistoryManager } from "./historyManager";
import { DeleteCommand } from "./stateful/edit";
import type { Command } from "./types";

export type CommandId =
    | "selection.delete"
    | "edit.undo"
    | "edit.redo"
    | "tool.cancel"
    | "tool.change.select"
    | "tool.change.line"
    | "tool.change.rectangle"
    | "tool.change.circle";

export function createDefaultCommands(history: HistoryManager): Command[] {
    return [
        {
            id: "selection.delete",
            description: "Delete selected entities",
            canExecute: (ctx) => ctx.selection.hasAny(),
            execute: (_ctx) => {
                const deleteCommand = new DeleteCommand();
                history.execute(deleteCommand);
            }
        },
        {
            id: "edit.undo",
            description: "Undo last action",
            canExecute: () => history.canUndo(),
            execute: () => history.undo(),
        },
        {
            id: "edit.redo",
            description: "Redo last undo action",
            canExecute: () => history.canRedo(),
            execute: () => history.redo(),
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
}
