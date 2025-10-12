/**
 * Single point of truth for quantizing zoom events to ticks
 *
 * Keeps all zoom affected services (grid overlay, snapping engine, etc.) integer driven
 * This way, there is no "drift" caused by incremental floating-point multiplies/ divides
 *
 * E.g. 
 * 6 zoom ticks in, followed by 6 zoom ticks out, will land the grid exactly back to where it was originally
 */

// How many ticks for each zoom step.
// E.g 1x -> 2x, 1x -> 0.5x
export const TICKS_PER_OCTAVE = 60;
export const ZOOM_BASE = Math.pow(2, 1 / TICKS_PER_OCTAVE);

export function scaleFromTicks(ticks: number): number {
    return Math.pow(2, ticks / TICKS_PER_OCTAVE);
}

export function ticksFromScale(scale: number): number {
    return Math.round(TICKS_PER_OCTAVE * Math.log2(scale));
}

/**
 * Provides wheel normalisation with accumulation
 *
 * Trackpads emit many small deltas; mice emit course steps
 * Accumulate deltas until a tick threshold is crossed
 */
export class ZoomAccumulator {
    // Threshold tuneables

    // # of px of wheel delta for 1 tick (deltaMode=0)
    private pixelThreshold = 2;
    // # of lines for 1 tick (deltaMode=1)
    private lineThreshold = 6;
    // # of pages for 1 tick (deltaMode=2)
    private pageThreshold = 1;

    private remainder = 0;

    // Flip for inverted scrolling
    private inverted = false;

    /** Adds a wheel event chunk to the accumulator and returns the tick count now */
    add(deltaY: number, deltaMode: 0 | 1 | 2): number {
        const s = this.inverted ? -1 : 1;

        const unit = (deltaMode === 0)
            ? this.pixelThreshold
            : (deltaMode === 1)
                ? this.lineThreshold
                : this.pageThreshold;

        // Normalise to "units" so that 1 unit ~ 1 tick
        this.remainder += s * (deltaY / unit);

        // Pull out whole ticks; keep fractional remainder to avoid drift
        const ticks = this.remainder > 0 ? Math.floor(this.remainder) : Math.ceil(this.remainder);

        this.remainder -= ticks;
        return ticks;
    }
}

