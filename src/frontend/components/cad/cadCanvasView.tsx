import type { SessionManager } from "@/cad/editor/session/sessionManager";
import type { DocumentStore } from "@/cad/editor/stores/createDocumentStore";
import { createCadRuntime } from "@/cad/runtime/createCadRuntime";
import { useEffect, useRef } from "react";

export function CadCanvasView(props: {
    sessionManager: SessionManager;
    documentStore: DocumentStore;
}) {
    const hostRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!hostRef.current) return;

        let runtime: Awaited<ReturnType<typeof createCadRuntime>> | null = null;
        let disposed = false;

        (async () => {
            runtime = await createCadRuntime({
                host: hostRef.current!,
                sessionManager: props.sessionManager,
                documentStore: props.documentStore,
            });

            if (disposed) {
                runtime.destroy();
                runtime = null;
                return;
            }

            runtime.focus();
        })();

        return () => {
            disposed = true;
            runtime?.destroy();
            runtime = null;
        };
    }, [props.sessionManager, props.documentStore]);

    return <div ref={hostRef} className="w-full h-full select-none" />;
}
