import { Application, Container, FederatedPointerEvent } from "pixi.js"
import { SessionManager } from "../editor/session/sessionManager";
import type { DocumentStore } from "../editor/stores/createDocumentStore";
import type { GeometryLayers } from "../models/canvas/stage";
import { CameraController } from "../camera/cameraController";
import { MAX_SCALE, MIN_SCALE } from "../constants/canvas";
import { ViewportService } from "../camera/viewportService";
import { SceneGrid } from "../scene/sceneGrid";
import { SceneGraphics } from "../scene/sceneGraphics";
import { createDefaultSnapEngine } from "../snap";
import { createSnapDataSource } from "../snap/createSnapDataSource";
import { SnapOverlay } from "../snap/overlay";
import type { CommandContext } from "../input/commands/types";
import type { ToolContext } from "../tools/baseTool";
import { ToolController } from "../tools/ToolController";
import { createDefaultCommands } from "../input/commands/defaultCommands";
import { createDefaultKeyboardRouter } from "../input/keyboard";
import type { KeyboardRouter } from "../input/keyboard/KeyboardRouter";
import { PointerRouter } from "../input/pointer/pointerRouter";

export type CadRuntime = {
    app: Application;
    canvas: HTMLCanvasElement;
    destroy(): void;
    focus(): void;
}

export async function createCadRuntime(args: {
    host: HTMLElement,
    sessionManager: SessionManager,
    documentStore: DocumentStore
}): Promise<CadRuntime> {
    const { host, sessionManager, documentStore } = args;

    const app = new Application();
    await app.init({
        resizeTo: host,
        background: "#202124",
        antialias: true
    });

    host.appendChild(app.canvas);

    // ============== STAGE / LAYERS ==============
    const world = new Container();
    world.eventMode = "passive";
    world.sortableChildren = true;

    const edgeLayer = new Container(); // segments, circles, etc.
    const nodeLayer = new Container(); // nodes only
    const previewLayer = new Container(); // Ghost shapes before drawing is committed
    const selectLayer = new Container(); // Marquee drawing
    const hudLayer = new Container(); // Snap points, alignment lines, etc.

    edgeLayer.zIndex = 10;
    nodeLayer.zIndex = 20;
    previewLayer.zIndex = 30;
    selectLayer.zIndex = 40
    hudLayer.zIndex = 50;

    const geometryLayers: GeometryLayers = {
        edges: edgeLayer,
        nodes: nodeLayer,
        preview: previewLayer
    };

    // All geometry exists in world space
    world.addChild(edgeLayer, nodeLayer, previewLayer, selectLayer);
    // Only hud layer exists in screen space
    app.stage.addChild(world, hudLayer);

    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;
    app.stage.cursor = "crosshair";

    // Make canvas focusable
    app.canvas.tabIndex = 0;

    // ============== Camera / Viewport / Grid ==============
    const camera = new CameraController({
        world: world,
        getViewportSize: () => ({ w: app.screen.width, h: app.screen.height }),
        limits: { minScale: MIN_SCALE, maxScale: MAX_SCALE }
    });

    // Default origin at centre of screen
    camera.panByScreen(app.screen.width / 2, app.screen.height / 2);

    const viewport = new ViewportService();
    viewport.setTransform((p) => world.toGlobal(p), (p) => world.toLocal(p));

    const sceneGrid = new SceneGrid(() => camera.ticks);
    app.stage.addChild(sceneGrid);

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

    // ============== Session bound services ==============
    const getSession = () => sessionManager.active;

    const sceneGraphics = new SceneGraphics({
        layers: geometryLayers,
        getGeometry: () => getSession().geometry,
        getGraph: () => getSession().graphIndex,
        getSelect: () => getSession().selection
    });

    // ============== Snapping ==============
    const snapEngine = createDefaultSnapEngine();

    const snapDataSource = createSnapDataSource({
        getSession,
        docs: documentStore
    });

    const snapOverlay = new SnapOverlay(hudLayer, viewport);
    snapOverlay.initSprites(app.renderer);

    // ============== Commands / History ==============
    const commandCtx: CommandContext = {
        input: {
            isCanvasFocused: () => document.activeElement === app.canvas,
        },
        selection: {
            getSelection: () => getSession().selection,
            hasAny: () => getSession().selection.getState().hasAny(),
        },
        tools: {
            getActiveToolId: () => tools.getActive(),
            dispatchToActiveTool: (cmd, ctx) => tools.executeCommand(cmd, ctx),
            isInOperation: () => tools.isInOperation(),
        },
        geometry: {
            getGeometry: () => getSession().geometry
        },
        graph: {
            getGraph: () => getSession().graphIndex,
        },
    };

    getSession().setHistory(commandCtx);
    const defaultCommands = createDefaultCommands(getSession().history);


    // ============== Tools ==============
    const toolContext: ToolContext = {
        snapEngine,
        snapOverlay,
        dataSource: snapDataSource,
        viewport,
        ticker: app.ticker,
        getHistory: () => getSession().history,
        getSelect: () => getSession().selection,
        getGeometry: () => getSession().geometry,
        getGraph: () => getSession().graphIndex
    };

    const tools = new ToolController(toolContext, geometryLayers, selectLayer);

    // ============== Keyboard Router ==============
    const keyboard = createDefaultKeyboardRouter({
        ctx: commandCtx,
        commands: defaultCommands,
        setCursor: (cursor) => {
            app.stage.cursor = cursor;
        },
        setShouldPan: (fn) => {
            if (input) input.shouldPan = fn;
        },
        target: app.canvas,
    });

    const keyboardRouter: KeyboardRouter = keyboard.router;
    keyboardRouter.mount();

    // ============== Input Router ==============
    const input = new PointerRouter(app, world);

    input.shouldPan = (e: FederatedPointerEvent) =>
        e.buttons === 4 || keyboardRouter.isSpacePressed();

    input.on("pointerDown", ({ world, modifiers }) => {
        if (!keyboardRouter.isSpacePressed()) tools.onDown({ world, modifiers });
    });

    input.on("pointerMove", ({ world, modifiers }) => {
        if (!keyboardRouter.isSpacePressed()) tools.onMove({ world, modifiers });
    });

    input.on("pointerUp", ({ world, modifiers }) => {
        if (!keyboardRouter.isSpacePressed()) tools.onUp({ world, modifiers });
    });

    input.on("panByScreen", ({ dx, dy }) => {
        camera.panByScreen(dx, dy);
        redrawGridAndViewport();
        snapOverlay.hideOverlay();
    });

    input.on("zoomAt", ({ deltaTicks, screen }) => {
        camera.applyDeltaTicks(deltaTicks, screen);
        redrawGridAndViewport();
        snapOverlay.hideOverlay();
    });

    input.mount();


    // ============== Memory Cleanup ==============
    const destroy = () => {
        // Unmount listeners first 
        input.unmount();
        keyboardRouter.unmount();
        sceneGraphics.unbind();
        tools.destroy();

        // Then destroy pixi
        app.destroy(true, { children: true, texture: true });
    };

    return {
        app,
        canvas: app.canvas,
        destroy,
        focus: () => app.canvas.focus(),
    };
}
