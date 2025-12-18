import type { Keybinding, KeyChord } from "./types";

export class KeybindingRegistry {
    private bindings: Keybinding[] = [];
    register(b: Keybinding[]) { this.bindings.push(...b); }
    unregister(ids: string[]) { this.bindings = this.bindings.filter(x => !ids.includes(x.id)); }

    findByChord(chord: KeyChord): Keybinding[] {
        return this.bindings.filter(b =>
            b.chord.code === chord.code &&
            !!b.chord.ctrl === !!chord.ctrl &&
            !!b.chord.shift === !!chord.shift &&
            !!b.chord.alt === !!chord.alt
        );
    }
}
