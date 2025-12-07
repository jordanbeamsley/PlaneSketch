import { Application, Container, FederatedPointerEvent } from "pixi.js";
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
import { CameraController } from "./camera/cameraController";
import { ViewportService } from "./camera/viewportService";
import { GraphIndex } from "./graph/graphIndex";
import { PointerRouter } from "./input/pointer/pointerRouter";
import type { KeyboardRouter } from "./input/keyboard/KeyboardRouter";
import type { CommandContext } from "./input/commands/types";
import { useSelectStore } from "@/store/selectStore";
import { useSegmentStore } from "@/store/segmentStore";
import { useCircleStore } from "@/store/circleStore";
import { createDefaultKeyboardRouter } from "./input/keyboard";
import { deleteNodesAndIncidents } from "./graph/graphOps";
import { HistoryManager } from "./input/commands/historyManager";
import { createDefaultCommands } from "./input/commands/defaultCommands";

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
        let input: PointerRouter | null = null;
        let keyboardRouter: KeyboardRouter | null;

        (async () => {
            // Bootstrap pixiCanvas
            await app.init({ resizeTo: document.querySelector("#canvas-container") as HTMLElement, background: "#202124", antialias: true });
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
            const selectLayer = new Container({ label: "select" });
            const hudLayer = new Container(); // Snaps points, alignment lines, etc.

            edgeLayer.zIndex = 10;
            nodeLayer.zIndex = 20;
            previewLayer.zIndex = 30;
            selectLayer.zIndex = 40;
            hudLayer.zIndex = 50;

            const geometryLayers: GeometryLayers = {
                edges: edgeLayer,
                nodes: nodeLayer,
                preview: previewLayer,
            };

            // All geometry containers are scaled by the world container
            // Stage holds the world/ camera
            world.addChild(edgeLayer, nodeLayer, previewLayer, selectLayer);
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
                });
                viewport.setScale(camera.scale);
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


            // Stage interaction defaults
            app.stage.eventMode = "static";
            app.stage.hitArea = app.screen;
            app.stage.cursor = "crosshair";

            // Build command context and setup keyboard router
            const commandCtx: CommandContext = {
                input: {
                    isCanvasFocused: () => document.activeElement === app.canvas,
                },
                selection: {
                    hasAny: () => useSelectStore.getState().hasAny(),
                    delete: () => {
                        const selected = useSelectStore.getState().getByKind();
                        deleteNodesAndIncidents(graphIndex!, selected.nodes);
                        if (selected.segments.length) useSegmentStore.getState().removeMany(selected.segments);
                        if (selected.circles.length) useCircleStore.getState().removeMany(selected.circles);
                    }
                },
                tools: {
                    getActiveToolId: () => tools!.getActive(),
                    dispatchToActiveTool: (cmd, ctx) => tools!.executeCommand(cmd, ctx),
                    isInOperation: () => tools!.isInOperation()
                },
                graph: {
                    index: graphIndex
                }
            }

            // Setup History Buffer
            const history = new HistoryManager(commandCtx);

            const defaultCommands = createDefaultCommands(history);

            // Setup tool controller
            const toolContext: ToolContext = {
                snapEngine: snapEngine,
                snapOverlay: snapOverley,
                dataSource: snapDataCache,
                viewport: viewport,
                ticker: app.ticker,
                history: history
            };
            tools = new ToolController(toolContext, geometryLayers, selectLayer, graphIndex);


            // Make sure the canvas is focusable so shortcuts only work in stage
            app.canvas.tabIndex = 0;
            //app.canvas.focus();

            const keyboard = createDefaultKeyboardRouter({
                ctx: commandCtx,
                commands: defaultCommands,
                setCursor: (cursor) => { app.stage.cursor = cursor; },
                setShouldPan: (fn) => { if (input) input.shouldPan = fn; },
                target: app.canvas
            });
            keyboardRouter = keyboard.router;
            keyboardRouter.mount();

            // Input router
            // Single place for pointer and wheel events, emits high level events
            input = new PointerRouter(app, world);
            input.shouldPan = (e: FederatedPointerEvent) => e.buttons === 4 || keyboardRouter!.isSpacePressed();

            input.on("pointerDown", ({ world, modifiers }) => {
                // Don't delegate to tool if we're panning
                if (!keyboardRouter?.isSpacePressed()) tools?.onDown({ world, modifiers });
            });

            input.on("pointerMove", ({ world, modifiers }) => {
                // Don't delegate to tool if we're panning
                if (!keyboardRouter?.isSpacePressed()) tools?.onMove({ world, modifiers });
            });

            input.on("pointerUp", ({ world, modifiers }) => {
                // Don't delegate to tool if we're panning
                if (!keyboardRouter?.isSpacePressed()) tools?.onUp({ world, modifiers });
            })

            // Setup camera pan and zoom
            input.on("panByScreen", ({ dx, dy }) => {
                camera.panByScreen(dx, dy);
                redrawGridAndViewport();

                // Snap overlay is in screen space, so whenever we pan it becomes misaligned
                // Hide it and let it be picked up on the next mouse move
                snapOverley.hideOverlay();
            })

            input.on("zoomAt", ({ deltaTicks, screen }) => {
                camera.applyDeltaTicks(deltaTicks, screen);
                redrawGridAndViewport();

                // Snap overlay is in screen space, so whenever we zoom it becomes misaligned
                // Hide it and let it be picked up on the next mouse move
                snapOverley.hideOverlay();
            });

            // Attach input listeners
            input.mount();
        })();

        // Keyboard routing
        return () => {
            disposed = true;
            if (app.renderer) {
                app.destroy(true, { children: true, texture: true });
            }
            input?.unmount();
            keyboardRouter?.unmount();
            graphIndex?.unmount();
            sceneGraphics?.unmount();
            snapDataCache?.unmount();
        }
    }, []);

    return <div ref={hostRef} className="w-full h-full select-none" />
}
