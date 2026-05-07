import { useEffect, useMemo, useState } from "react";
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
import ActivityBar, { type ActivityMode } from "../sidebar/activityBar";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "../ui/resizable";

export function EditorHost() {
    const [activeMode, setActiveMode] = useState<ActivityMode>("constraints");

    const documentStore = useMemo(() => createDocumentStore(), []);
    const sessionManager = useMemo(
        () => new SessionManager(documentStore),
        [documentStore],
    );

    const activeSession = useStore(
        sessionManager.sessionStore,
        (s) => s.active,
    );

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
        <SessionProvider
            value={
                activeSession ? { selectStore: activeSession.selection } : null
            }
        >
            <TooltipProvider>
                <Toaster />
                <div className="w-screen h-screen overflow-hidden flex flex-col">
                    <Ribbon />
                    <div className="flex flex-row h-full">
                        <ActivityBar
                            activeMode={activeMode}
                            onModeChange={(m) => {
                                setActiveMode(m);
                            }}
                        />
                        <ResizablePanelGroup
                            id="HELLO"
                            orientation="horizontal"
                        >
                            <ResizablePanel defaultSize={20}>
                                <div
                                    id="sidebar-panel"
                                    className="h-full bg-zinc-800"
                                ></div>
                            </ResizablePanel>
                            <ResizableHandle
                                withHandle
                                className="bg-zinc-700"
                            />
                            <ResizablePanel defaultSize={80}>
                                <div
                                    id="canvas-container"
                                    className="w-full h-full"
                                >
                                    <CadCanvasView
                                        documentStore={documentStore}
                                        sessionManager={sessionManager}
                                    />
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
                </div>
            </TooltipProvider>
        </SessionProvider>
    );
}
