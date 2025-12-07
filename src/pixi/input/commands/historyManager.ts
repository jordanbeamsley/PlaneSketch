import type { CommandContext, StatefulCommand } from "./types";

/** 
 * Simple linear action history manager
 * All history actions are driven from StatefulCommands */
export class HistoryManager {
    private ctx: CommandContext;

    private undoStack: StatefulCommand[] = [];
    private redoStack: StatefulCommand[] = [];

    constructor(ctx: CommandContext) {
        this.ctx = ctx;
    }

    execute(cmd: StatefulCommand) {
        cmd.do(this.ctx);
        this.undoStack.push(cmd);
        // New action invalidates redo stack
        this.redoStack.length = 0;
    }

    canUndo() { return this.undoStack.length > 0; }
    canRedo() { return this.redoStack.length > 0; }

    undo() {
        const cmd = this.undoStack.pop();
        if (!cmd) return;
        cmd.undo(this.ctx);
        this.redoStack.push(cmd);
    }

    redo() {
        const cmd = this.redoStack.pop();
        if (!cmd) return;
        cmd.do(this.ctx);
        this.undoStack.push(cmd);
    }
}
