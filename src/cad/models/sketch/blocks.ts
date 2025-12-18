import type { BlockDefId } from "./ids";
import type { SketchDocument } from "./document";

export type BlockDefinition = {
    id: BlockDefId;
    name: string;
    sketch: SketchDocument;
};
