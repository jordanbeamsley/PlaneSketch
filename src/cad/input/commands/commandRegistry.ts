import type { Command } from "../commands/types";
import type { CommandId } from "./defaultCommands";

export class CommandRegistry {
    private commands = new Map<CommandId, Command>();
    register(cmds: Command[]) { cmds.forEach(c => this.commands.set(c.id, c)); }
    unregister(cmds: Command[]) { cmds.forEach(c => this.commands.delete(c.id)); }
    get(id: CommandId) { return this.commands.get(id); }
}
