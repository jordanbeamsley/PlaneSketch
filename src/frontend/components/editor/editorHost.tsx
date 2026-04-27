import { useEffect, useMemo } from "react";
import { useStore } from "zustand";
import { toast, Toaster } from "sonner";
import { CadCanvasView } from "../cad/cadCanvasView";
import { SessionManager } from "@/cad/editor/session/sessionManager";
import { createDocumentStore } from "@/cad/editor/stores/createDocumentStore";
import { createEmptyDocument } from "@/cad/editor/document/createEmptyDocument";
import { SessionProvider } from "@/frontend/context/sessionContext";
import Ribbon from "../ribbon/ribbon";
import { TooltipProvider } from "../ui/tooltip";
import { notifications } from "@/shared/notifications";

export function EditorHost() {
    const documentStore = useMemo(() => createDocumentStore(), []);
    const sessionManager = useMemo(() => new SessionManager(documentStore), [documentStore]);

    const activeSession = useStore(sessionManager.sessionStore, s => s.active);

    useEffect(() => {
        const emptyDoc = createEmptyDocument();
        documentStore.getState().setMain(emptyDoc);
        sessionManager.openMain(emptyDoc.id);
    }, []);

    useEffect(() => {
        return notifications.subscribe(({ kind, message }) => {
            toast[kind](message);
        });
    }, []);

    return (
        <SessionProvider value={activeSession ? { selectStore: activeSession.selection } : null}>
            <Toaster />
            <div className="w-screen h-screen overflow-hidden flex flex-col">
                <TooltipProvider>
                    <Ribbon />
                </TooltipProvider>
                <div id="canvas-container" className="flex-1">
                    <CadCanvasView
                        documentStore={documentStore}
                        sessionManager={sessionManager}
                    />
                </div>
            </div>
        </SessionProvider>
    );
}
