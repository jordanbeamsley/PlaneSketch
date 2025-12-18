import type { BlockDefId, DocId } from "@/cad/models/sketch/ids";
import { createGeometryStore, type GeometryStore } from "../stores/createGeometryStore";
import type { SketchDocument } from "@/cad/models/sketch/document";
import { createSelectionStore, type SelectionStore } from "../stores/createSelectionStore";
import { GraphIndex } from "@/cad/graph/graphIndex";
import { HistoryManager } from "@/cad/input/commands/historyManager";
import type { CommandContext } from "@/cad/input/commands/types";

export type SessionKind = "main" | "block";

export type SessionRef =
    | { kind: "main"; docId: DocId }
    | { kind: "block"; defId: BlockDefId };

export type EditorSession = {
    ref: SessionRef;
    kind: SessionKind;

    geometry: GeometryStore;
    selection: SelectionStore;
    graphIndex: GraphIndex;
    history: HistoryManager;

    setHistory: (commandCtx: CommandContext) => void;

    dispose(): void;

    // To be plugged in after converting to store instance
    // history: HistoryManager;
    // graphIndex: GraphIndex;
    // constraints: ConstraintEngine;
    // tools: ToolController;
}

export function createSessionFromDocument(ref: SessionRef, doc: SketchDocument): EditorSession {
    const geometry = createGeometryStore();
    geometry.getState().addMany(doc);
    const selection = createSelectionStore();
    const graphIndex = new GraphIndex(geometry);

    let history: HistoryManager;

    return {
        ref,
        kind: ref.kind,
        geometry,
        selection,
        graphIndex,
        get history() { return history },
        setHistory(commandCtx) { history = new HistoryManager(commandCtx) },
        dispose: () => { graphIndex.dispose() }
    };
}
