import { Application, Container } from "pixi.js";
import { useEffect, useRef } from "react";
import { GridOverlay } from "./overlay/gridOverlay";
import { ToolController } from "./tools/ToolController";
import type { SceneLayers } from "@/models/layers";

export function PixiStage() {
    const hostRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!hostRef.current) return;

        const app = new Application();
        let tools: ToolController | null = null;

        (async () => {
            // Bootstrap pixiCanvas
            await app.init({ resizeTo: window, background: "#202124", antialias: true });
            hostRef.current!.appendChild(app.canvas);

            // Build layer stack
            const gridLayer = new GridOverlay();
            const sketchLayer = new Container();
            const nodeLayer = new Container();
            const previewLayer = new Container(); // Ghost shapes while drawing
            const guidesLayer = new Container(); // Snaps points, alignment lines, etc.

            gridLayer.zIndex = -1;
            sketchLayer.zIndex = 10;
            nodeLayer.zIndex = 20;
            previewLayer.zIndex = 30;
            guidesLayer.zIndex = 40;

            const layerStack: SceneLayers = {
                grid: gridLayer,
                sketch: sketchLayer,
                nodes: nodeLayer,
                preview: previewLayer,
                guides: guidesLayer
            };

            // Add layer stack to pixi stage
            Object.values(layerStack).forEach(layer => {
                app.stage.addChild(layer);
            });

            // Create canvas grid overlay
            gridLayer.draw(app.screen.width, app.screen.height);
            app.renderer.on("resize", (w, h) => gridLayer.draw(w, h));

            // Create node container on top of sketch
            tools = new ToolController(layerStack);

            // Set up pointer listeners
            app.stage.eventMode = "static";
            app.stage.hitArea = app.screen;
            app.stage.cursor = "crosshair";
            app.stage
                .on("pointerdown", (e) => tools!.onDown(e))
                .on("pointermove", (e) => tools!.onMove(e))
                .on("pointerup", (e) => tools!.onUp(e))
                .on("pointerupoutside", () => tools!.onUp);
        })();

        // Keyboard routing
        const onKeyDown = (e: KeyboardEvent) => tools?.onKeyDown(e);
        window.addEventListener("keydown", (e) => onKeyDown(e));

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            if (app.renderer) {
                app.destroy(true, { children: true, texture: true });
            }
        }
    }, []);

    return <div ref={hostRef} className="w-full h-full select-none" />
}
