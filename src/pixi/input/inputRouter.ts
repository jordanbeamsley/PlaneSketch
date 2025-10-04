import { Point, type Application, type Container, type FederatedPointerEvent } from "pixi.js";

type Handler<T> = (payload: T) => void;

class TinyEmitter<Events extends Record<string, any>> {
    private map = new Map<keyof Events, Set<Function>>();

    on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): this {
        let set = this.map.get(event);
        if (!set) { set = new Set(); this.map.set(event, set); }
        set.add(handler as any);
        return this;
    }

    off<K extends keyof Events>(event: K, handler: Handler<Events[K]>): this {
        const set = this.map.get(event);
        if (set) set.delete(handler as any);
        return this;
    }

    emit<K extends keyof Events>(event: K, payload: Events[K]): boolean {
        const set = this.map.get(event);
        if (!set || set.size === 0) return false;
        for (const fn of set) (fn as Handler<Events[K]>)(payload);
        return true;
    }

    removeAll(): void { this.map.clear(); }
}
// What pointer events emit
export interface RoutedPointer {
    // Pixel co-ordinates in view (screen space)
    screen: Point;
    // World co-ordinates after world transformations
    world: Point;
    // Mouse/ touch button bitmask
    buttons: number;
}

// Zoom instruction for the camera controller
export interface ZoomPayload {
    // Zoom factor, >1 zoom in, <1 zoom out
    factor: number;
    // Screen space pixel position to anchor the zoom under
    screen: Point;
}

type InputEventName =
    | "pointerDown"
    | "pointerMove"
    | "pointerUp"
    | "panByScreen"
    | "zoomAt";

// Mapping from event name to payload type
interface InputEventPayloads {
    pointerDown: RoutedPointer;
    pointerMove: RoutedPointer;
    pointerUp: RoutedPointer;
    panByScreen: { dx: number, dy: number };
    zoomAt: ZoomPayload;
}

export class InputRouter extends TinyEmitter<InputEventPayloads> {
    // Pixi app for pointer events
    private app: Application;
    // World container used for screen -> world conversions
    private world: Container;
    // Canvas element we attach wheel/ trackpad events to
    private viewEl: HTMLCanvasElement;
    // Unsubscribe callbacks for teardown
    private subs: Array<() => void> = [];
    // True while in a panning session (i.e press -> drag -> release)
    private isPanning: boolean = false;
    // Last screen position while panning (for computing dx, dy)
    private lastScreen = new Point();

    // Callback to decide whether panning should start/ continue based on pointer event
    // Default: only when middle mouse button is down
    // This can be overwritten to enable LMB+space or dedicated "Pan Tool"
    public shouldPan: (e: FederatedPointerEvent) => boolean = (e) => e.buttons === 4;

    constructor(app: Application, world: Container) {
        super();
        this.app = app;
        this.world = world;

        this.viewEl = this.app.canvas;
    }

    // Subscribe with type-checked payloads
    public override on<K extends InputEventName>(
        event: K,
        listener: (payload: InputEventPayloads[K]) => void
    ): this {
        return super.on(event, listener);
    }

    // Emit with type-checked payloads
    public override emit<K extends InputEventName>(
        event: K,
        payload: InputEventPayloads[K]
    ): boolean {
        return super.emit(event, payload);
    }

    // Attach Pixi + DOM listeners
    public mount(): void {
        // --- Pixi pointer events (down,move,up) ----------------------------------------
        const onDown = (e: FederatedPointerEvent) => {
            const screen = e.global.clone();
            const world = this.world.toLocal(screen);
            this.emit("pointerDown", { screen, world, buttons: e.buttons });

            // If we should be panning, then start a session
            if (this.shouldPan(e)) {
                this.isPanning = true;
                this.lastScreen.copyFrom(screen);
            }
        }

        const onMove = (e: FederatedPointerEvent) => {
            const screen = e.global.clone();
            const world = this.world.toLocal(screen);
            this.emit("pointerMove", { screen, world, buttons: e.buttons });

            // If we are panning, emit dx/dy in screen pixels
            // Panning should be relative to screen space, not world transformations
            if (this.isPanning) {
                const dx = screen.x - this.lastScreen.x;
                const dy = screen.y - this.lastScreen.y;
                this.emit("panByScreen", { dx, dy });
                this.lastScreen.copyFrom(screen);
            }
        }

        const onUp = (e: FederatedPointerEvent) => {
            const screen = e.global.clone();
            const world = this.world.toLocal(screen);
            this.emit("pointerUp", { screen, world, buttons: e.buttons });
            // Always end panning session on pointer up
            this.isPanning = false;
        }

        this.app.stage.on("pointerdown", onDown);
        this.app.stage.on("pointermove", onMove);
        this.app.stage.on("pointerup", onUp);
        this.app.stage.on("pointerupoutside", onUp);

        this.subs.push(() => {
            this.app.stage.off("pointerdown", onDown);
            this.app.stage.off("pointermove", onMove);
            this.app.stage.off("pointerup", onUp);
            this.app.stage.off("pointerupoutside", onUp);
        });

        // --- DOM wheel / trackpad scroll (zoom-at-cursor) -----------------------------
        // Listen on the stages <canvas> directly, wheel is a DOM event
        const onWheel = (ev: WheelEvent) => {
            // Prevent page scrolling while interacting with the canvas
            ev.preventDefault();

            // Normalise the wheel delta to pixels. deltaMode: 0=pixels, 1=lines (~16px)
            const LINE = 16;
            const dyPx = ev.deltaY * (ev.deltaMode === 1 ? LINE : 1);

            // Heuristic
            // - small deltas (trackpad) -> gentle factor (~1.03 per step)
            // - large deltas (mouse wheel) -> chunkier (~1.10 per step) 
            const base = Math.abs(dyPx) < 30 ? 1.03 : 1.10;
            const steps = Math.max(1, Math.min(10, Math.round(Math.abs(dyPx) / 100)));
            const zoomIn = dyPx < 0;
            const factor = zoomIn ? Math.pow(base, steps) : Math.pow(1 / base, steps);

            // Calculate screen space anchor (relative to canvas)
            const rect = this.viewEl.getBoundingClientRect();
            const screen = new Point(ev.clientX - rect.left, ev.clientY - rect.top);

            this.emit("zoomAt", { factor, screen });
        }

        this.viewEl.addEventListener("wheel", onWheel, { passive: false });
        this.subs.push(() => this.viewEl.removeEventListener("wheel", onWheel));
    }

    public umount(): void {
        this.subs.splice(0).forEach((off) => off());
    }
}
