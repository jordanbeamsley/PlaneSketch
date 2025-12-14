# Editor Architecture Overview
The editor is built around the following core conecpts:

- There is only 1 canvas, 1 camera, 1 input system.
- There is potentially many sketches (documents/ block definitions).
- Only one sketch is actively edited at a time.

To support CAD style blocks, snapping, constraints, etc, the system is divided into conceptual layers.

## Layers
### Model Layer
Located in: [src/cad/models/sketch](../src/cad/models/sketch/)

The `Model Layer` is pure data.
All data structures are serializable and solver-agnostic (GCS).
They contain no Pixi, no Zustand Stores, No solvers.

Key Types:

- SketchDocument:
  - A full sketch definition, contains:
    - nodes, segments, circles, arcs, etc. geometry data
    - blockInstances
    - constraints (solver agnostic representations)

- BlockDefinition:
  - A named, reusable sketch:
    - contains its own SketchDoument
    - edited by entering "block edit mode"

- BlockInstance:
  - A instance placement of a BlockDefinition inside another SketchDoument.
    - references block definition by ID
    - includes a transform definition (translate / rotate / scale)

Notes:
- Block geometry is never flattened into the main document. The exist in self contained bounding boxes.
- Block definitions are edited directly, with changes applied to all instances.

### Document Store Layer
Located in: [src/cad/editor/stores](../src/cad/editor/stores/)

The `Document Store` is the persistence/ library layer for every component that makes up a project.
It acts as the single source of truth saving/ loading documents.
The Document Store contains no Pixi, No Zustand Stores, No solvers.

The Document Store owns:
- The main SketchDocument (top level drawing)
- The block library (Map<BlockDefId, BlockDefinition>)

### Editor Session Layer
Located in [src/cad/editor/session](../src/cad/editor/session/)

The `Editor Session` represents one active editing context.
Only ONE EditorSession is active at any one time.

Examples:
- Editing the main document
- Editing a block definition

Each Editor Session owns:
- GeometryStore (mutable runtime geometry)
- SelectionStore (selected / hovered EntityRefs)
- HistoryManager (undo / redo stack)
- GraphIndex (topology tracker, e.g incident segments)
- ConstraintEngine (GCS solver wrapper)
- ToolController (active tool)

Sessions are created when:
- Opening the main document
- Entering block edit mode

Sessions are destroyed when:
- Leaving block edit mode

On exit, session geometry is serialized back into the DocumentStore

### Session Manager Layer
Located in: [src/cad/editor/session](../src/cad/editor/session/)

The `Session Manager` layer controls the transition between the editor sessions

Responsibilies:
- Open Main: load the main SketchDocument into a new session
- Enter Block edit: Push a new session for editing a BlockDefinition
- Exit Block Edit:
  - serialize geometry back into BlockDefinition
  - destroy solver / history / graph index
  - restore previous session (FILO)

PixiStage, tools, snapping, commands, etc. always act on:
sessionManager.active
