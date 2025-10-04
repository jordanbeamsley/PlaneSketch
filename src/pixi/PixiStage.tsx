import { Application, Container, Graphics } from "pixi.js";
import { useEffect, useRef } from "react";
import { ToolController } from "./tools/ToolController";
import { SnapOverlay } from "./snap/overlay";
import { CachedDataSource } from "./snap/cachedDataSource";
import { createDefaultSnapEngine } from "./snap";
import type { GeometryLayers } from "@/models/stage";
import { SceneGrid } from "./scene/sceneGrid";
import { SceneGraphics } from "./scene/sceneGraphics";
import type { ToolContext } from "./tools/baseTool";
import { CameraController } from "./scene/cameraController";
import { MAX_SCALE, MIN_SCALE } from "@/constants/canvas";
import { InputRouter } from "./input/inputRouter";
import { NODE_COLOR } from "@/constants/drawing";

export function PixiStage() {
    const hostRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!hostRef.current) return;

        const app = new Application();
        let tools: ToolController | null = null;
        let snapDataCache: CachedDataSource | null = null;
        let sceneGraphics: SceneGraphics | null = null;
        let input: InputRouter | null = null;

        (async () => {
            // Bootstrap pixiCanvas
            await app.init({ resizeTo: window, background: "#202124", antialias: true });
            hostRef.current!.appendChild(app.canvas);

            // Camera container (handles zoom, pan, etc.)
            // All other containers use world co-ords
            const world = new Container();
            world.eventMode = "passive";
            world.sortableChildren = true;

            // Adapable grid overlay, sits in screen space
            const sceneGrid = new SceneGrid();
            app.stage.addChild(sceneGrid);

            // Build layer stack
            const edgeLayer = new Container();
            const nodeLayer = new Container();
            const previewLayer = new Container(); // Ghost shapes while drawing
            const guidesLayer = new Container(); // Snaps points, alignment lines, etc.

            edgeLayer.zIndex = 10;
            nodeLayer.zIndex = 20;
            previewLayer.zIndex = 30;
            guidesLayer.zIndex = 40;

            const geometryLayers: GeometryLayers = {
                edges: edgeLayer,
                nodes: nodeLayer,
                preview: previewLayer,
            };

            // All containers are scaled by the world container
            // Stage holds the world/ camera
            world.addChild(edgeLayer, nodeLayer, previewLayer, guidesLayer);
            app.stage.addChild(world);

            // Setup world camera
            // Controls all zoom/ pan operations
            const getViewportSize = () => ({ w: app.screen.width, h: app.screen.height })
            const camera = new CameraController({
                world: world,
                getViewportSize: getViewportSize,
                limits: { minScale: MIN_SCALE, maxScale: MAX_SCALE }
            });

            // Set origin to centre of screen by default
            camera.panByScreen(app.screen.width / 2, app.screen.height / 2);

            // Create grid overlay
            const redrawGrid = () => sceneGrid.draw(world, app.screen.width, app.screen.height);
            redrawGrid();
            app.renderer.on("resize", () => redrawGrid());

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

            // Stage interaction defaults
            app.stage.eventMode = "static";
            app.stage.hitArea = app.screen;
            app.stage.cursor = "crosshair";

            // Input router
            // Single place for pointer and wheel events, emits high level events
            input = new InputRouter(app, world);

            // Route pointer events to tools with world only co-ords
            input.on("pointerDown", ({ world }) => tools?.onDown({ world }));
            input.on("pointerMove", ({ world }) => tools?.onMove({ world }));

            // Setup camera pan and zoom
            input.on("panByScreen", ({ dx, dy }) => {
                camera.panByScreen(dx, dy);
                redrawGrid();
            })

            input.on("zoomAt", ({ factor, screen }) => {
                camera.zoomAtScreenPoint(factor, screen);
                redrawGrid();
            });

            // Default panning gate
            input.shouldPan = (e) => e.buttons === 4;

            // Attach input listeners
            input.mount();

            // TEMP origin point, while debugging grid
            const origin = new Graphics();
            world.addChild(origin);
            origin.circle(0, 0, 3).fill(NODE_COLOR);
        })();

        // Keyboard routing
        const onKeyDown = (e: KeyboardEvent) => tools?.onKeyDown(e);
        window.addEventListener("keydown", (e) => onKeyDown(e));

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            input?.umount();
            if (app.renderer) {
                app.destroy(true, { children: true, texture: true });
            }
            sceneGraphics?.umount();
            snapDataCache?.umount();
        }
    }, []);

    return <div ref={hostRef} className="w-full h-full select-none" />
}
