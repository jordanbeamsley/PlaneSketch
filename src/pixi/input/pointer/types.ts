import type { Point } from "pixi.js";

export type Modifiers = Readonly<{
    alt: boolean;
    ctrl: boolean;
    meta: boolean;
    shift: boolean;
}>

// What pointer events emit
export interface RoutedPointer {
    // Pixel co-ordinates in view (screen space)
    screen: Point;
    // World co-ordinates after world transformations
    world: Point;
    // Mouse/ touch button bitmask
    buttons: number;
    // Modifier keys pressed while event occured
    modifiers: Modifiers;
}

// Zoom instruction for the camera controller
export interface ZoomPayload {
    // Zoom factor, >1 zoom in, <1 zoom out
    deltaTicks: number;
    // Screen space pixel position to anchor the zoom under
    screen: Point;
}


export type InputEventName =
    | "pointerDown"
    | "pointerMove"
    | "pointerUp"
    | "panByScreen"
    | "zoomAt";

// Mapping from event name to payload type
export interface InputEventPayloads {
    pointerDown: RoutedPointer;
    pointerMove: RoutedPointer;
    pointerUp: RoutedPointer;
    panByScreen: { dx: number, dy: number };
    zoomAt: ZoomPayload;
}
