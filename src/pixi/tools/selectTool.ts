import type { FederatedPointerEvent } from "pixi.js";
import { BaseTool } from "./baseTool"

export class SelectTool extends BaseTool {
    onDown(e: FederatedPointerEvent): void {
        throw new Error("Method not implemented.");
    }
    onMove(e: FederatedPointerEvent): void {
        throw new Error("Method not implemented.");
    }
    onUp(e: FederatedPointerEvent): void {
        throw new Error("Method not implemented.");
    }

}