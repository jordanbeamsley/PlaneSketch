import type { Tool } from "@/cad/models/tools/tools";
import type { CommandId } from "./defaultCommands";
import type { GraphIndex } from "@/cad/graph/graphIndex";
import type { GeometryStore } from "@/cad/editor/stores/createGeometryStore";
import type { SelectionStore } from "@/cad/editor/stores/createSelectionStore";
import type { ConstraintStore } from "@/cad/editor/stores/createConstraintStore";
import type { ConstraintEngine } from "@/cad/constraints/constraintsEngine";

export type CommandContext = {
  input: {
    isCanvasFocused: () => boolean;
  }
  selection: {
    getSelection: () => SelectionStore;
    /** Return true if current select buffer has any entities */
    hasAny: () => boolean;
  },
  constraint: {
    getConstraints: () => ConstraintStore;
    getConstraintEngine: () => ConstraintEngine;
  }
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
    getGraph: () => GraphIndex;
  },
  geometry: {
    getGeometry: () => GeometryStore;
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
  /** 
   * Optional check. If provided and returns false, the command is rejected,
   * do() will not be called and the command will not be added to the history buffer. 
   * Redo skips this check (the command was already validated when first executed).
   */
  canExecute?: (ctx: CommandContext) => boolean;

  /** Execute the do/redo action */
  do: (ctx: CommandContext) => void;

  /** Undo action */
  undo: (ctx: CommandContext) => void;

  /** Optional friendly label for history tree */
  label?: string;
}

