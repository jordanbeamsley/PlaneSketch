import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "zustand";
import { toast, Toaster } from "sonner";
import { type PanelImperativeHandle } from "react-resizable-panels";
import { CadCanvasView } from "../cad/cadCanvasView";
import { SessionManager } from "@/cad/editor/session/sessionManager";
import { createDocumentStore } from "@/cad/editor/stores/createDocumentStore";
import { createEmptyDocument } from "@/cad/editor/document/createEmptyDocument";
import { SessionProvider } from "@/frontend/context/sessionContext";
import Ribbon from "../ribbon/ribbon";
import { TooltipProvider } from "../ui/tooltip";
import { notifications } from "@/shared/notifications";
import ActivityBar, { type ActivityMode } from "../sidebar/activityBar";
import Sidebar from "../sidebar/sidebar";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "../ui/resizable";

export function EditorHost() {
    const [activeMode, setActiveMode] = useState<ActivityMode>("constraints");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const sidebarPanelRef = useRef<PanelImperativeHandle | null>(null);

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

    const handleModeChange = (mode: ActivityMode) => {
        if (mode === activeMode && sidebarOpen) {
            sidebarPanelRef.current?.collapse();
        } else {
            setActiveMode(mode);
            sidebarPanelRef.current?.expand();
        }
    };

    return (
        <SessionProvider
            value={
                activeSession
                    ? {
                          selectStore: activeSession.selection,
                          constraintStore: activeSession.constraints,
                          geometryStore: activeSession.geometry,
                      }
                    : null
            }
        >
            <TooltipProvider>
                <Toaster />
                <div className="w-screen h-screen overflow-hidden flex flex-col">
                    <Ribbon />
                    <div className="flex flex-row flex-1 min-h-0">
                        <ActivityBar
                            activeMode={activeMode}
                            sidebarOpen={sidebarOpen}
                            onModeChange={handleModeChange}
                        />
                        <ResizablePanelGroup
                            orientation="horizontal"
                            className="flex-1"
                        >
                            <ResizablePanel
                                panelRef={sidebarPanelRef}
                                defaultSize={20}
                                collapsible
                                collapsedSize={0}
                            >
                                {activeSession && (
                                    <Sidebar
                                        activeMode={activeMode}
                                        onClose={() =>
                                            sidebarPanelRef.current?.collapse()
                                        }
                                    />
                                )}
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
