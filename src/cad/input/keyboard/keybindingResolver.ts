import type { CommandRegistry } from "../commands/commandRegistry";
import type { CommandId } from "../commands/defaultCommands";
import type { CommandContext } from "../commands/types";
import type { KeybindingRegistry } from "./keybindRegistry";
import type { KeyChord } from "./types";

export class KeybindingResolver {
    private commands: CommandRegistry;
    private keybindings: KeybindingRegistry;

    constructor(commands: CommandRegistry, keybindings: KeybindingRegistry) {
        this.commands = commands;
        this.keybindings = keybindings;
    }

    /** 
     * Try to find a keybinding that matches the the key `chord` in the current context 
     * and, if found, execute its command, or delegate to the current tool.
     *
     * Multiple commands may map to the same chord, pick what makes the most sense in the current context.
     */
    resolveAndExecute(chord: KeyChord, ctx: CommandContext): boolean {
        // Get all keybindings that match the chord
        // (same KeyboardEvent.code + modifiers)
        const candidates = this.keybindings.findByChord(chord);

        // Order the candidates by "specificity"
        // Bindings that have a `when` predicate are considered more specific
        const ordered = candidates.sort((a, b) => {
            const aSpecific = !!a.when;
            const bSpecific = !!b.when;
            // If b is specific and a is not, b should come first -> positive return
            return Number(bSpecific) - Number(aSpecific);
        });

        // Walk through each candidate, ordered in priority
        for (const kb of ordered) {
            // Ignore auto-repeated key events unless binding specifically allows them
            if (chord.repeat && kb.allowRepeat === false) {
                continue;
            }

            // If the binding has a when condition, check if it passes
            if (kb.when && !kb.when(ctx)) {
                continue;
            }

            // Give the active tool first change to handle the command
            const handledByTool = ctx.tools.dispatchToActiveTool(kb.command as CommandId, ctx);

            if (!handledByTool) {
                // The tool didnt handle it, look up the global command and execute it as a fallback
                const cmd = this.commands.get(kb.command as CommandId);
                if (!cmd || !cmd.execute) {
                    // Binding points to a command that doesn't exist, ignore it
                    continue;
                }
                // Finally execute the command
                cmd.execute(ctx);
            }

            // If we got here, then the command has been run
            // I.e the keybinding has been handled
            return true;
        }

        // If we got here, then no binding applied, or couldn't run
        // I.e key not handled
        return false;
    }
}
