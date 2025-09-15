import type { Container } from "pixi.js";

export interface SceneLayers {
    grid: Container;
    sketch: Container;
    nodes: Container;
    preview: Container;
    guides: Container;
}
