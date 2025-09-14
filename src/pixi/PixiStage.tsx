import { Application, Container } from "pixi.js";
import { useEffect, useRef } from "react";
import { GridOverlay } from "./overlay/gridOverlay";
import { ToolController } from "./tools/ToolController";

export function PixiStage() {
    const hostRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!hostRef.current) return;
        const app = new Application();

        (async () => {
            // Bootstrap pixiCanvas
            await app.init({ resizeTo: window, background: "#202124", antialias: true });
            hostRef.current!.appendChild(app.canvas);

            // Build layer stack
            const sketchLayer = new Container();
            const nodeLayer = new Container();
            const previewLayer = new Container();
            const gridLayer = new GridOverlay();

            previewLayer.zIndex = 20;
            nodeLayer.zIndex = 10;
            gridLayer.zIndex = -1;

            app.stage.addChild(sketchLayer, nodeLayer, gridLayer, previewLayer);

            // Create canvas grid overlay
            gridLayer.draw(app.screen.width, app.screen.height);
            app.renderer.on("resize", (w, h) => gridLayer.draw(w, h));

            // Create node container on top of sketch
            const tools = new ToolController({ sketch: sketchLayer, nodes: nodeLayer, preview: previewLayer, grid: gridLayer });

            app.stage.eventMode = "static";
            app.stage.hitArea = app.screen;
            app.stage.cursor = "crosshair";
            app.stage
                .on("pointerdown", (e) => tools.onDown(e))
                .on("pointermove", (e) => tools.onMove(e))
                .on("pointerup", (e) => tools.onUp(e))
                .on("pointerupoutside", () => tools.onUp);
        })();
        //return () => app.destroy(true, {children: true, texture: true});
    }, []);

    return <div ref={hostRef} className="w-full h-full select-none" />
}
