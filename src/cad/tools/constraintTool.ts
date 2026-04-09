import type { Tool } from "../models/tools/tools";
import { BaseTool, type PointerPayload, type ToolContext } from "./baseTool";

export class ConstraintTool extends BaseTool {


    constructor(context: ToolContext) {
        // If there is already valid selected geometry, then we can apply the constraint straight away
        super(context);
    }

    getId(): Tool {
        return "vertical"
    }

    activate(): void {
    }

    onDown(e: PointerPayload): void {

    }
}
