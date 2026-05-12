# Plane-Sketch Design Documents

Reference documents for the major subsystems in this project.

I write these for my future self to reflect on, not for an audience.
I often won't touch projects such as this for extended months, and need to re-acquaint myself once I revisit.

The goal is to be able to be able to glean a quick refresher of the subsystem that needs work, and understand *why* things are the way they are, and *how* they fit together.
The code comments themselves will describe *what* the code does.

Each document covers a semi self-contained subsystem. It should describe the problem it solves, the key design decisions, and how it fits into the broader architecture.

There is no promises that these documents will remain current, or that they detail a system exhaustively.

## Index

| Document                                         | Subsystem                                                 |
|--------------------------------------------------|-----------------------------------------------------------|
| [editorArchitecture.md](./editorArchitecture.md) | Overall editor architecture - sessions, documents, blocks |
| [snapEngine.md](./snapEngine.md)                 | Snap engine - rules, candidates, data sources             |

## What these documents are not

- API references - read the source for that, api docs may come later
- Changelogs - use git for that
- Tutorials
