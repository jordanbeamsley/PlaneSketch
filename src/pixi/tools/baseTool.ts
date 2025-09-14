import type { FederatedPointerEvent } from "pixi.js";
import type { SceneLayers } from "../../models/layers";

export abstract class BaseTool {
	constructor(protected layers: SceneLayers) { }

	abstract onDown(e: FederatedPointerEvent): void;
	abstract onMove(e: FederatedPointerEvent): void;
	abstract onUp(e: FederatedPointerEvent): void;
}
