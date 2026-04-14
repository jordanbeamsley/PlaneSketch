import type { BlockDefId, DocId } from "@/cad/models/sketch/ids";
import type { DocumentStore } from "../stores/createDocumentStore";
import { createSessionFromDocument, type EditorSession } from "./editorSession";
import { createStore } from "zustand";

/** Coordinates switching between main and block editing */
export class SessionManager {
    private docs: DocumentStore;

    /** A push/pop stack of editable sessions */
    private stack: EditorSession[] = [];

    /** Reactive store for the active session - used for seession-scoped subscriptions from frontend */
    readonly sessionStore = createStore<{ active: EditorSession | null }>()(() => ({ active: null }));

    constructor(docs: DocumentStore) {
        this.docs = docs;
    }

    /** Return the top/ active session in the stack */
    get active(): EditorSession {
        const s = this.stack[this.stack.length - 1];
        if (!s) throw new Error("No active session");
        return s;
    }

    /** Load main doc into a new sessions (replaces the stack) */
    openMain(docId: DocId) {
        const main = this.docs.getState().main;
        if (!main) throw new Error("No main document loaded");
        if (main.id !== docId) throw new Error("Requested doc does not match loaded main doc");

        this.stack = [createSessionFromDocument({ kind: "main", docId }, main)];
        this.sessionStore.setState({ active: this.stack[0] });
    }

    /** Enter block editor, pushes a new session using the block definition sketch */
    enterBlockEdit(defId: BlockDefId) {
        const def = this.docs.getState().getBlock(defId);
        if (!def) throw new Error(`Unknown block def ${defId}`);

        this.stack.push(createSessionFromDocument({ kind: "block", defId }, def.sketch));
        this.sessionStore.setState({ active: this.stack[this.stack.length - 1] });
    }

    /** Exit block editor, updates block def geometry, then pops from stack */
    exitBlockEdit() {
        const cur = this.active;
        if (cur.ref.kind !== "block") return;

        const defId = cur.ref.defId;
        const def = this.docs.getState().getBlock(defId);
        if (!def) throw new Error(`Unknown block def ${defId}`);

        // Serialize session geometry back into the block def sketch
        const updatedSketch = cur.geometry.getState().toDocument(def.sketch.id, def.sketch.name, def.sketch.constraints);
        this.docs.getState().upsertBlock({ ...def, sketch: updatedSketch });

        // TODO: Dispose of GCS resources
        this.stack.pop();
        this.sessionStore.setState({ active: this.stack[this.stack.length - 1] ?? null });
    }
}
