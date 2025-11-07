import type { Keybinding } from "./types";

export const DefaultKeybindings: Keybinding[] = [
    // Delete selection (works with Delete and Backspace)
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
        command: "tool.cancel"
    }
]
