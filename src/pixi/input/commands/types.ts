import type { Tool } from "@/models/tools";
import type { CommandId } from "./defaultCommands";
import type { GraphIndex } from "@/pixi/graph/graphIndex";

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
    },
    graph: {
        index: GraphIndex;
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

/** 
 * Commands that can be added to the undo history buffer
 * i.e they modify the canvas state
 * 
 * Certain commmands are "raw" and not added to the buffer,
 * e.g Cancel preview of shape drawing (DEL), or tool change (l) */
export interface StatefulCommand {
    /** Execute the do/redo action */
    do: (ctx: CommandContext) => void;

    /** Undo action */
    undo: (ctx: CommandContext) => void;

    /** Optional friendly label for history tree */
    label?: string;
}

/** A small router that knows how to execute and push to history buffer */
export interface CommandBus {
    exec: (cmd: StatefulCommand, ctx: CommandContext) => void;
}
