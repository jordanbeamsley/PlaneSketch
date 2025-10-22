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
import { MAX_SCALE, MIN_SCALE } from "@/constants/canvas";
import { InputRouter } from "./input/inputRouter";
import { CameraController } from "./camera/cameraController";
import { ViewportService } from "./camera/viewportService";
import { GraphIndex } from "./graph/graphIndex";

export function PixiStage() {
    const hostRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!hostRef.current) return;

        let disposed = false;
        const app = new Application();
        let tools: ToolController | null = null;
        let snapDataCache: CachedDataSource | null = null;
        let graphIndex: GraphIndex | null = null;
        let sceneGraphics: SceneGraphics | null = null;
        let input: InputRouter | null = null;

        // For keybinding to enable panning
        let spacePressed: boolean = false;

        (async () => {
            // Bootstrap pixiCanvas
            await app.init({ resizeTo: window, background: "#202124", antialias: true });
            if (disposed) { app.destroy(true); return; }
            hostRef.current!.appendChild(app.canvas);

            // Camera container (handles zoom, pan, etc.)
            // All other geometry containers use world co-ords
            const world = new Container();
            world.eventMode = "passive";
            world.sortableChildren = true;

            // Build layer stack
            const edgeLayer = new Container();
            const nodeLayer = new Container();
            const previewLayer = new Container(); // Ghost shapes while drawing
            const hudLayer = new Container(); // Snaps points, alignment lines, etc.

            edgeLayer.zIndex = 10;
            nodeLayer.zIndex = 20;
            previewLayer.zIndex = 30;
            hudLayer.zIndex = 40;

            const geometryLayers: GeometryLayers = {
                edges: edgeLayer,
                nodes: nodeLayer,
                preview: previewLayer,
            };

            // All geometry containers are scaled by the world container
            // Stage holds the world/ camera
            world.addChild(edgeLayer, nodeLayer, previewLayer);
            app.stage.addChild(world, hudLayer);

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

            // Adapable grid overlay, sits in screen space
            const sceneGrid = new SceneGrid(() => camera.ticks);
            app.stage.addChild(sceneGrid);

            // Create Viewport service
            const viewport = new ViewportService();
            viewport.setTransform((p) => world.toGlobal(p), (p) => world.toLocal(p));

            // Create grid overlay
            const redrawGridAndViewport = () => {
                sceneGrid.draw(world, app.screen.width, app.screen.height);
                const offset = sceneGrid.getOffsetPx();
                viewport.setGrid({
                    step: sceneGrid.getStepPx(),
                    offsetX: offset.x,
                    offsetY: offset.y
                })
            };

            redrawGridAndViewport();
            app.renderer.on("resize", () => redrawGridAndViewport());

            // Setup scene renderer and topology graph
            graphIndex = new GraphIndex();
            graphIndex.mount();
            sceneGraphics = new SceneGraphics(geometryLayers, graphIndex);
            sceneGraphics.mount();

            // Setup snapping engine
            snapDataCache = new CachedDataSource();
            snapDataCache.mount();
            const snapOverley = new SnapOverlay(hudLayer, viewport);
            snapOverley.initSprites(app.renderer);
            const snapEngine = createDefaultSnapEngine();

            // Setup tool controller
            const toolContext: ToolContext = {
                snapEngine: snapEngine, snapOverlay: snapOverley, dataSource: snapDataCache, viewport: viewport
            };
            tools = new ToolController(toolContext, geometryLayers);

            // Stage interaction defaults
            app.stage.eventMode = "static";
            app.stage.hitArea = app.screen;
            app.stage.cursor = "crosshair";

            // Input router
            // Single place for pointer and wheel events, emits high level events
            input = new InputRouter(app, world);

            // Route pointer events to tools with world only co-ords
            // Don't call tools pointer handlers if we're panning
            input.on("pointerDown", ({ world, modifiers }) => {
                if (!spacePressed) tools?.onDown({ world, modifiers })
            });
            input.on("pointerMove", ({ world, modifiers }) => {
                if (!spacePressed) tools?.onMove({ world, modifiers })
            });

            // Setup camera pan and zoom
            input.on("panByScreen", ({ dx, dy }) => {
                camera.panByScreen(dx, dy);
                redrawGridAndViewport();
            })

            input.on("zoomAt", ({ deltaTicks, screen }) => {
                camera.applyDeltaTicks(deltaTicks, screen);
                redrawGridAndViewport();
            });

            // Default panning gate
            input.shouldPan = (e) => e.buttons === 4 || spacePressed;

            // Attach input listeners
            input.mount();
        })();

        // Keyboard routing
        const onKeyDown = (e: KeyboardEvent) => {
            // First check if space is pressed to enable panning
            if (e.code === "Space") {
                spacePressed = true;
                app.stage.cursor = "grab";
                e.preventDefault();
            }
            // Then delegate to tools
            tools?.onKeyDown(e);

        }

        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                spacePressed = false;
                app.stage.cursor = "crosshair";
            }
        }

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);

        return () => {
            disposed = true;

            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            input?.unmount();
            if (app.renderer) {
                app.destroy(true, { children: true, texture: true });
            }
            graphIndex?.unmount();
            sceneGraphics?.unmount();
            snapDataCache?.unmount();
        }
    }, []);

    return <div ref={hostRef} className="w-full h-full select-none" />
}
