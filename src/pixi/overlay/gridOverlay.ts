import { Container, Graphics } from "pixi.js";

export interface GridOptions {
    step: number;
    axisColor: number;
    gridColor: number;
    thickness: number;
}

export class GridOverlay extends Container {
    private opts: GridOptions;
    private gfxGrid = new Graphics();
    private gfxAxis = new Graphics();

    constructor(opts?: Partial<GridOptions>) {
        super();

        this.opts = Object.assign(
            { step: 50, axisColor: 0xff6666, gridColor: 0x44444, thickness: 1 },
            opts
        );

        this.sortableChildren = true;
        this.addChild(this.gfxGrid, this.gfxAxis);
    }

    /**
   * Redraw grid and axes.
   * @param w – canvas width
   * @param h – canvas height
   * @param ox – X-axis origin in screen px (defaults to centre)
   * @param oy – Y-axis origin in screen px (defaults to centre)
   */
    public draw(w: number, h: number, ox: number = w * 0.5, oy: number = h * 0.5) {
        const { step, axisColor, gridColor, thickness } = this.opts;
        this.gfxGrid.clear();
        this.gfxAxis.clear();

        for (let x = ox % step; x <= w; x += step)
            this.gfxGrid.moveTo(x, 0).lineTo(x, h)
        for (let y = oy % step; y <= h; y += step)
            this.gfxGrid.moveTo(0, y).lineTo(w, y)

        this.gfxGrid.stroke({ width: thickness, color: gridColor, alpha: 0.5 });
        this.gfxGrid.eventMode = "none";

        this.gfxAxis
            .moveTo(0, oy).lineTo(w, oy)
            .moveTo(ox, 0).lineTo(ox, h)
            .stroke({ width: Math.max(2, thickness + 1), color: axisColor });
        this.gfxAxis.eventMode = "none";
    }

    public setStep(step: number) {
        this.opts.step = step;
    }
}
