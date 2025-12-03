import { Graphics, RenderTexture, Sprite, type Container, type Renderer } from "pixi.js";
import type { SnapKind, SnapResult } from "./types";
import { SNAP_ICON_SIZE, SNAP_STROKE } from "@/constants/canvas";
import type { Viewport } from "../camera/viewportService";

type IconKind = Exclude<SnapKind, "none">;

export class SnapOverlay {

    // HUD layer, node hover, on edge hover, etc.
    private layer: Container;

    private viewport: Viewport;

    // One sprite per icon kind, create once
    // Render call will make 1 icon visible at snap result
    private sprites = new Map<IconKind, Sprite>();
    private textures = new Map<IconKind, RenderTexture>();

    constructor(layer: Container, viewport: Viewport) {
        this.layer = layer;
        this.viewport = viewport;
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

        const makeSprite = (kind: IconKind, anchor: { x: number, y: number }, draw: (g: Graphics, s: number) => void) => {
            const g = new Graphics();
            draw(g, SNAP_ICON_SIZE);
            const texture = makeTexture(g, SNAP_ICON_SIZE);
            this.textures.set(kind, texture);

            const sprite = new Sprite(texture);
            sprite.visible = false;
            sprite.eventMode = "none";
            // Centre the sprite anchor
            sprite.anchor.set(anchor.x, anchor.y);


            this.layer.addChild(sprite);
            this.sprites.set(kind, sprite);
        }

        makeSprite("node", { x: 0.5, y: 0.5 }, (g, s) => {
            g.rect(0.5, 0.5, s - 1, s - 1).stroke(SNAP_STROKE);
        });

        makeSprite("origin", { x: 0.5, y: 0.5 }, (g, s) => {
            g.rect(0.5, 0.5, s - 1, s - 1).stroke(SNAP_STROKE);
        });

        makeSprite("axisH", { x: 0.5, y: 0 }, (g, s) => {
            g.moveTo(1, s - 1).lineTo(s - 2, s - 1).stroke(SNAP_STROKE);
        });

        makeSprite("axisV", { x: 0, y: 0.5 }, (g, s) => {
            g.moveTo(s - 1, 1).lineTo(s - 1, s - 2).stroke(SNAP_STROKE);
        });

        makeSprite("grid", { x: 0.5, y: 0.5 }, (g, s) => {
            g.rect(0.5, 0.5, s - 1, s - 1).stroke(SNAP_STROKE);
        });

        makeSprite("segment", { x: 0.5, y: 0.5 }, (g, s) => {
            g.moveTo(2, 2).lineTo(s - 2, s - 2).moveTo(s - 2, 2).lineTo(2, s - 2).stroke(SNAP_STROKE);
        });

        makeSprite("circle", { x: 0.5, y: 0.5 }, (g, s) => {
            g.rect(0.5, 0.5, s - 1, s - 1).stroke(SNAP_STROKE);
        });
    }

    public hideOverlay() {
        for (const sprite of this.sprites.values()) {
            sprite.visible = false;
        }
    }

    // TODO: Needs to be recalled on world pan/ zoom
    render(result: SnapResult) {
        // Hide previous snap sprite
        this.hideOverlay();

        if (result.kind === "none") return;

        const sprite = this.sprites.get(result.primary.kind);
        if (!sprite) return;


        const spriteRes = (result.residual) ? this.sprites.get(result.residual.kind) : undefined;

        // Transform snap point to screen space
        // Round down to avoid weird anti-aliasing 
        const pt = this.viewport.worldToScreen((result.residual) ? result.residual.p : result.p);
        sprite.position.set(Math.floor(pt.x), Math.floor(pt.y));
        sprite.visible = true;

        if (spriteRes) {
            spriteRes.position.set(Math.floor(pt.x), Math.floor(pt.y));
            spriteRes.visible = true;
        }
    }
}
