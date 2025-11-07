import type { CommandId } from "../commands/defaultCommands";
import type { CommandContext } from "../commands/types";

export type KeyChord = {
    /** e.g 'KeyZ', 'Delete', 'ArrowLeft' */
    code: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    repeat?: boolean;
}

export type Keybinding = {
    id: string;
    chord: KeyChord;
    command: CommandId;
    /** Check if we're in the right context for the given keybinding */
    when?: (ctx: CommandContext) => boolean;
    allowRepeat?: boolean;
}

