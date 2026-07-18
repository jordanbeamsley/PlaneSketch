import { Application, Container, FederatedPointerEvent, Point } from "pixi.js";
import { SessionManager } from "../editor/session/sessionManager";
import type { DocumentStore } from "../editor/stores/createDocumentStore";
import type { GeometryLayers } from "../models/canvas/stage";
import { CameraController } from "../camera/cameraController";
import { MAX_SCALE, MIN_SCALE } from "../constants/canvas";
import { ViewportService } from "../camera/viewportService";
import { SceneGrid } from "../scene/sceneGrid";
import { SceneGraphics } from "../scene/sceneGraphics";
import { createSnapDataSource } from "../snap/createSnapDataSource";
import type { CommandContext } from "../input/commands/types";
import type { ToolContext } from "../tools/baseTool";
import { ToolController } from "../tools/ToolController";
import { createDefaultCommands } from "../input/commands/defaultCommands";
import { createDefaultKeyboardRouter } from "../input/keyboard";
import type { KeyboardRouter } from "../input/keyboard/KeyboardRouter";
import { PointerRouter } from "../input/pointer/pointerRouter";
import { PlaneGcsSolver } from "@/gcs/gcsFacade";
import { ConstraintEngine } from "../constraints/constraintsEngine";
import { SnapService } from "../snap/snapService";

export type CadRuntime = {
    app: Application;
    canvas: HTMLCanvasElement;
    destroy(): void;
    focus(): void;
};

export async function createCadRuntime(args: {
    host: HTMLElement;
    sessionManager: SessionManager;
    documentStore: DocumentStore;
}): Promise<CadRuntime> {
    const { host, sessionManager, documentStore } = args;

    const app = new Application();
    await app.init({
        resizeTo: host,
        background: "#202124",
        antialias: true,
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
    selectLayer.zIndex = 40;
    hudLayer.zIndex = 50;

    const geometryLayers: GeometryLayers = {
        edges: edgeLayer,
        nodes: nodeLayer,
        preview: previewLayer,
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
        limits: { minScale: MIN_SCALE, maxScale: MAX_SCALE },
    });

    // Default origin at centre of screen
    camera.panByScreen(app.screen.width / 2, app.screen.height / 2);

    const viewport = new ViewportService();
    viewport.setTransform(
        (p) => world.toGlobal(p),
        (p) => world.toLocal(p),
    );

    const sceneGrid = new SceneGrid(() => camera.ticks);
    app.stage.addChild(sceneGrid);

    const redrawGridAndViewport = () => {
        sceneGrid.draw(world, app.screen.width, app.screen.height);
        const offset = sceneGrid.getOffsetPx();
        viewport.setGrid({
            step: sceneGrid.getStepPx(),
            offsetX: offset.x,
            offsetY: offset.y,
        });
        viewport.setScale(camera.scale);
    };

    let prevW = app.screen.width;
    let prevH = app.screen.height;

    redrawGridAndViewport();
    app.renderer.on("resize", () => {
        const newW = app.screen.width;
        const newH = app.screen.height;

        // Keep the world-space point that was at the old screen center pinned to the new center
        const worldCenter = world.toLocal(new Point(prevW / 2, prevH / 2));
        world.position.set(
            newW / 2 - worldCenter.x * camera.scale,
            newH / 2 - worldCenter.y * camera.scale,
        );

        prevW = newW;
        prevH = newH;

        redrawGridAndViewport();
    });

    // ============== Session bound services ==============
    const getSession = () => sessionManager.active;

    const sceneGraphics = new SceneGraphics({
        layers: geometryLayers,
        getGeometry: () => getSession().geometry,
        getGraph: () => getSession().graphIndex,
        getSelect: () => getSession().selection,
    });

    // ============== GCS Solver + Constraint Engine ==============
    const solver = await PlaneGcsSolver.create();
    const constraintEngine = new ConstraintEngine(
        getSession().geometry,
        getSession().constraints,
        solver,
    );

    // ============== Commands / History ==============
    const commandCtx: CommandContext = {
        input: {
            isCanvasFocused: () => document.activeElement === app.canvas,
        },
        selection: {
            getSelection: () => getSession().selection,
            hasAny: () => getSession().selection.getState().hasAny(),
        },
        constraint: {
            getConstraints: () => getSession().constraints,
            getConstraintEngine: () => constraintEngine,
        },
        tools: {
            getActiveToolId: () => tools.getActive(),
            dispatchToActiveTool: (cmd, ctx) => tools.executeCommand(cmd, ctx),
            isInOperation: () => tools.isInOperation(),
        },
        geometry: {
            getGeometry: () => getSession().geometry,
        },
        graph: {
            getGraph: () => getSession().graphIndex,
        },
    };

    getSession().setHistory(commandCtx);
    const defaultCommands = createDefaultCommands(getSession().history);
    
    // ============== Snapping ==============

    const snapDataSource = createSnapDataSource({
        getSession,
        docs: documentStore,
    });


    const snapService = new SnapService(snapDataSource, viewport, hudLayer, app.ticker);
    snapService.initOverlay(app.renderer);


    // ============== Tools ==============
    const toolContext: ToolContext = {
        viewport,
        hideOverlay: () => snapService.hideOverlay(),
        getSnap: () => snapService.lastOutcome,
        getHistory: () => getSession().history,
        getSelect: () => getSession().selection,
        getGeometry: () => getSession().geometry,
        getGraph: () => getSession().graphIndex,
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

    // ============== Coordinate Indicator ==============
    const coordLabel = document.createElement("div");
    coordLabel.style.cssText =
        "position:absolute;bottom:8px;right:8px;font:11px/1 monospace;" +
        "color:rgba(255,255,255,0.45);pointer-events:none;user-select:none;";
    host.style.position = "relative";
    host.appendChild(coordLabel);

        // ============== Input Router ==============
    const input = new PointerRouter(app, world);

    input.shouldPan = (e: FederatedPointerEvent) =>
        e.buttons === 4 || keyboardRouter.isSpacePressed();

    input.on("pointerDown", ({modifiers}) => {
        const snapOutcome = snapService.lastOutcome;

        if (!keyboardRouter.isSpacePressed())
            tools.onDown(snapOutcome, modifiers);
    });

    input.on("pointerMove", ({ screen: sp, world: wp, modifiers }) => {
        const snapOutcome = snapService.snap(wp, sp);

        coordLabel.textContent = `${snapOutcome.p.x.toFixed(2)},  ${snapOutcome.p.y.toFixed(2)}`;

        if (!keyboardRouter.isSpacePressed())
            tools.onMove({ world: new Point(snapOutcome.p.x, snapOutcome.p.y), modifiers });
    });

    input.on("pointerUp", ({ world, modifiers }) => {
        if (!keyboardRouter.isSpacePressed()) tools.onUp({ world, modifiers });
    });

    input.on("panByScreen", ({ dx, dy }) => {
        camera.panByScreen(dx, dy);
        redrawGridAndViewport();
        snapService.hideOverlay();
    });

    input.on("zoomAt", ({ deltaTicks, screen }) => {
        camera.applyDeltaTicks(deltaTicks, screen);
        redrawGridAndViewport();
        snapService.hideOverlay();
    });

    input.mount();

    // ============== Resize Handling ==============
    // Pixi's built-in resizeTo only listens to window resize events.
    // This observer catches container-level resizes (e.g. resizable panel drags).
    const resizeObserver = new ResizeObserver(() => app.resize());
    resizeObserver.observe(host);

    // ============== Memory Cleanup ==============
    const destroy = () => {
        resizeObserver.disconnect();
        coordLabel.remove();

        // Unmount listeners first
        input.unmount();
        keyboardRouter.unmount();
        sceneGraphics.unbind();
        constraintEngine.dispose();
        tools.destroy();
        snapService.unmount();

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
