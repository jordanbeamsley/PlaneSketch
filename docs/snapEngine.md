# Snap Engine

**Location:** [`src/cad/snap/`](../src/cad/snap/)

## Purpose

The Snap Engine is responsible for the providing the GUI "snap to feature" responsiveness.

Given the cursor position, the canvas geometry primitives, and a set of enabled snap types, the snap engine returns the best / highest priority snap feature.

---

## Architecture overview

_A short description of how the pieces fit together. A diagram or bullet hierarchy works well here._

```
SnapEngine
  ├── SnapRule[]          — individual snap behaviours (node, segment, midpoint, grid, …)
  ├── SnapDataSource      — provides geometry to rules (nodes, segments, circles)
  └── SnapRuleContext     — per-frame context passed to every rule (pointer pos, viewport, options)
```

---

## Key types

_The types that define the contract between pieces. Enough to understand the shape without reading source._

```ts
// A candidate returned by a rule. Engine picks the best one.
interface SnapCandidate {
    kind: SnapKind;
    p: Vec2;           // snapped position in world space
    dist2: number;     // squared screen-space distance (avoid sqrt)
    id?: string;       // refKey() of the snapped entity, if applicable
    priority?: number; // tie-breaker when dist2 is similar
}

// What the engine returns to the active tool
type SnapResult =
    | { kind: "none"; p: Vec2 }
    | { kind: SnapKind; p: Vec2; primary: …; residual?: … }
```

---

## How the engine works

_Walk through the solve loop at a high level._

### 1. Rule evaluation

### 2. Scoring and best candidate selection

### 3. Residual (secondary) snaps

### 4. Hysteresis

---

## Snap rules

_One paragraph per rule. What does it snap to, any non-obvious behaviour._

### `nodeRule`

### `segmentRule`

### `midpointRule`

### `circleRule`

### `axisHRule` / `axisVRule`

### `originRule`

### `gridRule`

---

## Data source

_How geometry is fed to rules. Why it's abstracted._

### Doc scope vs block scope

---

## Snap IDs and entity refs

The `id` field on a `SnapCandidate` is a canonical **`refKey`** string (see `entityRef.ts`), e.g. `doc:node:abc` or `block:inst1:def1:segment:xyz`. This means:

- The snap engine never holds raw UUIDs — its IDs are always scope-qualified.
- Tools can call `parseRefKey(candidate.id)` to get a typed `EntityRef` for selection or hover without any extra mapping.

_See also: [entityRef.ts](../src/cad/models/sketch/entityRef.ts)_

---

## Integration points

| Consumer | How it uses snap |
|---|---|
| Shape tools (line, circle, …) | Call `snapEngine.snap(ctx)` on every pointer move |
| Select tool | Uses snap for hover detection; disables grid/axis snapping |
| Snap overlay | Reads `SnapResult` to draw the HUD indicator |

---

## Configuration — `SnapOptions`

_Document the tuning knobs._

| Option | Purpose |
|---|---|
| `radius` | Screen-space capture radius for proximity rules |
| `enable` | Per-rule on/off switches |
| `hysteresisMult` | Sticky factor — prefer the last snap over a marginally closer new one |
| `segmentMin` | Minimum screen distance from a node before segment snapping activates |

---

## Design decisions

_The "why" section. Each decision should explain what was considered and why this was chosen._

### Why rules return candidates instead of a single result

### Why screen space is used for distance evaluation

### Why residual snaps are validated with `validateAt` rather than re-evaluated

### Why snap IDs are full `refKey` strings rather than raw entity IDs

---

## Known limitations / future work

-
