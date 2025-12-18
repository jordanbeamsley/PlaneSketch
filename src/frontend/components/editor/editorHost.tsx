import { useEffect, useMemo } from "react";
import { CadCanvasView } from "../cad/cadCanvasView";
import { SessionManager } from "@/cad/editor/session/sessionManager";
import { createDocumentStore } from "@/cad/editor/stores/createDocumentStore";
import { createEmptyDocument } from "@/cad/editor/document/createEmptyDocument";

export function EditorHost() {
    const documentStore = useMemo(() => createDocumentStore(), []);
    const sessionManager = useMemo(() => new SessionManager(documentStore), [documentStore]);

    useEffect(() => {
        const emptyDoc = createEmptyDocument();
        documentStore.getState().setMain(emptyDoc);
        sessionManager.openMain(emptyDoc.id);
    }, [])

    return (
        <CadCanvasView
            documentStore={documentStore}
            sessionManager={sessionManager}
        />
    );
}
