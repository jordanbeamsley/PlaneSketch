import { CommandRegistry } from "../commands/commandRegistry";
import { DefaultCommands } from "../commands/defaultCommands";
import type { CommandContext } from "../commands/types";
import { DefaultKeybindings } from "./defaultKeybindings";
import { KeybindingResolver } from "./keybindingResolver";
import { KeybindingRegistry } from "./keybindRegistry";
import { KeyboardRouter } from "./KeyboardRouter";

export function createDefaultKeyboardRouter(params: {
    ctx: CommandContext;
    setShouldPan: (fn: (e: PointerEvent) => boolean) => void;
    setCursor: (cursor: string) => void;
    target?: Window | HTMLElement;
}) {
    const cmdReg = new CommandRegistry();
    const kbReg = new KeybindingRegistry();
    cmdReg.register(DefaultCommands);
    kbReg.register(DefaultKeybindings);

    const resolver = new KeybindingResolver(cmdReg, kbReg);
    const router = new KeyboardRouter({
        target: params.target, resolver, ctx: params.ctx,
        setCursor: params.setCursor
    });

    return { cmdReg, kbReg, resolver, router };
}
