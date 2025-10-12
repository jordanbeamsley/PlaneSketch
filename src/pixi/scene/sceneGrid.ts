// Heavily inspired from this infinite grid example provided on stackoverflow:
// https://stackoverflow.com/questions/73035945/infinite-grid-zoom-symmetrical-zoom-in-and-out

import { DEFAULT_GRID_CONF } from "@/constants/canvas";
import type { Vec2 } from "@/models/vectors";
import { Container, Graphics, Point, type StrokeStyle } from "pixi.js";
import { scaleFromTicks, TICKS_PER_OCTAVE } from "../camera/zoomQuantizer";

export interface GridConfig {
    axisColor: { x: number, y: number },
    axisWidth: number,
    /** Preferred on-screen pixel size */
    medianCellSize: number,

    minorsPerMajor: number

    gridColor: number;

    // Grid alpha endpoints
    majorAlphaNearCombine: number;
    majorAlphaMid: number;
    majorAlphaNearSubdiv: number;

    minorAlphaNearCombine: number;
    minorAlphaMid: number;
    minorAlphaNearSubdiv: number;
}

export class SceneGrid extends Graphics {
    private cfg: GridConfig;

    /**
     * SCREEN-SPACE pixel size of one cell.
     * This value changes when we zoom (proportional to the scale factor),
     * and is snapped back to median when we promote/demote the step.
     */
    private cellSize: number;

    /** Grid offset calculated in screen space at each draw */
    private axisX = 0; axisY = 0;

    private getCameraTicks: () => number;

    constructor(getCameraTicks: () => number, cfg: GridConfig = DEFAULT_GRID_CONF,) {
        super();
        this.cfg = cfg;
        this.cellSize = cfg.medianCellSize;
        this.zIndex = -1000;
        this.eventMode = "none";

        this.getCameraTicks = getCameraTicks;
    }

    getStepPx() { return this.cellSize };
    getOffsetPx(): Vec2 { return { x: this.axisX, y: this.axisY } };

    draw(world: Container, viewportWidth: number, viewportHeight: number) {
        const ticksNow = this.getCameraTicks();

        // Calculate how many ticks to get to the start of the current octave
        // E.g 1*TPO, 2*TPO
        const baseOctaveTicks = Math.floor(ticksNow / TICKS_PER_OCTAVE) * TICKS_PER_OCTAVE;
        // Then calculate how many ticks "into" the octave we are
        const phaseTicks = ticksNow - baseOctaveTicks;

        // Calculate the scale factor from 1x to 2x
        const scaleFactor = scaleFromTicks(phaseTicks);
        this.cellSize = this.cfg.medianCellSize * scaleFactor;

        // Get the world origin projected to screen space
        const screenOrigin = world.toGlobal(new Point(0, 0));
        this.axisX = screenOrigin.x;
        this.axisY = screenOrigin.y;

        // Calculate how many grid lines we need to draw in each direction
        // We only draw lines that are visible in the viewport
        // 
        // minDivY/maxDivY: How many horizontal lines above/below the X-axis
        // minDivX/maxDivX: How many vertical lines left/right of the Y-axis
        const minDivY = Math.ceil((0 - this.axisY) / this.cellSize);
        const maxDivY = Math.floor((viewportHeight - this.axisY) / this.cellSize);
        const minDivX = Math.ceil((0 - this.axisX) / this.cellSize);
        const maxDivX = Math.floor((viewportWidth - this.axisX) / this.cellSize);

        // Clear any previous grid drawings
        this.clear();

        // Draw horizontal grid lines (along the y axis)
        for (let lineIndex = minDivY; lineIndex <= maxDivY; lineIndex++) {
            const y = this.axisY + lineIndex * this.cellSize;
            this.moveTo(0, y);
            this.lineTo(viewportWidth, y);
            this.stroke(this.getStrokeStyle(lineIndex));

        }

        // Draw vertical grid lines (along the x axis)
        for (let lineIndex = minDivX; lineIndex <= maxDivX; lineIndex++) {
            const x = this.axisX + lineIndex * this.cellSize;
            this.moveTo(x, 0);
            this.lineTo(x, viewportHeight);
            this.stroke(this.getStrokeStyle(lineIndex));
        }

        // Draw x axis
        this.moveTo(0, this.axisY);
        this.lineTo(viewportWidth, this.axisY);
        this.stroke({ color: this.cfg.axisColor.x, width: this.cfg.axisWidth })

        // Draw y axis
        this.moveTo(this.axisX, 0);
        this.lineTo(this.axisX, viewportHeight);
        this.stroke({ color: this.cfg.axisColor.y, width: this.cfg.axisWidth })

    }

    private getStrokeStyle(lineIndex: number): StrokeStyle {
        const isMajor = lineIndex % this.cfg.minorsPerMajor === 0;

        // Normalised zoom in current step (always in [0.5, 2] due to thresholds)
        const z = this.cellSize / this.cfg.medianCellSize;

        // Compute alpha from role and z
        const alpha = this.computeAlpha(isMajor ? "major" : "minor", z);

        return {
            color: this.cfg.gridColor,
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
}
