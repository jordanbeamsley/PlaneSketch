// Heavily inspired from this infinite grid example provided on stackoverflow:
// https://stackoverflow.com/questions/73035945/infinite-grid-zoom-symmetrical-zoom-in-and-out

import { Container, Graphics, Point, type StrokeStyle } from "pixi.js";

export interface GridConfig {
    axisColor: { x: number, y: number },
    axisWidth: number,
    /** Preferred on-screen pixel size */
    medianCellSize: number,

    minorsPerMajor: number

    // Grid alpha endpoints
    majorAlphaNearCombine: number;
    majorAlphaMid: number;
    majorAlphaNearSubdiv: number;

    minorAlphaNearCombine: number;
    minorAlphaMid: number;
    minorAlphaNearSubdiv: number;
}

const DEFAULTS: GridConfig = {
    axisColor: { x: 0xffffff, y: 0xffffff },
    axisWidth: 2,
    medianCellSize: 40,

    minorsPerMajor: 5,

    majorAlphaNearCombine: 0.7,
    majorAlphaMid: 0.6,
    majorAlphaNearSubdiv: 0.5,

    minorAlphaNearCombine: 0.05,
    minorAlphaMid: 0.10,
    minorAlphaNearSubdiv: 0.4
}

export class SceneGrid extends Graphics {
    private cfg: GridConfig;

    /**
     * SCREEN-SPACE pixel size of one cell.
     * This value changes when we zoom (proportional to the scale factor),
     * and is snapped back to median when we promote/demote the step.
     */
    private cellSize: number;

    /**
     * How many world units each grid cell represents
     * This creates the adaptive grid that shows "nice" numbers
     * Follows a 1,2,5 scale (e.g 1,2,5,10,20,50) for readable values at every zoom scale
     */
    private ratio: number = 1;

    /**
     * “Generation” counter to know which rung of 1–2–5 we are on.
     * We double/halve this so that log2(gen) % 3 cycles through 0,1,2 → (×2, ×2.5, ×2).
     */
    private gen: number = 1;

    /** Remember camera scale from the last draw so we can apply the scale factor */
    private prevScale: number | null = null;

    constructor(cfg: GridConfig = DEFAULTS) {
        super();
        this.cfg = cfg;
        this.cellSize = cfg.medianCellSize;
        this.zIndex = -1000;
        this.eventMode = "none";
    }

    draw(world: Container, viewportWidth: number, viewportHeight: number) {
        const currentScale = world.scale.x;

        // Update cellSize by how the scale changed from last frame
        // First check if first draw call and set a reference
        if (this.prevScale === null) this.prevScale = currentScale;

        const scaleFactor = currentScale / this.prevScale;
        this.prevScale = currentScale;

        this.cellSize *= scaleFactor;


        // First, check if we need to subdivide or combine the grid,
        // Use loops to catch fast user zooms, and potentially missed thresholds
        while (this.cellSize >= 2 * this.cfg.medianCellSize) {
            this.subdivide();
        }
        while (this.cellSize < this.cfg.medianCellSize / 2) {
            this.combine();
        }

        // Get the world origin projected to screen space
        const screenOrigin = world.toGlobal(new Point(0, 0));
        const axisX = screenOrigin.x;
        const axisY = screenOrigin.y;

        // Calculate how many grid lines we need to draw in each direction
        // We only draw lines that are visible in the viewport
        // 
        // minDivY/maxDivY: How many horizontal lines above/below the X-axis
        // minDivX/maxDivX: How many vertical lines left/right of the Y-axis
        const minDivY = Math.ceil((0 - axisY) / this.cellSize);
        const maxDivY = Math.floor((viewportHeight - axisY) / this.cellSize);
        const minDivX = Math.ceil((0 - axisX) / this.cellSize);
        const maxDivX = Math.floor((viewportWidth - axisX) / this.cellSize);

        // Clear any previous grid drawings
        this.clear();

        // Draw horizontal grid lines (along the y axis)
        for (let lineIndex = minDivY; lineIndex <= maxDivY; lineIndex++) {
            const y = Math.round(axisY + lineIndex * this.cellSize) + 0.5;
            this.moveTo(0, y);
            this.lineTo(viewportWidth, y);
            this.stroke(this.getStrokeStyle(lineIndex));

        }

        // Draw vertical grid lines (along the x axis)
        for (let lineIndex = minDivX; lineIndex <= maxDivX; lineIndex++) {
            const x = Math.round(axisX + lineIndex * this.cellSize) + 0.5;
            this.moveTo(x, 0);
            this.lineTo(x, viewportHeight);
            this.stroke(this.getStrokeStyle(lineIndex));
        }

        // Draw axis last so they're always on top
        this.drawAxis(screenOrigin.y, screenOrigin.x, viewportWidth, viewportHeight);
    }

    /**
    * Called when zooming in and cells become to large
    *
    * Each call: 
    * - Adjusts the ration based on which state we're in
    * - Doubles the generation
    * - Resets the cell size to median
    */
    private subdivide() {
        // Prevent floating-point drift
        this.ratio = parseFloat(this.ratio.toExponential(8));

        // Determine which state of the 1-2-5 cycle we're in
        // Math.log2(gen) tells us how many times we've doubled
        // Examples:
        // - gen = 1   → log2(1) = 0   → 0 % 3 = 0 (state 0)
        // - gen = 2   → log2(2) = 1   → 1 % 3 = 1 (state 1)
        // - gen = 4   → log2(4) = 2   → 2 % 3 = 2 (state 2)
        // - gen = 8   → log2(8) = 3   → 3 % 3 = 0 (state 0, cycle repeats)
        // - gen = 0.5 → log2(0.5) = -1 → |-1| % 3 = 1
        const modulo = Math.abs(Math.log2(this.gen)) % 3;

        // STATE 0: currently showing 1, 10, 100... units per cell
        // Next state should show 2, 20, 200... (multiply by 2)
        if (modulo === 0) this.ratio *= 2;

        // STATE 1: currently showing 2, 20, 200.. units per cell
        // Next state should show 5, 50, 500... (multiple by 2.5)
        else if (modulo === 1) this.ratio *= 2.5;

        // STATE 2: currently showing 5, 50, 500... units per cell
        // Next state should show 10, 100, 1000... (multiply by 2)
        else if (modulo === 2) this.ratio *= 2;

        // Every subdivide results in a doubling of generation
        this.gen *= 2;
        // Every subdivide resets cell spacing to median size
        this.cellSize = this.cfg.medianCellSize;
    }

    /**
    * Called when zooming out and cells become to small
    *
    * Reverses the pattern of subdivide (see this.subdivide for documentation)
    */
    private combine() {
        // Prevent floating-point drift
        this.ratio = parseFloat(this.ratio.toExponential(8));

        const modulo = Math.abs(Math.log2(this.gen)) % 3;

        if (modulo === 0) this.ratio /= 2;
        else if (modulo === 1) this.ratio /= 2.5;
        else if (modulo === 2) this.ratio /= 2;

        this.gen /= 2;
        this.cellSize = this.cfg.medianCellSize;
    }

    private getStrokeStyle(lineIndex: number): StrokeStyle {
        const isMajor = lineIndex % this.cfg.minorsPerMajor === 0;

        // Normalised zoom in current step (always in [0.5, 2] due to thresholds)
        const z = this.cellSize / this.cfg.medianCellSize;

        // Compute alpha from role and z
        const alpha = this.computeAlpha(isMajor ? "major" : "minor", z);

        return {
            color: 0xbfbfbf,
            alpha: alpha,
            pixelLine: true
        }
    }

    /**
     * Compute alpha based on line type (major/ minor) based on z = cellSize / median
     *
     * z maps to [0.5, 2] as code snaps to median then scales to boundaries
     * When z -> 0.5 (zooming out, about to combine): majors should dominate, minors should recede
     * When z -> 2 (zooming in, about to subdivide): minors should become more visible, majors recede a bit
     */
    private computeAlpha(role: "major" | "minor", z: number): number {
        if (role === "major") {
            if (z < 1) {
                // Lerp from COMBINE -> MID edge
                const t = this.remap01(z, 0.5, 1);
                return this.lerp(this.cfg.majorAlphaNearCombine, this.cfg.majorAlphaMid, t);
            } else {
                // Lerp from MID -> SUBDIV edge
                const t = this.remap01(z, 1, 2);
                return this.lerp(this.cfg.majorAlphaMid, this.cfg.majorAlphaNearSubdiv, t);
            }
        } else { // minor
            if (z < 1) {
                // Lerp from COMBINE -> MID edge
                const t = this.remap01(z, 0.5, 1);
                return this.lerp(this.cfg.minorAlphaNearCombine, this.cfg.minorAlphaMid, t);
            } else {
                // Lerp from MID -> SUBDIV edge
                const t = this.remap01(z, 1, 2);
                return this.lerp(this.cfg.minorAlphaMid, this.cfg.minorAlphaNearSubdiv, t);
            }
        }
    }

    // Small helpers for calculating alpha
    // Map x from [a,b] → [0,1], clamped
    private remap01(x: number, a: number, b: number): number {
        if (a === b) return 0;
        const t = (x - a) / (b - a);
        return Math.max(0, Math.min(1, t));
    }
    // Linear interpolation
    private lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }

    private drawAxis(axisY: number, axisX: number, viewportWidth: number, viewportHeight: number) {
        // Draw x axis
        this.moveTo(0, axisY);
        this.lineTo(viewportWidth, axisY);
        this.stroke({ color: this.cfg.axisColor.x, width: this.cfg.axisWidth })

        // Draw y axis
        this.moveTo(axisX, 0);
        this.lineTo(axisX, viewportHeight);
        this.stroke({ color: this.cfg.axisColor.y, width: this.cfg.axisWidth })
    }
}
