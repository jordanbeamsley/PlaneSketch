import type { Tool } from "@/models/tools";
import type { CommandId } from "./defaultCommands";

export type CommandContext = {
    input: {
        isCanvasFocused: () => boolean;
    }
    selection: {
        /** Return true if current select buffer has any entities */
        hasAny: () => boolean;
        /** Delete selected entities and return number of deletions */
        delete: () => void;
    },
    tools: {
        getActiveToolId: () => Tool;
        /** Delegate command to active tool, pass full command context
         * Return true if command execution was successful */
        dispatchToActiveTool: (cmd: CommandId, ctx: CommandContext) => boolean;
        /** Return true if tool is actively doing something 
         * e.g. select tool is drawing marquee, line tool is drawing preview, etc*/
        isInOperation: () => boolean;
    }
}

export type Command = {
    id: CommandId;
    description?: string;
    canExecute?: (ctx: CommandContext) => boolean;
    // Commands dispatched to tools parse the command id directly,
    // They don't call execute
    execute?: (ctx: CommandContext) => void;
} 
