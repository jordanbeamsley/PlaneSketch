import type { Keybinding } from "./types";

export const DefaultKeybindings: Keybinding[] = [
    {
        id: "kb.undo",
        chord: { code: "KeyZ", ctrl: true },
        command: "edit.undo"
    },
    {
        id: "kb.redo",
        chord: { code: "KeyZ", ctrl: true, shift: true },
        command: "edit.redo"
    },
    {
        id: "kb.delete",
        chord: { code: "Delete" },
        command: "selection.delete",
        when: (ctx) => ctx.tools.getActiveToolId() !== "text"
    },
    {
        id: "kb.backspace-delete",
        chord: { code: "Backspace" },
        command: "selection.delete",
        when: (ctx) => ctx.tools.getActiveToolId() !== "text"
    },
    {
        id: "kb.escape-cancel",
        chord: { code: "Escape" },
        command: "tool.cancel",
        when: (ctx) => ctx.tools.isInOperation()
    },
    {
        id: "kb.activate-select-tool",
        chord: { code: "Escape" },
        command: "tool.change.select",
    },
    {
        id: "kb.activate-line-tool",
        chord: { code: "KeyL" },
        command: "tool.change.line",
    },
    {
        id: "kb.activate-rectangle-tool",
        chord: { code: "KeyR" },
        command: "tool.change.rectangle"
    },
    {
        id: "kb.activate-circle-tool",
        chord: { code: "KeyC" },
        command: "tool.change.circle"
    },
]
