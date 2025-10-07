import { Graphics, RenderTexture, Sprite, type Container, type Renderer } from "pixi.js";
import type { SnapKind, SnapResult } from "./types";
import type { Vec2 } from "@/models/vectors";
import { SNAP_ICON_SIZE, SNAP_STROKE } from "@/constants/canvas";

type IconKind = Exclude<SnapKind, "none">;

export class SnapOverlay {

    // Guide layer, node hover, on edge hover, etc.
    private layer: Container;
    // transform to screen space callback
    private transform: (p: Vec2) => Vec2;

    // One sprite per icon kind, create once
    // Render call will make 1 icon visible at snap result
    private sprites = new Map<IconKind, Sprite>();
    private textures = new Map<IconKind, RenderTexture>();
    private active?: IconKind;

    constructor(layer: Container, transformToScreen: (p: Vec2) => Vec2) {
        this.layer = layer;
        this.transform = (p: Vec2) => transformToScreen(p);
    }

    // Initialise sprites once pixi renderer is available
    // Maybe change to it's own HUD render group later
    initSprites(renderer: Renderer) {
        // Create RenderTexture from graphic, destroy graphic after
        const makeTexture = (g: Graphics, size: number) => {
            const texture = RenderTexture.create({ width: size, height: size, resolution: window.devicePixelRatio });
            renderer.render({ container: g, target: texture });
            g.destroy();
            return texture;
        }

        const makeSprite = (kind: IconKind, draw: (g: Graphics, s: number) => void) => {
            const g = new Graphics();
            draw(g, SNAP_ICON_SIZE);
            const texture = makeTexture(g, SNAP_ICON_SIZE);
            this.textures.set(kind, texture);

            const sprite = new Sprite(texture);
            sprite.visible = false;
            sprite.eventMode = "none";
            // Centre the sprite anchor
            sprite.anchor.set(0.5);


            this.layer.addChild(sprite);
            this.sprites.set(kind, sprite);
        }

        makeSprite("node", (g, s) => {
            g.rect(1, 1, s - 1, s - 1).stroke(SNAP_STROKE);
        })

        makeSprite("origin", (g, s) => {
            g.rect(1, 1, s - 1, s - 1).stroke(SNAP_STROKE);
        })
    }

    render(result: SnapResult) {
        // Hide previous snap sprite
        if (this.active) {
            const prev = this.sprites.get(this.active);
            if (prev) prev.visible = false;
            this.active = undefined;
        }

        if (result.kind === "none") return;

        const sprite = this.sprites.get(result.kind);
        if (!sprite) return;

        const pt = this.transform(result.p);
        sprite.position.set(pt.x, pt.y);
        sprite.visible = true;
        this.active = result.kind;
    }
}
