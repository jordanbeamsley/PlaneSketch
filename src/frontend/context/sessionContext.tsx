import type { SelectionStore } from "@/cad/editor/stores/createSelectionStore";
import type { ConstraintStore } from "@/cad/editor/stores/createConstraintStore";
import { createContext, useContext } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type {
    GeometryEntry,
    GeometryStore,
} from "@/cad/editor/stores/createGeometryStore";

export type { GeometryEntry };

/**
 * Pass session-scoped (created per EditorSession) stores down through React context
 * Lets UI components subscribe to dynamically created stores
 */

interface SessionContextValue {
    selectStore: SelectionStore;
    constraintStore: ConstraintStore;
    geometryStore: GeometryStore;
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
    return useStore(
        ctx.selectStore,
        useShallow((s) => s.getCountByKind()),
    );
}

export function useConstraints() {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error("Must be inside SessionProvider");
    return useStore(
        ctx.constraintStore,
        useShallow((s) => Array.from(s.constraints.values())),
    );
}

export function useEntities() {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error("Must be inside SessionProvider");
    const nodes = useStore(ctx.geometryStore, useShallow((s) => Array.from(s.nodes.values())));
    const segments = useStore(ctx.geometryStore, useShallow((s) => Array.from(s.segments.values())));
    const circles = useStore(ctx.geometryStore, useShallow((s) => Array.from(s.circles.values())));
    const arcs = useStore(ctx.geometryStore, useShallow((s) => Array.from(s.arcs.values())));
    return { nodes, segments, circles, arcs };
}
