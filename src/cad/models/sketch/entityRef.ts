export type EntityKind = "node" | "segment" | "circle" | "arc";

/** 
 * Owner of a geometry entity
 * 
 * An enitity is either owned by the document that is currently being edited,
 * or it is owned by an instance of a block definition
 */
export type EntityOwner =
    | { scope: "doc" }
    | { scope: "block"; instId: string; defId: string };

/**
 * Reference to a geometry entity 
 * 
 * All subsystems must use this module to build entity keys
 */
export type EntityRef = {
    kind: EntityKind;
    id: string;
    owner: EntityOwner;
};

/** Produce serialised key for an EntityRef */
export function refKey(e: EntityRef): string {
    if (e.owner.scope === "block") {
        return `block:${e.owner.instId}:${e.owner.defId}:${e.kind}:${e.id}`;
    }
    return `doc:${e.kind}:${e.id}`;
}

/** Parse a serialised key string back to an EntityRef */
export function parseRefKey(key: string): EntityRef | null {
    const parts = key.split(":");

    if (parts[0] === "doc" && parts.length === 3) {
        const kind = parts[1] as EntityKind;
        if (!isEntityKind(kind)) return null;
        return { kind, id: parts[2], owner: { scope: "doc" } };
    }

    if (parts[0] === "block" && parts.length === 5) {
        const kind = parts[3] as EntityKind;
        if (!isEntityKind(kind)) return null;
        return { kind, id: parts[4], owner: { scope: "block", instId: parts[1], defId: parts[2] } };
    }

    return null;
}

/** Check if entity kind is properly defined */
function isEntityKind(s: string): s is EntityKind {
    return s === "node" || s === "segment" || s === "circle" || s === "arc";
}

/** Factory helpers */
export const EntityRefs = {
    docNode: (id: string): EntityRef => ({ kind: "node", id, owner: { scope: "doc" } }),
    docSegment: (id: string): EntityRef => ({ kind: "segment", id, owner: { scope: "doc" } }),
    docCircle: (id: string): EntityRef => ({ kind: "circle", id, owner: { scope: "doc" } }),
    docArc: (id: string): EntityRef => ({ kind: "arc", id, owner: { scope: "doc" } }),

    blockNode: (instId: string, defId: string, id: string): EntityRef => ({ kind: "node", id, owner: { scope: "block", instId, defId } }),
    blockSegment: (instId: string, defId: string, id: string): EntityRef => ({ kind: "segment", id, owner: { scope: "block", instId, defId } }),
    blockCircle: (instId: string, defId: string, id: string): EntityRef => ({ kind: "circle", id, owner: { scope: "block", instId, defId } }),
};
