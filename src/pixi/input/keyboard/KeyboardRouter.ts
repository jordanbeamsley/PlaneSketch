import type { CommandContext } from "../commands/types";
import type { KeybindingResolver } from "./keybindingResolver";
import type { KeyChord } from "./types";

type Options = {
    target: Window | HTMLElement | undefined;
    resolver: KeybindingResolver;
    ctx: CommandContext;

    setCursor?: (cursor: string) => void;
}

export class KeyboardRouter {
    private target: Window | HTMLElement;
    private opts: Options;
    private spacePressed = false;

    constructor(opts: Options) {
        this.target = opts.target ?? window;
        this.opts = opts;
    }

    mount() {
        this.target.addEventListener("keydown", this.onKeyDown as any);
        this.target.addEventListener("keyup", this.onKeyUp as any);
    }

    unmount() {
        this.target.removeEventListener("keydown", this.onKeyDown as any);
        this.target.removeEventListener("keyup", this.onKeyUp as any);
    }

    isSpacePressed() { return this.spacePressed; }

    private onKeyDown = (e: KeyboardEvent) => {
        // Space -> hold to pan (no repeats)
        if (e.code === "Space") {
            if (e.repeat) return;
            this.spacePressed = true;
            this.opts.setCursor?.("grab");
            e.preventDefault();
            return;
        }

        if (!this.opts.ctx.input.isCanvasFocused()) return;

        // Resolve command bindings
        const chord: KeyChord = {
            code: e.code, ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey
        };

        const handled = this.opts.resolver.resolveAndExecute(chord, this.opts.ctx);
        if (handled) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    private onKeyUp = (e: KeyboardEvent) => {
        if (e.code === "Space") {
            this.spacePressed = false;
            this.opts.setCursor?.("crosshair");
        }
    };
}
