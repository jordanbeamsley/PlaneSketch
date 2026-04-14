import type { SelectionStore } from "@/cad/editor/stores/createSelectionStore";
import { createContext, useContext } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";

/**
 * Pass session-scoped (created per EditorSession) stores down through React context
 * Lets UI components subscribe to dynamically created stores
 */

interface SessionContextValue {
    selectStore: SelectionStore;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export const SessionProvider = SessionContext.Provider;

/**
 * Some handy hooks for using specific parts of the session instances.
 * These may grow, shrink, be moved elsewhere in the future.
 */

export function useSelectionCounts() {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error("Must be inside SessionProvider");
    return useStore(ctx.selectStore, useShallow(s => s.getCountByKind()));
}
