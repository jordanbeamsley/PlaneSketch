import type { Container } from "pixi.js";

export interface SceneLayers {
	preview: Container;
	nodes: Container;
	sketch: Container;
	grid: Container;
}
