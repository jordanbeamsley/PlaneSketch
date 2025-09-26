import { Application, Container } from "pixi.js";
import { useEffect, useRef } from "react";
import { ToolController } from "./tools/ToolController";
import { SnapOverlay } from "./snap/overlay";
import { CachedDataSource } from "./snap/cachedDataSource";
import { createDefaultSnapEngine } from "./snap";
import type { GeometryLayers } from "@/models/stage";
import { SceneGrid } from "./scene/sceneGrid";
import { SceneGraphics } from "./scene/sceneGraphics";
import type { ToolContext } from "./tools/baseTool";

export function PixiStage() {
    const hostRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!hostRef.current) return;

        const app = new Application();
        let tools: ToolController | null = null;
        let snapDataCache: CachedDataSource | null = null;
        let sceneGraphics: SceneGraphics | null = null;

        (async () => {
            // Bootstrap pixiCanvas
            await app.init({ resizeTo: window, background: "#202124", antialias: true });
            hostRef.current!.appendChild(app.canvas);

            // Build layer stack
            const gridLayer = new SceneGrid();
            const edgeLayer = new Container();
            const nodeLayer = new Container();
            const previewLayer = new Container(); // Ghost shapes while drawing
            const guidesLayer = new Container(); // Snaps points, alignment lines, etc.

            gridLayer.zIndex = -1;
            edgeLayer.zIndex = 10;
            nodeLayer.zIndex = 20;
            previewLayer.zIndex = 30;
            guidesLayer.zIndex = 40;

            const geometryLayers: GeometryLayers = {
                edges: edgeLayer,
                nodes: nodeLayer,
                preview: previewLayer,
            };

            // Add layer stack to pixi stage
            app.stage.addChild(gridLayer, edgeLayer, nodeLayer, previewLayer, guidesLayer);

            // Create grid overlay
            gridLayer.draw(app.screen.width, app.screen.height);
            app.renderer.on("resize", (w, h) => gridLayer.draw(w, h));

            // Setup scene renderer
            sceneGraphics = new SceneGraphics(geometryLayers);
            sceneGraphics.mount();

            // Setup snapping engine
            snapDataCache = new CachedDataSource();
            snapDataCache.mount();
            const snapOverley = new SnapOverlay(guidesLayer);
            const snapEngine = createDefaultSnapEngine();

            // Setup tool controller
            const toolContext: ToolContext = { snapEngine: snapEngine, snapOverlay: snapOverley, dataSource: snapDataCache }
            tools = new ToolController(toolContext, geometryLayers);

            // Set up pointer listeners
            app.stage.eventMode = "static";
            app.stage.hitArea = app.screen;
            app.stage.cursor = "crosshair";
            app.stage
                .on("pointerdown", (e) => tools!.onDown(e))
                .on("pointermove", (e) => tools!.onMove(e))
        })();

        // Keyboard routing
        const onKeyDown = (e: KeyboardEvent) => tools?.onKeyDown(e);
        window.addEventListener("keydown", (e) => onKeyDown(e));

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            if (app.renderer) {
                app.destroy(true, { children: true, texture: true });
            }
            sceneGraphics?.umount();
            snapDataCache?.umount();
        }
    }, []);

    return <div ref={hostRef} className="w-full h-full select-none" />
}
